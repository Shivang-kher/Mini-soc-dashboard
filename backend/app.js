require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const detectSSHBruteForce = require("./detection/sshBruteForce");


const app = express();

// 🔌 Connect to MongoDB
connectDB();

// 🧠 Middleware
app.use(cors());
app.use(express.json());

// 🩺 Health check
app.get("/health", async (req, res) => {
    res.json({
        status: "OK",
        service: "Mini-SOC Backend",
        time: new Date().toISOString(),
        detection: "SSH_BRUTE_FORCE",
        environment: process.env.NODE_ENV || "dev"
    });
});


// 🚨 Routes (we’ll add ingest next)
app.use("/ingest", require("./routes/ingest"));
app.use("/alerts", require("./routes/alerts"));
app.use("/events", require("./routes/events"));


setInterval(() => {
    console.log("🔍 Running SSH brute force detection...");
    detectSSHBruteForce().catch(err =>
        console.error("Detection error:", err.message)
    );
}, 30 * 1000); // every 30 seconds


// 🔥 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Mini-SOC backend running on port ${PORT}`);
});
