const SecurityEvent = require("../models/SecurityEvent");
const Alert = require("../models/Alert");

const WINDOW_MINUTES = 2880; // 48 hours to catch yesterday's events for testing
const THRESHOLD = 5;

async function detectSSHBruteForce() {
    console.log("🔍 Starting SSH brute force detection...");
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
    console.log(`📅 Looking for events since: ${windowStart.toISOString()}`);
    console.log(`🕐 Current time: ${new Date().toISOString()}`);

    // Debug: Count total FAILED_LOGIN events
    const totalEvents = await SecurityEvent.countDocuments({ event_type: "FAILED_LOGIN" });
    console.log(`📈 Total FAILED_LOGIN events in database: ${totalEvents}`);

    // Debug: Count events in our time window
    const windowEvents = await SecurityEvent.countDocuments({
        event_type: "FAILED_LOGIN",
        timestamp: { $gte: windowStart }
    });
    console.log(`📈 FAILED_LOGIN events in time window: ${windowEvents}`);

    const results = await SecurityEvent.aggregate([
        {
            $match: {
                event_type: "FAILED_LOGIN",
                timestamp: { $gte: windowStart },
                src_ip: { $exists: true }
            }
        },
        {
            $group: {
                _id: "$src_ip",
                count: { $sum: 1 },
                first_seen: { $min: "$timestamp" },
                last_seen: { $max: "$timestamp" },
                events: { $push: "$_id" }
            }
        },
        {
            $match: {
                count: { $gte: THRESHOLD }
            }
        }
    ]);

    console.log(`📊 Found ${results.length} IPs with >= ${THRESHOLD} failed login attempts`);

    if (results.length === 0) {
        console.log("✅ No SSH brute force patterns detected");
        return;
    }

    for (const hit of results) {
        console.log(`🎯 Checking IP ${hit._id}: ${hit.count} failed attempts`);

        // Prevent duplicate alerts
        const exists = await Alert.findOne({
            alert_type: "SSH_BRUTE_FORCE",
            source_ip: hit._id,
            status: "OPEN"
        });

        if (exists) {
            console.log(`⚠️ Alert already exists for IP ${hit._id}, skipping...`);
            continue;
        }

        try {
            const newAlert = await Alert.create({
                alert_type: "SSH_BRUTE_FORCE",
                severity: 4,
                source_ip: hit._id,
                event_count: hit.count,
                first_seen: hit.first_seen,
                last_seen: hit.last_seen,
                related_events: hit.events
            });

            console.log(`🚨 SSH brute force alert created! ID: ${newAlert._id}, IP: ${hit._id}, Count: ${hit.count}`);
        } catch (error) {
            console.error(`❌ Failed to create alert for IP ${hit._id}:`, error.message);
        }
    }
}

module.exports = detectSSHBruteForce;
