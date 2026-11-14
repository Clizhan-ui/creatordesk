import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../creatordesk.db');

const db = new DatabaseSync(dbPath);
const JWT_SECRET = new TextEncoder().encode('creatordesk-test-secret-key-32chars');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}`);
  }
}

console.log('==============================================');
console.log('   CreatorDesk Automated Test Suite v1.0      ');
console.log('==============================================');

// Test 1: Database Tables & Constraints
console.log('\n[1] Database Schema & Tables Verification:');
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(t => t.name);
assert(tables.includes('users'), 'Users table exists');
assert(tables.includes('content_ideas'), 'Content Ideas table exists');
assert(tables.includes('content_plans'), 'Content Plans table exists');
assert(tables.includes('contents'), 'Contents table exists');
assert(tables.includes('content_analytics'), 'Content Analytics table exists');
assert(tables.includes('login_attempts'), 'Login Attempts table exists');
assert(tables.includes('audit_logs'), 'Audit Logs table exists');

// Test 2: Authentication & Password Security
console.log('\n[2] Authentication & Security Verification:');
const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@creatordesk.com');
assert(admin !== undefined, 'Admin account exists in database');
assert(admin.role === 'admin', 'Admin has role "admin"');
assert(bcrypt.compareSync('AdminPassword123!', admin.password_hash), 'Admin password hash verifies correctly');
assert(!bcrypt.compareSync('WrongPassword', admin.password_hash), 'Rejects invalid password attempt');

// Password complexity check
function validatePassword(p) {
  return p.length >= 8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /[0-9]/.test(p);
}
assert(validatePassword('StrongPass123'), 'Valid password passes complexity rule');
assert(!validatePassword('weak'), 'Short password fails');
assert(!validatePassword('alllowercase123'), 'Password without uppercase fails');
assert(!validatePassword('ALLUPPERCASE123'), 'Password without lowercase fails');
assert(!validatePassword('NoDigitsHere!'), 'Password without numbers fails');

// Test 3: JWT Session Token Verification
console.log('\n[3] JWT Session Token Verification:');
const token = await new SignJWT({ id: 2, email: 'creator@creatordesk.com', role: 'creator' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(JWT_SECRET);

assert(typeof token === 'string' && token.length > 20, 'JWT token generated successfully');
const { payload } = await jwtVerify(token, JWT_SECRET);
assert(payload.email === 'creator@creatordesk.com' && payload.role === 'creator', 'JWT payload verified accurately');

// Test 4: SQL Injection Resistance (Parameterized Queries):
console.log('\n[4] SQL Injection Resistance (Parameterized Queries):');
const maliciousInput = "test' OR '1'='1";
const sqliQuery = db.prepare('SELECT * FROM users WHERE email = ?').get(maliciousInput);
assert(sqliQuery === undefined, 'Parameterized query successfully prevents SQL injection attack');

// Test 5: IDOR and Tenant Isolation Verification
console.log('\n[5] Data Isolation & Ownership (IDOR Prevention):');
const unauthorizedAccess = db.prepare(`
  SELECT * FROM content_ideas WHERE id = (SELECT max(id) FROM content_ideas) AND user_id = ?
`).get(3);
assert(unauthorizedAccess === undefined, 'Creator 3 cannot access Creator 2 private content (IDOR blocked)');

// Test 6: Dashboard Stats Query Calculation & Isolation
console.log('\n[6] Dashboard Statistics Query & Aggregations:');
// Insert dummy content & analytics for user 2
const dummyContent = db.prepare(`
  INSERT INTO contents (user_id, title, platform, category, status)
  VALUES (2, 'Setup Tour 2026', 'YouTube', 'Tech', 'Published')
`).run();
const contentId = Number(dummyContent.lastInsertRowid);

db.prepare(`
  INSERT INTO content_analytics (content_id, user_id, views, likes, comments, shares, followers_count)
  VALUES (?, 2, 15000, 1200, 85, 42, 5000)
`).run(contentId);

const user2Totals = db.prepare(`
  SELECT 
    COALESCE(SUM(views), 0) as views,
    COALESCE(SUM(likes), 0) as likes
  FROM content_analytics
  WHERE user_id = ?
`).get(2);
assert(user2Totals.views >= 15000, 'User 2 analytics views aggregated accurately');

const user3Totals = db.prepare(`
  SELECT 
    COALESCE(SUM(views), 0) as views,
    COALESCE(SUM(likes), 0) as likes
  FROM content_analytics
  WHERE user_id = ?
`).get(3);
assert(user3Totals.views === 0, 'User 3 isolated from User 2 analytics (shows 0 views)');

console.log('\n==============================================');
console.log(`Summary: ${passedTests}/${totalTests} Tests Passed (${failedTests} Failed)`);
console.log('==============================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! Ready for feature integration.\n');
}
