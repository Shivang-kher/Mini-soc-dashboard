import { useEffect, useState } from "react";
import { fetchAlerts } from "../api/alerts";

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAlerts().then(data => {
      setAlerts(data);
      setLoading(false);
    });
  }, []);

  const active = alerts.filter(a => a.status === "OPEN");
  const high = active.filter(a => a.severity >= 4);
  const critical = active.filter(a => a.severity === 5);
  const resolved = alerts.filter(a => a.status === "RESOLVED");

  const StatCard = ({ title, value, icon, colorClass, subtitle, trend }) => (
    <div className="card stat-card">
      <div className="stat-card-body">
        <div className={`stat-icon ${colorClass}`}>{icon}</div>
        <div>
          <div className="stat-main-value">{loading ? "..." : value}</div>
          <div className="stat-subtitle">{title}</div>
          {subtitle && <div className="stat-subtitle mt-1">{subtitle}</div>}
          {typeof trend === "number" && (
            <div className={`stat-trend ${trend >= 0 ? "trend-positive" : "trend-negative"}`}>
              <span>{trend >= 0 ? "▲" : "▼"}</span>
              <span>{Math.abs(trend)}% from last hour</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {loading && (
        <div className="page-loading">
          <div className="progress-bar" />
        </div>
      )}
      
      <div className="stats-grid">
        <StatCard
          title="Active Alerts"
          value={active.length}
          icon="⚠️"
          colorClass="chip-warning"
          subtitle={`${high.length} high priority`}
          trend={12}
        />
        <StatCard
          title="High Severity"
          value={high.length}
          icon="🔥"
          colorClass="chip-error"
          subtitle={`${critical.length} critical`}
          trend={-5}
        />
        <StatCard
          title="Total Alerts"
          value={alerts.length}
          icon="📊"
          colorClass="chip-info"
          subtitle={`${resolved.length} resolved`}
          trend={8}
        />
        <StatCard
          title="Security Score"
          value="87"
          icon="🛡️"
          colorClass="chip-success"
          subtitle="Good standing"
          trend={3}
        />
      </div>

      <div className="dashboard-grid mt-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="chip chip-info chip-icon">🛰️</span> Recent Activity
            </div>
          </div>
          <div>
            <p className="muted-text">
              Real-time security events and alerts will appear here. Use the Alerts tab to drill into specific
              detections.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span className="chip chip-info chip-icon">📈</span> Quick Stats
            </div>
          </div>
          <div className="mt-2">
            <p className="muted-text">
              Response Time: <strong>2.3 min</strong>
            </p>
            <p className="muted-text mt-1">
              False Positives: <strong>3.2%</strong>
            </p>
            <p className="muted-text mt-1">
              System Health: <strong className="chip-success">Optimal</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
