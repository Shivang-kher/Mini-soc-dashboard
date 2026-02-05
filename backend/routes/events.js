const express = require("express");
const router = express.Router();
const SecurityEvent = require("../models/SecurityEvent");

/**
 * GET /events
 * Query security events
 */
router.get("/", async (req, res) => {
    const {
        event_type,
        src_ip,
        lastMinutes = 60
    } = req.query;

    const since = new Date(Date.now() - lastMinutes * 60 * 1000);

    const query = {
        timestamp: { $gte: since }
    };

    if (event_type) query.event_type = event_type;
    if (src_ip) query.src_ip = src_ip;

    try {
        const events = await SecurityEvent.find(query)
            .sort({ timestamp: -1 })
            .limit(200);

        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
