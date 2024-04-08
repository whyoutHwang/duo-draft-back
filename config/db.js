const { MongoClient } = require("mongodb");

exports.connectDB = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("Successfully connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
