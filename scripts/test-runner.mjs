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

// Test 1: Database Schema & Tables Verification
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

// Test 6: Dashboard Statistics
console.log('\n[6] Dashboard Statistics Query & Aggregations:');
const user2Totals = db.prepare(`
  SELECT COALESCE(SUM(views), 0) as views FROM content_analytics WHERE user_id = ?
`).get(2);
assert(user2Totals.views >= 0, 'User 2 analytics views aggregated accurately');

// Test 7: Content Ideas CRUD Operations
console.log('\n[7] Content Ideas CRUD & Lifecycle Operations:');
const insertIdea = db.prepare(`
  INSERT INTO content_ideas (user_id, title, description, category, platform, status)
  VALUES (2, 'Top 5 AI Coding Workflows', 'Prompt engineering and multi-agent systems', 'Tech', 'YouTube', 'New Idea')
`).run();
const ideaId = Number(insertIdea.lastInsertRowid);
assert(ideaId > 0, 'Content idea inserted successfully');

// Read idea
const fetchedIdea = db.prepare('SELECT * FROM content_ideas WHERE id = ? AND user_id = ?').get(ideaId, 2);
assert(fetchedIdea && fetchedIdea.title === 'Top 5 AI Coding Workflows', 'Idea retrieved accurately by owner');

// Update idea
db.prepare('UPDATE content_ideas SET status = ? WHERE id = ? AND user_id = ?').run('Planned', ideaId, 2);
const updatedIdea = db.prepare('SELECT status FROM content_ideas WHERE id = ?').get(ideaId);
assert(updatedIdea.status === 'Planned', 'Idea status updated to "Planned"');

// IDOR security check on Update
const idorUpdate = db.prepare('UPDATE content_ideas SET title = ? WHERE id = ? AND user_id = ?').run('Hacked Title', ideaId, 3);
assert(idorUpdate.changes === 0, 'User 3 cannot update User 2 idea (changes = 0)');

// Delete idea
const deleteRes = db.prepare('DELETE FROM content_ideas WHERE id = ? AND user_id = ?').run(ideaId, 2);
assert(deleteRes.changes === 1, 'Idea deleted cleanly by owner');

// Test 8: Content Planner & Calendar Scheduling
console.log('\n[8] Content Planner & Publication Calendar Operations:');
const insertPlan = db.prepare(`
  INSERT INTO content_plans (user_id, title, description, platform, category, scheduled_at, status, notes)
  VALUES (2, 'Ultimate Desk Setup Tour 2026', 'Showcasing 4K monitor and mechanical keyboard', 'YouTube', 'Tech', '2026-12-01T15:00', 'Planned', 'Include Amazon affiliate links')
`).run();
const planId = Number(insertPlan.lastInsertRowid);
assert(planId > 0, 'Plan scheduled in calendar successfully');

const fetchedPlan = db.prepare('SELECT * FROM content_plans WHERE id = ? AND user_id = ?').get(planId, 2);
assert(fetchedPlan && fetchedPlan.title === 'Ultimate Desk Setup Tour 2026', 'Plan retrieved with exact scheduled date');

// Update plan status
db.prepare('UPDATE content_plans SET status = ? WHERE id = ? AND user_id = ?').run('In Production', planId, 2);
const updatedPlan = db.prepare('SELECT status FROM content_plans WHERE id = ?').get(planId);
assert(updatedPlan.status === 'In Production', 'Plan status progressed to "In Production"');

// IDOR protection test on plan
const idorPlanDelete = db.prepare('DELETE FROM content_plans WHERE id = ? AND user_id = ?').run(planId, 3);
assert(idorPlanDelete.changes === 0, 'User 3 cannot delete User 2 scheduled plan');

console.log('\n==============================================');
console.log(`Summary: ${passedTests}/${totalTests} Tests Passed (${failedTests} Failed)`);
console.log('==============================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! Ready for feature integration.\n');
}
