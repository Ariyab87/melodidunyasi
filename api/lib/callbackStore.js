// api/lib/callbackStore.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'callbacks.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db = {};
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { db = {}; }

function save() {
  try { fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); }
  catch (e) { console.error('[callbackStore] save error', e); }
}

exports.set = (jobId, rec) => {
  if (!jobId) return;
  db[jobId] = { ...(db[jobId] || {}), ...rec, updatedAt: new Date().toISOString() };
  save();
};

exports.get = (jobId) => db[jobId] || null;
