import { useEffect, useMemo, useState } from "react";
import { fetchAlerts } from "../api/alerts";
import { fetchEvents } from "../api/events";
import SeverityChip from "../components/SeverityChip";

function toISO(date) {
  return new Date(date).toISOString();
}

function severityMax(alerts) {
  return alerts.reduce((m, a) => Math.max(m, Number(a.severity || 1)), 1);
}

function statusRollup(alerts) {
  // Most urgent first
  const statuses = new Set(alerts.map((a) => a.status));
  if (statuses.has("OPEN")) return "OPEN";
  if (statuses.has("INVESTIGATING")) return "INVESTIGATING";
  return "CLOSED";
}

function groupAlertsIntoIncidents(alerts) {
  // V1 grouping heuristic: by (alert_type, source_ip). Simple + deterministic.
  const map = new Map();
  for (const alert of alerts) {
    const key = `${alert.alert_type || "UNKNOWN"}|${alert.source_ip || "unknown"}`;
    const existing = map.get(key) || [];
    existing.push(alert);
    map.set(key, existing);
  }

  const incidents = [];
  for (const [key, groupedAlerts] of map.entries()) {
    const [alert_type, source_ip] = key.split("|");

    const firstSeen = groupedAlerts
      .map((a) => a.first_seen || a.createdAt)
      .filter(Boolean)
      .map((d) => new Date(d))
      .sort((a, b) => a - b)[0];

    const lastSeen = groupedAlerts
      .map((a) => a.last_seen || a.createdAt)
      .filter(Boolean)
      .map((d) => new Date(d))
      .sort((a, b) => b - a)[0];

    const sev = severityMax(groupedAlerts);
    const status = statusRollup(groupedAlerts);
    const totalEvents = groupedAlerts.reduce((sum, a) => sum + Number(a.event_count || 0), 0);

    incidents.push({
      id: encodeURIComponent(key),
      incident_key: key,
      title: alert_type,
      source_ip,
      status,
      severity: sev,
      alert_count: groupedAlerts.length,
      event_count: totalEvents,
      first_seen: firstSeen ? firstSeen.toISOString() : null,
      last_seen: lastSeen ? lastSeen.toISOString() : null,
      alerts: groupedAlerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    });
  }

  // Sort newest first by last_seen fallback createdAt
  incidents.sort((a, b) => new Date(b.last_seen || 0) - new Date(a.last_seen || 0));
  return incidents;
}

