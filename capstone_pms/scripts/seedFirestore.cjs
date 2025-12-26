#!/usr/bin/env node
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

function usageAndExit() {
  console.log('\nUsage: node scripts/seedFirestore.cjs [--serviceAccount /path/to/key.json] [--projectId your-project-id]');
  console.log('Environment: set GOOGLE_APPLICATION_CREDENTIALS or pass --serviceAccount.');
  process.exit(1);
}

const args = process.argv.slice(2);
let serviceAccountPath = null;
let projectId = null;
let resolvedProjectId = undefined;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--serviceAccount' && args[i+1]) { serviceAccountPath = args[i+1]; i++; }
  else if (args[i] === '--projectId' && args[i+1]) { projectId = args[i+1]; i++; }
  else if (args[i] === '--useEmulator') { process.env.USE_FIRESTORE_EMULATOR = '1'; }
  else if (args[i] === '--emulatorHost' && args[i+1]) { process.env.FIRESTORE_EMULATOR_HOST = args[i+1]; i++; }
  else if (args[i] === '--help' || args[i] === '-h') { usageAndExit(); }
}

if (process.env.USE_FIRESTORE_EMULATOR) {
  // Use Firestore emulator. Ensure host is set or default to localhost:8080
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
  console.log('Using Firestore emulator at', process.env.FIRESTORE_EMULATOR_HOST);
}

if (serviceAccountPath) {
  const absPath = path.isAbsolute(serviceAccountPath) ? serviceAccountPath : path.join(process.cwd(), serviceAccountPath);
  if (!fs.existsSync(absPath)) {
    console.error('Service account file not found:', absPath);
    process.exit(1);
  }
  // Load service account and use its project_id as a sensible default
  let sa;
  try {
    sa = require(absPath);
  } catch (e) {
    console.error('Failed to load service account JSON:', e.message);
    process.exit(1);
  }
  resolvedProjectId = projectId || sa.project_id || undefined;
  console.log('Service account loaded:');
  console.log('- project_id:', sa.project_id);
  console.log('- client_email:', sa.client_email);
  if (!resolvedProjectId && !process.env.USE_FIRESTORE_EMULATOR) {
    console.warn('Warning: no projectId provided and service account has no project_id. Calls may fail.');
  }
  try {
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: resolvedProjectId,
    });
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK:', e.message);
    process.exit(1);
  }
} else {
  // Use Application Default Credentials (ADC)
  // For emulator use ADC but ensure projectId is set (emulator ignores credentials)
  resolvedProjectId = projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'demo-project';
  admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: resolvedProjectId });
}

const db = admin.firestore();
const seedPath = path.join(__dirname, '..', 'firestore-seed.json');
if (!fs.existsSync(seedPath)) {
  console.error('Seed file not found at', seedPath);
  process.exit(1);
}

const raw = require(seedPath);

function isIsoDateString(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v);
}

function convertValues(obj) {
  if (Array.isArray(obj)) return obj.map(convertValues);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = convertValues(v);
    }
    return out;
  }
  if (isIsoDateString(obj)) return admin.firestore.Timestamp.fromDate(new Date(obj));
  return obj;
}

async function seedCollection(collectionName, docs) {
  if (!Array.isArray(docs)) return;
  console.log(`Seeding collection: ${collectionName} (${docs.length} documents)`);
  const BATCH_SIZE = 400; // keep below 500
  let batch = db.batch();
  let opCount = 0;
  let written = 0;

  async function commitBatch() {
    if (opCount === 0) return;
    await batch.commit();
    batch = db.batch();
    opCount = 0;
  }

  for (const doc of docs) {
    const copy = Object.assign({}, doc);
    // Prefer explicit `uid` for the document ID (useful for users/{uid}).
    const idCandidates = [copy.uid, copy.id, copy.employeeId, copy.employeeID, copy.employee_id];
    let docId = idCandidates.find(Boolean);
    if (docId && copy.id) delete copy.id;
    if (docId && copy.uid) delete copy.uid;

    const transformed = convertValues(copy);

    const ref = docId ? db.collection(collectionName).doc(String(docId)) : db.collection(collectionName).doc();
    batch.set(ref, transformed, { merge: false });
    opCount++;
    written++;

    if (opCount >= BATCH_SIZE) {
      await commitBatch();
    }
  }
  await commitBatch();
  console.log(`Seeded ${written} docs into ${collectionName}`);
}

(async () => {
  try {
    for (const [collection, docs] of Object.entries(raw)) {
      await seedCollection(collection, docs);
    }
    console.log('All seed operations completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err && err.message ? err.message : err);
    if (err && err.code === 5) {
      console.error('\nCommon causes for code=5 NOT_FOUND:');
      console.error('- The provided projectId is incorrect (typo like --projecId).');
      console.error('- Firestore API is not enabled / Firestore DB not provisioned for the project.');
      console.error('- Service account does not belong to the target project.');
      console.error('Check your `--projectId` spelling and that Firestore is enabled in the Firebase console.');
    }
    process.exit(2);
  }
})();
