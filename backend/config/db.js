const dns = require('dns');
const mongoose = require('mongoose');

// Windows / some networks: Node's SRV lookup for mongodb+srv:// fails with querySrv ECONNREFUSED.
// Prefer IPv4 ordering; optional public DNS for SRV (disable with MONGO_DNS_USE_PUBLIC=false in .env).
if (process.env.MONGO_DNS_USE_PUBLIC !== 'false') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (_) {
    /* ignore */
  }
}
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in .env');
  }

  try {
    const conn = await mongoose.connect(uri, {
      family: 4,
      serverSelectionTimeoutMS: 20000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`.red.bold);
    throw error; // Throw error to let server.js catch it cleanly
  }
};

module.exports = connectDB;
