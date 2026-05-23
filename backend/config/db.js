const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let useJSONDb = false;
const DATA_DIR = path.join(__dirname, '../data');

// Ensure JSON directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readCollection(name) {
  const fp = path.join(DATA_DIR, name.toLowerCase() + '.json');
  if (!fs.existsSync(fp)) { fs.writeFileSync(fp, '[]'); return []; }
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8') || '[]'); }
  catch { return []; }
}

function writeCollection(name, data) {
  const fp = path.join(DATA_DIR, name.toLowerCase() + '.json');
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

// ---- Minimal JSON model class ------------------------------------------------
class JSONModel {
  constructor(name) { this.name = name; }

  async find(query = {}) {
    const data = readCollection(this.name);
    if (Object.keys(query).length === 0) return data;
    return data.filter(item => Object.entries(query).every(([k, v]) => String(item[k]) === String(v)));
  }

  async findOne(query = {}) {
    const data = readCollection(this.name);
    return data.find(item => Object.entries(query).every(([k, v]) => String(item[k]) === String(v))) || null;
  }

  async findById(id) {
    const data = readCollection(this.name);
    return data.find(item => String(item._id) === String(id)) || null;
  }

  async create(doc) {
    const data = readCollection(this.name);
    const newDoc = { _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), createdAt: new Date(), ...doc };
    data.push(newDoc);
    writeCollection(this.name, data);
    return newDoc;
  }

  async findByIdAndUpdate(id, update, _opts) {
    const data = readCollection(this.name);
    const i = data.findIndex(item => String(item._id) === String(id));
    if (i === -1) return null;
    data[i] = { ...data[i], ...update, updatedAt: new Date() };
    writeCollection(this.name, data);
    return data[i];
  }

  async findOneAndUpdate(query, update, _opts) {
    const data = readCollection(this.name);
    const i = data.findIndex(item => Object.entries(query).every(([k, v]) => String(item[k]) === String(v)));
    if (i === -1) return null;
    data[i] = { ...data[i], ...update, updatedAt: new Date() };
    writeCollection(this.name, data);
    return data[i];
  }

  async findByIdAndDelete(id) {
    const data = readCollection(this.name);
    const i = data.findIndex(item => String(item._id) === String(id));
    if (i === -1) return null;
    const [deleted] = data.splice(i, 1);
    writeCollection(this.name, data);
    return deleted;
  }

  async deleteOne(query) {
    const data = readCollection(this.name);
    const i = data.findIndex(item => Object.entries(query).every(([k, v]) => String(item[k]) === String(v)));
    if (i === -1) return { deletedCount: 0 };
    data.splice(i, 1);
    writeCollection(this.name, data);
    return { deletedCount: 1 };
  }
}

// ---- DB connect --------------------------------------------------------------
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️  No MONGODB_URI. Using local JSON database fallback.');
    useJSONDb = true;
    return;
  }
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log('❇️  MongoDB connected successfully!');
    useJSONDb = false;
  } catch (err) {
    console.error('⚠️  MongoDB failed:', err.message);
    console.log('⚡  Switching to local JSON database fallback.');
    useJSONDb = true;
  }
};

const isJSONMode = () => useJSONDb;

// ---- Model factory -----------------------------------------------------------
// Returns a thin wrapper that delegates to Mongoose OR JSONModel at call-time.
function createModel(modelName, schema) {
  const methods = ['find','findOne','findById','create','findByIdAndUpdate','findOneAndUpdate','findByIdAndDelete','deleteOne'];
  const obj = {};
  methods.forEach(method => {
    obj[method] = function (...args) {
      if (useJSONDb) {
        return new JSONModel(modelName)[method](...args);
      }
      const mongoModel = mongoose.models[modelName] || mongoose.model(modelName, schema);
      // Mongoose query objects need .exec() or awaiting
      const result = mongoModel[method](...args);
      // Return thenable (mongoose query or promise)
      return result;
    };
  });
  return obj;
}

module.exports = { connectDB, isJSONMode, createModel };