export default function Incidents() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentEvents, setIncidentEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (e) {
      console.error("Failed to load alerts:", e);
    } finally {
      setLoading(false);
    }
  };

  const incidents = useMemo(() => groupAlertsIntoIncidents(alerts), [alerts]);

  const filteredIncidents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return incidents.filter((i) => {
      const matchesSearch =
        term === "" ||
        i.title?.toLowerCase().includes(term) ||
        i.source_ip?.toLowerCase().includes(term);

      const matchesStatus = statusFilter === "all" || i.status === statusFilter;
      const matchesSeverity = severityFilter === "all" || String(i.severity) === severityFilter;
      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [incidents, searchTerm, statusFilter, severityFilter]);

  const openIncident = async (incident) => {
    setSelectedIncident(incident);
    setIncidentEvents([]);
    setModalOpen(true);
    setEventsLoading(true);

    try {
      // Fetch events that belong to this incident window + source IP.
      // We use `start/end` so we’re not relying on `lastMinutes` defaults.
      const start = incident.first_seen ? new Date(incident.first_seen) : null;
      const end = incident.last_seen ? new Date(incident.last_seen) : null;

      // Add a small buffer (5 minutes) to capture context around the incident.
      const startBuf = start ? new Date(start.getTime() - 5 * 60 * 1000) : null;
      const endBuf = end ? new Date(end.getTime() + 5 * 60 * 1000) : null;

      const qs = new URLSearchParams({
        src_ip: incident.source_ip,
        ...(startBuf ? { start: toISO(startBuf) } : {}),
        ...(endBuf ? { end: toISO(endBuf) } : {}),
      });

      const events = await fetchEvents(`?${qs.toString()}`);
      // oldest -> newest for story/timeline reading
      events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setIncidentEvents(events);
    } catch (e) {
      console.error("Failed to load incident events:", e);
      setIncidentEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedIncident(null);
    setIncidentEvents([]);
  };

  const counts = useMemo(() => {
    const open = incidents.filter((i) => i.status === "OPEN").length;
    const high = incidents.filter((i) => i.severity >= 4).length;
    return { open, high };
  }, [incidents]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Incidents (Story View)</div>
        <button
          type="button"
          className="icon-button"
          onClick={loadAlerts}
          aria-label="Refresh incidents"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      <div className="filters-row">
        <div className="field" style={{ minWidth: 240 }}>
          <span className="field-label">Search</span>
          <div className="input-with-icon">
            <span>🔎</span>
            <input
              type="text"
              placeholder="Search by type or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <span className="field-label">Status</span>
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="field">
          <span className="field-label">Severity</span>
          <select
            className="select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="1">1 - Low</option>
            <option value="2">2 - Info</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Critical</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper" style={{ maxHeight: 520, overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Incident</th>
              <th>Source IP</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Alerts</th>
              <th>Events</th>
              <th>Window</th>
              <th style={{ width: 80 }}>Story</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading incidents...</td>
              </tr>
            ) : filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={8}>No incidents match the current filters.</td>
              </tr>
            ) : (
              filteredIncidents.map((i) => (
                <tr key={i.id}>
                  <td>{i.title}</td>
                  <td>
                    <span className="chip chip-muted mono">{i.source_ip}</span>
                  </td>
                  <td>
                    <SeverityChip severity={i.severity} />
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        i.status === "OPEN"
                          ? "chip-error"
                          : i.status === "INVESTIGATING"
                          ? "chip-warning"
                          : "chip-success"
                      }`}
                    >
                      {i.status}
                    </span>
                  </td>
                  <td>
                    <span className="chip chip-info">{i.alert_count}</span>
                  </td>
                  <td>
                    <span className="chip chip-info">{i.event_count}</span>
                  </td>
                  <td className="muted-text">
                    {i.first_seen && i.last_seen
                      ? `${new Date(i.first_seen).toLocaleString()} → ${new Date(
                          i.last_seen
                        ).toLocaleString()}`
                      : "-"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => openIncident(i)}
                      title="Open story view"
                    >
                      📖
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="alerts-footer">
        <span>
          Showing <strong>{filteredIncidents.length}</strong> of{" "}
          <strong>{incidents.length}</strong> incidents
        </span>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <span className="chip chip-error">{counts.open} Open</span>
          <span className="chip chip-warning">{counts.high} High Severity</span>
        </div>
      </div>

      {modalOpen && selectedIncident && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Incident Story — {selectedIncident.title}{" "}
                <span className="chip chip-muted mono" style={{ marginLeft: 8 }}>
                  {selectedIncident.source_ip}
                </span>
              </h2>
              <button
                type="button"
                className="icon-button"
                onClick={closeModal}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-list">
                <div>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`chip ${
                      selectedIncident.status === "OPEN"
                        ? "chip-error"
                        : selectedIncident.status === "INVESTIGATING"
                        ? "chip-warning"
                        : "chip-success"
                    }`}
                  >
                    {selectedIncident.status}
                  </span>
                </div>
                <div className="mt-1">
                  <strong>Severity:</strong> <SeverityChip severity={selectedIncident.severity} />
                </div>
                <div className="mt-1">
                  <strong>Time window:</strong>{" "}
                  {selectedIncident.first_seen && selectedIncident.last_seen
                    ? `${new Date(selectedIncident.first_seen).toLocaleString()} → ${new Date(
                        selectedIncident.last_seen
                      ).toLocaleString()}`
                    : "-"}
                </div>
                <div className="mt-1">
                  <strong>Alerts:</strong>{" "}
                  <span className="chip chip-info">{selectedIncident.alert_count}</span>{" "}
                  <strong style={{ marginLeft: 10 }}>Events:</strong>{" "}
                  <span className="chip chip-info">{incidentEvents.length}</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="card-title">Entities</div>
                <div className="mt-2" style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span className="chip chip-muted mono">{selectedIncident.source_ip}</span>
                  {Array.from(
                    new Set(incidentEvents.map((e) => e.username).filter(Boolean))
                  )
                    .slice(0, 8)
                    .map((u) => (
                      <span key={u} className="chip chip-neutral">
                        👤 {u}
                      </span>
                    ))}
                  {Array.from(
                    new Set(incidentEvents.map((e) => e.source_host).filter(Boolean))
                  )
                    .slice(0, 8)
                    .map((h) => (
                      <span key={h} className="chip chip-neutral">
                        🖥️ {h}
                      </span>
                    ))}
                </div>
              </div>

              <div className="mt-3">
                <div className="card-title">Timeline (story)</div>
                {eventsLoading ? (
                  <div className="mt-2 muted-text">Loading incident events...</div>
                ) : incidentEvents.length === 0 ? (
                  <div className="mt-2 muted-text">
                    No events found for this incident window.
                  </div>
                ) : (
                  <div className="timeline mt-2">
                    {incidentEvents.map((ev) => (
                      <div key={ev._id} className="timeline-item">
                        <div className="timeline-time">
                          {new Date(ev.timestamp).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div className="timeline-body">
                          <div className="timeline-title">
                            <span className="chip chip-muted">{ev.event_type}</span>
                            <SeverityChip severity={ev.severity} />
                          </div>
                          <div className="timeline-meta">
                            {ev.username && <span>👤 {ev.username}</span>}
                            {ev.source_host && <span>🖥️ {ev.source_host}</span>}
                            {ev.src_ip && (
                              <span className="mono">🌐 {ev.src_ip}</span>
                            )}
                          </div>
                          <div className="timeline-log mono">
                            {ev.raw_log}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3">
                <div className="card-title">Included alerts</div>
                <div className="table-wrapper mt-2" style={{ maxHeight: 220, overflow: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Severity</th>
                        <th>Event count</th>
                        <th>Window</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIncident.alerts.map((a) => (
                        <tr key={a._id}>
                          <td className="muted-text">
                            {new Date(a.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <span
                              className={`chip ${
                                a.status === "OPEN"
                                  ? "chip-error"
                                  : a.status === "INVESTIGATING"
                                  ? "chip-warning"
                                  : "chip-success"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td>
                            <SeverityChip severity={a.severity} />
                          </td>
                          <td>
                            <span className="chip chip-info">{a.event_count || 0}</span>
                          </td>
                          <td className="muted-text">
                            {(a.first_seen ? new Date(a.first_seen).toLocaleString() : "-") +
                              " → " +
                              (a.last_seen ? new Date(a.last_seen).toLocaleString() : "-")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="button" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

