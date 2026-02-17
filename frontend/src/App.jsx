import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Incidents from "./pages/Incidents";

export default function App() {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">🛡️</div>
          <h1 className="app-title">Mini SOC Dashboard</h1>
        </div>
        <button className="icon-button" type="button" aria-label="Toggle theme">
          🌙
        </button>
      </header>

      <div className="app-tabs">
        <button
          type="button"
          className={`app-tab ${tab === "dashboard" ? "active" : ""}`}
          onClick={() => setTab("dashboard")}
        >
          <span>📊</span>
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          className={`app-tab ${tab === "incidents" ? "active" : ""}`}
          onClick={() => setTab("incidents")}
        >
          <span>📖</span>
          <span>Incidents</span>
        </button>
        <button
          type="button"
          className={`app-tab ${tab === "alerts" ? "active" : ""}`}
          onClick={() => setTab("alerts")}
        >
          <span>⚠️</span>
          <span>Alerts</span>
        </button>
      </div>

      <main className="app-main">
        {tab === "dashboard" ? (
          <Dashboard />
        ) : tab === "incidents" ? (
          <Incidents />
        ) : (
          <Alerts />
        )}
      </main>
    </div>
  );
}
