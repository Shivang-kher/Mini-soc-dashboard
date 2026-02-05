const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema(
    {
        alert_type: {
            type: String,
            required: true,
            index: true
        },
        severity: {
            type: Number,
            min: 1,
            max: 5
        },
        source_ip: {
            type: String,
            index: true
        },
        event_count: Number,
        first_seen: Date,
        last_seen: Date,
        related_events: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SecurityEvent"
            }
        ],
        status: {
            type: String,
            enum: ["OPEN", "INVESTIGATING", "CLOSED"],
            default: "OPEN"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Alert", AlertSchema);
