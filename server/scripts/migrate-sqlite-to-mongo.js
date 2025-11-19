const { syncLocalToMongo } = require("../lib/mongo-sync");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/adminflow";
const MONGODB_DB = process.env.MONGODB_DB;

syncLocalToMongo({ uri: MONGODB_URI, dbName: MONGODB_DB })
  .then((summary) => {
    console.log("Mongo migration complete.", summary);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Mongo migration failed:", err);
    process.exit(1);
  });
