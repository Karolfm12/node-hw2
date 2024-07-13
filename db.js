const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://karolfm12:talking12@cluster0.e0s0opq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
