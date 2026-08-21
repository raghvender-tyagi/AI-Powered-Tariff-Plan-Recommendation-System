const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const env = require("../config/env");
const { COLLECTIONS, getModel } = require("../models");

/**
 * A single repository interface with two interchangeable drivers.
 *
 * - "mongo": the real MERN persistence layer (Mongoose models above).
 * - "file" : a durable JSON file store used only when MongoDB is not
 *            reachable, so the full frontend -> backend -> ML -> engine
 *            flow can still be run and tested on a machine with no
 *            mongod installed.
 *
 * All business logic goes through these functions, so switching driver
 * changes nothing above this file.
 */

const COLLECTION_NAMES = Object.keys(COLLECTIONS);

const state = {
  driver: null, // "mongo" | "file"
  connected: false,
  reason: null
};

// ---------------------------------------------------------------
// File driver
// ---------------------------------------------------------------

const cache = new Map();

function fileFor(collection) {
  return path.join(env.fileStoreDir, `${collection}.json`);
}

function loadFile(collection) {
  if (cache.has(collection)) return cache.get(collection);

  const filePath = fileFor(collection);
  let docs = [];

  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (Array.isArray(parsed)) docs = parsed;
    } catch {
      docs = [];
    }
  }

  cache.set(collection, docs);
  return docs;
}

function persistFile(collection) {
  fs.mkdirSync(env.fileStoreDir, { recursive: true });
  fs.writeFileSync(
    fileFor(collection),
    JSON.stringify(loadFile(collection), null, 2),
    "utf8"
  );
}

function matches(doc, query) {
  return Object.entries(query || {}).every(([key, expected]) => {
    const actual = doc[key];

    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if ("$in" in expected) return expected.$in.some((v) => String(v) === String(actual));
      if ("$ne" in expected) return String(actual) !== String(expected.$ne);
      return false;
    }

    if (Array.isArray(actual)) return actual.some((v) => String(v) === String(expected));
    return String(actual) === String(expected);
  });
}

function sortDocs(docs, sort) {
  if (!sort) return docs;
  const [field, direction] = Object.entries(sort)[0];
  return [...docs].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    const cmp = av > bv ? 1 : -1;
    return direction < 0 ? -cmp : cmp;
  });
}

const fileDriver = {
  async find(collection, query = {}, options = {}) {
    let docs = loadFile(collection).filter((doc) => matches(doc, query));
    docs = sortDocs(docs, options.sort);
    if (options.limit) docs = docs.slice(0, options.limit);
    return docs.map((doc) => ({ ...doc }));
  },

  async findById(collection, id) {
    const doc = loadFile(collection).find((item) => String(item._id) === String(id));
    return doc ? { ...doc } : null;
  },

  async count(collection, query = {}) {
    return loadFile(collection).filter((doc) => matches(doc, query)).length;
  },

  async insertMany(collection, docs) {
    const existing = loadFile(collection);
    existing.push(...docs.map((doc) => ({ ...doc })));
    persistFile(collection);
    return docs.length;
  },

  async upsert(collection, doc) {
    const docs = loadFile(collection);
    const index = docs.findIndex((item) => String(item._id) === String(doc._id));
    if (index === -1) docs.push({ ...doc });
    else docs[index] = { ...docs[index], ...doc };
    persistFile(collection);
    return { ...doc };
  },

  async updateById(collection, id, patch) {
    const docs = loadFile(collection);
    const index = docs.findIndex((item) => String(item._id) === String(id));
    if (index === -1) return null;
    docs[index] = { ...docs[index], ...patch };
    persistFile(collection);
    return { ...docs[index] };
  },

  async clear(collection) {
    cache.set(collection, []);
    persistFile(collection);
  }
};

// ---------------------------------------------------------------
// Mongo driver
// ---------------------------------------------------------------

const mongoDriver = {
  async find(collection, query = {}, options = {}) {
    let cursor = getModel(collection).find(query).lean();
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.limit) cursor = cursor.limit(options.limit);
    return cursor.exec();
  },

  async findById(collection, id) {
    return getModel(collection).findById(id).lean().exec();
  },

  async count(collection, query = {}) {
    return getModel(collection).countDocuments(query).exec();
  },

  async insertMany(collection, docs) {
    if (docs.length === 0) return 0;
    await getModel(collection).insertMany(docs, { ordered: false });
    return docs.length;
  },

  async upsert(collection, doc) {
    return getModel(collection)
      .findByIdAndUpdate(doc._id, doc, { upsert: true, new: true, lean: true })
      .exec();
  },

  async updateById(collection, id, patch) {
    return getModel(collection)
      .findByIdAndUpdate(id, patch, { new: true, lean: true })
      .exec();
  },

  async clear(collection) {
    await getModel(collection).deleteMany({}).exec();
  }
};

// ---------------------------------------------------------------
// Connection
// ---------------------------------------------------------------

let connecting = null;

async function attemptConnect() {
  try {
    mongoose.set("strictQuery", false);
    // bufferCommands:false makes a half-open connection fail fast instead of
    // queueing every query for 10s before timing out.
    mongoose.set("bufferCommands", false);

    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: env.mongoConnectTimeoutMs
    });

    // connect() resolving is not proof the server answers — ping it.
    await mongoose.connection.db.admin().command({ ping: 1 });

    state.driver = "mongo";
    state.connected = true;
    state.reason = `Connected to MongoDB at ${env.mongoUri}`;
    console.log(`[db] ${state.reason}`);
    return state;
  } catch (error) {
    // Drop the half-open connection so nothing later buffers against it.
    try {
      await mongoose.disconnect();
    } catch {
      /* already down */
    }

    if (!env.allowFileStoreFallback) {
      throw new Error(`MongoDB connection failed: ${error.message}`);
    }

    state.driver = "file";
    state.connected = false;
    state.reason = `MongoDB unreachable (${error.message}). Using durable JSON file store at ${env.fileStoreDir}.`;
    console.warn(`[db] ${state.reason}`);
    fs.mkdirSync(env.fileStoreDir, { recursive: true });
    return state;
  }
}

async function connect() {
  if (state.driver) return state;
  if (!connecting) connecting = attemptConnect().finally(() => {
    connecting = null;
  });
  return connecting;
}

async function disconnect() {
  if (state.driver === "mongo") await mongoose.disconnect();
  state.driver = null;
  state.connected = false;
}

function driver() {
  if (!state.driver) throw new Error("Database not initialised — call connect() first.");
  return state.driver === "mongo" ? mongoDriver : fileDriver;
}

const api = {};
for (const method of [
  "find",
  "findById",
  "count",
  "insertMany",
  "upsert",
  "updateById",
  "clear"
]) {
  api[method] = (...args) => driver()[method](...args);
}

module.exports = {
  ...api,
  connect,
  disconnect,
  COLLECTION_NAMES,
  status: () => ({ driver: state.driver, connected: state.connected, detail: state.reason })
};
