const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");

/**
 * GET /alerts
 * Fetch all alerts (latest first)
 */
router.get("/", async (req, res) => {
    try {
        const alerts = await Alert.find()
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /alerts/:id
 * Fetch single alert with related events
 */
router.get("/:id", async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate("related_events");

        if (!alert) {
            return res.status(404).json({ error: "Alert not found" });
        }

        res.json(alert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * PATCH /alerts/:id/status
 * Update alert status
 */
router.patch("/:id/status", async (req, res) => {
    const { status } = req.body;

    if (!["OPEN", "INVESTIGATING", "CLOSED"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
    }

    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        res.json(alert);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
