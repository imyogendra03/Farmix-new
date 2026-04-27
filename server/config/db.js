const mongoose = require('mongoose');

let listenersRegistered = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const registerConnectionListeners = () => {
  if (listenersRegistered) {
    return;
  }

  mongoose.connection.on('connected', () => {
    console.log(`[MongoDB] Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Reconnected');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected');
  });

  mongoose.connection.on('error', (error) => {
    console.error(`[MongoDB] Connection error: ${error.message}`);
  });

  listenersRegistered = true;
};

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MongoDB connection string is missing. Set MONGODB_URI or MONGO_URI.');
  }

  registerConnectionListeners();

  const maxRetries = Number(process.env.MONGO_CONNECT_MAX_RETRIES || 5);
  const retryDelayMs = Number(process.env.MONGO_RETRY_DELAY_MS || 5000);
  const serverSelectionTimeoutMS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000);

  const connectOptions = {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    serverSelectionTimeoutMS,
    socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000)
  };

  let attempt = 0;
  let lastError;

  while (attempt < maxRetries) {
    attempt += 1;

    try {
      console.log(`[MongoDB] Connection attempt ${attempt}/${maxRetries}`);
      const conn = await mongoose.connect(mongoUri, connectOptions);
      return conn;
    } catch (error) {
      lastError = error;
      console.error(`[MongoDB] Attempt ${attempt} failed: ${error.message}`);

      if (attempt >= maxRetries) {
        break;
      }

      console.log(`[MongoDB] Retrying in ${retryDelayMs}ms...`);
      await sleep(retryDelayMs);
    }
  }

  throw new Error(`MongoDB connection failed after ${maxRetries} attempts: ${lastError.message}`);
};

module.exports = connectDB;
