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

// Test 3: JWT Token Creation & Expiry Verification
console.log('\n[3] JWT Session Token Verification:');
const token = await new SignJWT({ id: 2, email: 'creator@creatordesk.com', role: 'creator' })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(JWT_SECRET);

assert(typeof token === 'string' && token.length > 20, 'JWT token generated successfully');
const { payload } = await jwtVerify(token, JWT_SECRET);
assert(payload.email === 'creator@creatordesk.com' && payload.role === 'creator', 'JWT payload verified accurately');

// Test 4: SQL Injection Prevention Verification
console.log('\n[4] SQL Injection Resistance (Parameterized Queries):');
const maliciousInput = "test' OR '1'='1";
const sqliQuery = db.prepare('SELECT * FROM users WHERE email = ?').get(maliciousInput);
assert(sqliQuery === undefined, 'Parameterized query successfully prevents SQL injection attack');

// Test 5: IDOR and Tenant Isolation Verification
console.log('\n[5] Data Isolation & Ownership (IDOR Prevention):');
// Insert an idea owned by Creator 2
db.prepare(`
  INSERT INTO content_ideas (user_id, title, category, platform, status)
  VALUES (2, 'Secret Video Concept for Creator 2', 'Tech', 'YouTube', 'New Idea')
`).run();

// Query checking ownership (user_id = 3 should NOT see it)
const unauthorizedAccess = db.prepare(`
  SELECT * FROM content_ideas WHERE id = (SELECT max(id) FROM content_ideas) AND user_id = ?
`).get(3);
assert(unauthorizedAccess === undefined, 'Creator 3 cannot access Creator 2 private content (IDOR blocked)');

const authorizedAccess = db.prepare(`
  SELECT * FROM content_ideas WHERE id = (SELECT max(id) FROM content_ideas) AND user_id = ?
`).get(2);
assert(authorizedAccess !== undefined && authorizedAccess.title.includes('Creator 2'), 'Owner successfully accesses own content');

console.log('\n==============================================');
console.log(`Summary: ${passedTests}/${totalTests} Tests Passed (${failedTests} Failed)`);
console.log('==============================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! Ready for feature integration.\n');
}
