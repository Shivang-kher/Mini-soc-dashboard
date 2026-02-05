const mongoose = require("mongoose");

const connectDB = async () => {
    try {

        console.log("Connecting to MongoDB with URI:", process.env.MONGO_URI);
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: "mini_soc",
            autoIndex: true
        });

        console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("🔴 MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
