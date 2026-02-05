const express = require("express");
const router = express.Router();
const SecurityEvent = require("../models/SecurityEvent");

// 🚨 Ingest Security Events
router.post("/", async (req, res) => {
    try {
        const {
            event_type,
            event_category,
            raw_log,
            source_host,
            timestamp,
            severity,
            confidence,
            username,
            src_ip,
            dest_port,
            protocol,
            detection_rule,
            correlation_id,
            attack_phase,
            metadata
        } = req.body;

        // 🔒 Minimal validation (SOC rule)
        if (!event_type || !raw_log || !source_host) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields: event_type, raw_log, source_host"
            });
        }

        // 🧠 Create immutable event
        const event = await SecurityEvent.create({
            event_type,
            event_category: event_category || "UNKNOWN",
            raw_log,
            source_host,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            severity: severity || 1,
            confidence: confidence || 0.5,
            username,
            src_ip,
            dest_port,
            protocol,
            detection_rule,
            correlation_id,
            attack_phase,
            metadata
        });

        // ⚡ Fast ACK (agents move on)
        return res.status(201).json({
            status: "ok",
            event_id: event._id
        });
    } catch (error) {
        console.error("🚨 Ingest error:", error.message);

        return res.status(500).json({
            status: "error",
            message: "Failed to ingest event"
        });
    }
});

module.exports = router;
