const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

function getArg(flag, def = null) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return def;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith("--")) return def;
  return next;
}
function hasFlag(flag) {
  return process.argv.includes(flag);
}

const seedFile = getArg("--file", path.join(process.cwd(), "firestore-seed.json"));
const reseed = hasFlag("--reseed");
const serviceAccountPath = getArg("--serviceAccount", null);
const projectId = getArg("--projectId", null);

if (!serviceAccountPath) {
  console.error("Missing --serviceAccount");
  process.exit(1);
}
if (!fs.existsSync(seedFile)) {
  console.error("Seed file not found:", seedFile);
  process.exit(1);
}

const saAbs = path.isAbsolute(serviceAccountPath)
  ? serviceAccountPath
  : path.join(process.cwd(), serviceAccountPath);

if (!fs.existsSync(saAbs)) {
  console.error("Service account JSON not found:", saAbs);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(saAbs)),
  ...(projectId ? { projectId } : {}),
});

const db = admin.firestore();
const { parse } = require("jsonc-parser");
const seedRaw = fs.readFileSync(seedFile, "utf8");
const seed = parse(seedRaw);

function isDateString(v) {
  if (typeof v !== "string") return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(v)) return true;
  return false;
}
function toTimestamp(v) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return admin.firestore.Timestamp.fromDate(new Date(`${v}T00:00:00Z`));
  }
  return admin.firestore.Timestamp.fromDate(new Date(v));
}
function convertDatesDeep(x) {
  if (Array.isArray(x)) return x.map(convertDatesDeep);
  if (x && typeof x === "object") {
    const out = {};
    for (const [k, v] of Object.entries(x)) out[k] = convertDatesDeep(v);
    return out;
  }
  if (isDateString(x)) return toTimestamp(x);
  return x;
}

function isArrayOfObjects(v) {
  return Array.isArray(v) && v.length > 0 && v.every((it) => it && typeof it === "object" && !Array.isArray(it));
}
function chooseDocId(obj, fallbackIndex) {
  const candidates = [obj.id, obj.docId].filter(Boolean);
  return candidates.length ? String(candidates[0]) : `auto_${fallbackIndex}`;
}

async function deleteCollectionRecursive(colRef, batchSize = 200) {
  const snap = await colRef.limit(batchSize).get();
  if (snap.empty) return;

  for (const docSnap of snap.docs) {
    const subs = await docSnap.ref.listCollections();
    for (const sub of subs) await deleteCollectionRecursive(sub, batchSize);
    await docSnap.ref.delete();
  }
  if (snap.size >= batchSize) await deleteCollectionRecursive(colRef, batchSize);
}

async function writeDocWithSubcollections(docRef, data) {
  const body = {};
  const subs = [];

  for (const [k, v] of Object.entries(data)) {
    if (isArrayOfObjects(v)) subs.push({ name: k, docs: v });
    else body[k] = v;
  }

  await docRef.set(convertDatesDeep(body), { merge: false });

  for (const sub of subs) {
    const subRef = docRef.collection(sub.name);
    for (let i = 0; i < sub.docs.length; i++) {
      const child = { ...sub.docs[i] };
      const childId = chooseDocId(child, i);
      delete child.id;
      await writeDocWithSubcollections(subRef.doc(childId), child);
    }
  }
}

async function seedTopCollection(name, docs) {
  if (!Array.isArray(docs)) return;

  console.log(`\nSeeding ${name} (${docs.length})`);
  const colRef = db.collection(name);

  if (reseed) {
    console.log(`--reseed: deleting ${name} recursively...`);
    await deleteCollectionRecursive(colRef);
  }

  for (let i = 0; i < docs.length; i++) {
    const item = { ...docs[i] };
    const docId = chooseDocId(item, i);
    delete item.id;
    await writeDocWithSubcollections(colRef.doc(docId), item);
    console.log(`  ✔ ${name}/${docId}`);
  }
}

(async () => {
  try {
    const keys = Object.keys(seed);

    keys.sort((a, b) => (a === "users" ? -1 : b === "users" ? 1 : 0));

    for (const name of keys) {
      await seedTopCollection(name, seed[name]);
    }

    console.log("\n Seed complete (legacy IDs mode).");
    process.exit(0);
  } catch (err) {
    console.error("\n Error:", err?.message || err);
    process.exit(2);
  }
})();
