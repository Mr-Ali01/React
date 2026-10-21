import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// Mock localStorage for node environment
const localStorageStore = {};
global.localStorage = {
  getItem: (key) => localStorageStore[key] || null,
  setItem: (key, val) => { localStorageStore[key] = String(val); },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]); }
};

// Import contact service
import { contactService, SUBJECT_OPTIONS, MAX_MESSAGE_LENGTH } from '../src/services/contactService.js';

console.log('--- TEST 1: Validation Rules ---');
// 1. Empty form
const emptyVal = contactService.validate({ fullName: '', email: '', subject: '', message: '' });
assert.strictEqual(emptyVal.isValid, false, 'Empty form should be invalid');
assert.ok(emptyVal.errors.fullName, 'Should have fullName error');
assert.ok(emptyVal.errors.email, 'Should have email error');
assert.ok(emptyVal.errors.subject, 'Should have subject error');
assert.ok(emptyVal.errors.message, 'Should have message error');

// 2. Invalid Email
const invalidEmail = contactService.validate({
  fullName: 'John Doe',
  email: 'not-an-email',
  subject: 'Calculator Support',
  message: 'This is a test message to verify the minimum characters.'
});
assert.strictEqual(invalidEmail.isValid, false, 'Invalid email should fail validation');
assert.ok(invalidEmail.errors.email, 'Should flag invalid email');

// 3. Message too short
const shortMsg = contactService.validate({
  fullName: 'John Doe',
  email: 'student@osmania.ac.in',
  subject: 'Calculator Support',
  message: 'short'
});
assert.strictEqual(shortMsg.isValid, false, 'Short message should fail validation');
assert.ok(shortMsg.errors.message, 'Should flag message length < 10');

// 4. Message exceeds 500 chars
const longMsg = contactService.validate({
  fullName: 'John Doe',
  email: 'student@osmania.ac.in',
  subject: 'Calculator Support',
  message: 'A'.repeat(501)
});
assert.strictEqual(longMsg.isValid, false, 'Message > 500 characters should fail');
assert.ok(longMsg.errors.message.includes('500'), 'Should mention 500 character limit');

// 5. Valid submission payload
const validPayload = {
  fullName: 'Sai Krishna',
  email: 'sai.krishna@jntuh.ac.in',
  subject: 'University Information',
  message: 'Could you please add support for JNTUH R22 M.Tech regulations? Thank you!'
};
const validVal = contactService.validate(validPayload);
assert.strictEqual(validVal.isValid, true, 'Valid form should pass validation');
assert.strictEqual(Object.keys(validVal.errors).length, 0);

console.log('✓ Validation rules verified');

console.log('--- TEST 2: Local Submission Flow & Ticket ID ---');
async function testSubmission() {
  const result = await contactService.submitMessage(validPayload);
  assert.strictEqual(result.success, true, 'Submission should succeed');
  assert.strictEqual(result.mode, 'local_queue', 'Mode should be local_queue when no API URL is set');
  assert.ok(result.ticketId.startsWith('RP-TICK-'), 'Ticket ID should have standard prefix');
  
  const queries = contactService.getAllQueries();
  assert.strictEqual(queries.length, 1, 'Should have saved 1 query in queue');
  assert.strictEqual(queries[0].fullName, validPayload.fullName);
  assert.strictEqual(queries[0].email, validPayload.email);
  assert.strictEqual(queries[0].subject, validPayload.subject);
  assert.strictEqual(queries[0].status, 'Open');
  assert.ok(queries[0].createdAt);
  console.log('✓ Local queue submission and ticket ID verified:', result.ticketId);
}

testSubmission().then(() => {
  console.log('--- TEST 3: Route & Component Registration ---');
  const appFile = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
  assert.ok(appFile.includes("import Contact from './pages/Contact'"), 'App.jsx must import Contact');
  assert.ok(appFile.includes('<Route path="/contact" element={<Contact />} />'), 'App.jsx must register /contact route');

  const contactFile = fs.readFileSync(path.resolve('src/pages/Contact/index.jsx'), 'utf-8');
  assert.ok(contactFile.includes("We're Here to"), 'Hero heading must match');
  assert.ok(contactFile.includes("Send Us a Message"), 'Message card must exist');
  assert.ok(contactFile.includes("Get in Touch"), 'Get in touch card must exist');
  assert.ok(contactFile.includes("Find Us"), 'Find us card must exist');
  assert.ok(contactFile.includes("Common Topics"), 'Common topics must exist');
  assert.ok(contactFile.includes("Frequently Asked Questions"), 'FAQ accordion must exist');
  assert.ok(contactFile.includes("support@resultpoint.in"), 'Verified email must be present');
  assert.ok(contactFile.includes("Hyderabad, Telangana, India"), 'Verified location must be present');

  console.log('✓ All Contact Us component and route assertions passed!');
}).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
