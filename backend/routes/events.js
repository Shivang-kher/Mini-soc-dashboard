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
        lastMinutes,
        start,
        end
    } = req.query;

    const query = {};

    // Optional time filters:
    // - If `start` and/or `end` provided (ISO strings), use them.
    // - Else if `lastMinutes` provided, use a relative window.
    if (start || end) {
        query.timestamp = {};
        if (start) query.timestamp.$gte = new Date(start);
        if (end) query.timestamp.$lte = new Date(end);
    } else if (lastMinutes) {
        const since = new Date(Date.now() - lastMinutes * 60 * 1000);
        query.timestamp = { $gte: since };
    }

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
