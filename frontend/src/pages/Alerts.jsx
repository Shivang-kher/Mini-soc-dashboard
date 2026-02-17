import { 
  useEffect, 
  useState 
} from "react";
import { fetchAlerts } from "../api/alerts";
import { fetchEvents } from "../api/events";
import SeverityChip from "../components/SeverityChip";

export default function Alerts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setRows(data.map(a => ({ ...a, id: a._id })));
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvents = async (alert) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
    setEventsLoading(true);
    
    try {
      // Fetch events with query parameters to get relevant data
      const queryParams = new URLSearchParams({
        // Get events from the last 48 hours to include yesterday's data
        // lastMinutes: 2880,
        // Filter by source IP to get only relevant events
        src_ip: alert.source_ip,
        // Filter by event type for SSH brute force
        event_type: "FAILED_LOGIN"
      });
      
      const allEvents = await fetchEvents(`?${queryParams}`);
      
      // Further filter events by the alert's specific time range
      const relatedEvents = allEvents.filter(event => {
        return new Date(event.timestamp) >= new Date(alert.first_seen) &&
               new Date(event.timestamp) <= new Date(alert.last_seen);
      });
      
      // Sort events by timestamp (newest first)
      relatedEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setRelatedEvents(relatedEvents);
    } catch (error) {
      console.error('Failed to load related events:', error);
      setRelatedEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAlert(null);
    setRelatedEvents([]);
  };

  const filteredRows = rows.filter(row => {
    const matchesSearch = searchTerm === "" || 
      row.alert_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.source_ip?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || row.severity.toString() === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const columns = [
    // kept for reference; table rendering below uses row fields directly
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Security Alerts</div>
        <button
          type="button"
          className="icon-button"
          onClick={loadAlerts}
          aria-label="Refresh alerts"
        >
          ↻
        </button>
      </div>

      <div className="filters-row">
        <div className="field" style={{ minWidth: 220 }}>
          <span className="field-label">Search</span>
          <div className="input-with-icon">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by alert type or IP..."
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
            <option value="all">All Status</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div className="field">
          <span className="field-label">Severity</span>
          <select
            className="select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="1">1 - Low</option>
            <option value="2">2 - Info</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Critical</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper" style={{ maxHeight: 500, overflow: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Alert Type</th>
              <th>Source IP</th>
              <th>Severity</th>
              <th>Events</th>
              <th>Status</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading alerts...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6}>No alerts match the current filters.</td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.alert_type}</td>
                  <td>
                    <span className="chip chip-muted mono">{row.source_ip}</span>
                  </td>
                  <td>
                    <SeverityChip severity={row.severity} />
                  </td>
                  <td>
                    <span className="chip chip-info">{row.event_count}</span>
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        row.status === "OPEN"
                          ? "chip-error"
                          : row.status === "INVESTIGATING"
                          ? "chip-warning"
                          : "chip-success"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleViewEvents(row)}
                      title="View related events"
                    >
                      👁️
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
          Showing <strong>{filteredRows.length}</strong> of <strong>{rows.length}</strong> alerts
        </span>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <span className="chip chip-error">
            {rows.filter((r) => r.status === "OPEN").length} Open
          </span>
          <span className="chip chip-warning">
            {rows.filter((r) => r.severity >= 4).length} High Priority
          </span>
        </div>
      </div>

      {dialogOpen && (
        <div className="modal-backdrop" onClick={handleCloseDialog}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Related Events - {selectedAlert?.source_ip}
              </h2>
              <button
                type="button"
                className="icon-button"
                onClick={handleCloseDialog}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {selectedAlert && (
                <div className="detail-list mt-1">
                  <div>
                    <strong>Alert Type:</strong> {selectedAlert.alert_type}
                  </div>
                  <div>
                    <strong>Source IP:</strong> {selectedAlert.source_ip}
                  </div>
                  <div>
                    <strong>Event Count:</strong> {selectedAlert.event_count}
                  </div>
                  <div>
                    <strong>First Seen:</strong>{" "}
                    {new Date(selectedAlert.first_seen).toLocaleString()}
                  </div>
                  <div>
                    <strong>Last Seen:</strong>{" "}
                    {new Date(selectedAlert.last_seen).toLocaleString()}
                  </div>
                </div>
              )}

              {eventsLoading ? (
                <div className="mt-3 muted-text">Loading events...</div>
              ) : relatedEvents.length > 0 ? (
                <div className="table-wrapper mt-3" style={{ maxHeight: 380, overflow: "auto" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Event Type</th>
                        <th>Source IP</th>
                        <th>Username</th>
                        <th>Source Host</th>
                        <th>Raw Log</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedEvents.map((event, index) => (
                        <tr key={event._id || index}>
                          <td>{new Date(event.timestamp).toLocaleString()}</td>
                          <td>
                            <span className="chip chip-muted">{event.event_type}</span>
                          </td>
                          <td>
                            <span className="mono">{event.src_ip}</span>
                          </td>
                          <td>{event.username || "-"}</td>
                          <td>{event.source_host || "-"}</td>
                          <td className="cell-raw-log mono">
                            {event.raw_log}
                          </td>
                          <td>
                            <SeverityChip severity={event.severity} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-3 muted-text">
                  No related events found for this alert.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="button" onClick={handleCloseDialog}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
