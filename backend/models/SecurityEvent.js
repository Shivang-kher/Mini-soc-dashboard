const mongoose = require("mongoose");

const SecurityEventSchema = new mongoose.Schema(
    {
        // 🟦 Core Event Metadata
        event_type: {
            type: String,
            required: true,
            index: true
        },
        event_category: {
            type: String,
            required: true,
            index: true
        },
        severity: {
            type: Number,
            min: 1,
            max: 5,
            default: 1
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.5
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        },
        raw_log: {
            type: String,
            required: true
        },

        // 🟩 Source Context
        source_host: {
            type: String,
            required: true,
            index: true
        },
        environment: {
            type: String,
            enum: ["LAB", "PROD"],
            default: "LAB"
        },
        agent_version: {
            type: String,
            default: "1.0.0"
        },

        // 🟨 Actor Context
        username: {
            type: String,
            index: true
        },
        user_type: {
            type: String,
            enum: ["SYSTEM", "HUMAN"]
        },
        is_privileged: {
            type: Boolean,
            default: false
        },
        auth_method: {
            type: String,
            enum: ["PASSWORD", "KEY"]
        },

        // 🟥 Network Context
        src_ip: {
            type: String,
            index: true
        },
        src_port: Number,
        dest_port: Number,
        protocol: {
            type: String,
            enum: ["TCP", "UDP"]
        },

        // 🟪 Detection & Correlation
        detection_rule: String,
        correlation_id: {
            type: String,
            index: true
        },
        attack_phase: {
            type: String,
            enum: [
                "RECONNAISSANCE",
                "INITIAL_ACCESS",
                "EXECUTION",
                "PERSISTENCE",
                "PRIV_ESC",
                "LATERAL_MOVEMENT"
            ]
        },

        // 🧠 Future-proof bucket
        metadata: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    {
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
            expires: "7d"
        },
    }
);

module.exports = mongoose.model("SecurityEvent", SecurityEventSchema);
