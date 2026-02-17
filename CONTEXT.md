## Mini SOC Dashboard – Codebase Overview

This document gives a high-level map of the mini SOC dashboard so it’s easier to understand the codebase and make changes quickly.

---

## Top-Level Structure

- **`backend/`**: Node.js + Express + Mongoose API for ingesting security events, running detections, and exposing data to the UI.
- **`frontend/`**: React + Vite + MUI dashboard UI that queries the backend and visualizes events/alerts.

You typically:
- Run the **backend** API (`backend/`) for data and detections.
- Run the **frontend** app (`frontend/`) for the dashboard UI.

---

## Backend Overview (`backend/`)

- **Tech stack**
  - **Runtime**: Node.js
  - **Framework**: Express
  - **Database**: MongoDB via Mongoose
  - **Env config**: `dotenv`

- **Key files**
  - **`app.js`**: Main Express app setup, route mounting, middleware, DB connection bootstrap.
  - **`config/db.js`**: MongoDB/Mongoose connection logic and configuration.
  - **`routes/ingest.js`**: Endpoints for ingesting raw security events into the system.
  - **`routes/events.js`**: Read-only API to query stored security events.
    - Supports optional filters via query params such as:
      - `event_type`
      - `src_ip`
      - `lastMinutes` (optional time window, when provided).
  - **`routes/alerts.js`**: Endpoints to query and possibly manage SOC alerts generated from detections.
  - **`models/SecurityEvent.js`**: Mongoose model/schema for raw or normalized security events.
  - **`models/Alert.js`**: Mongoose model/schema for generated alerts.
  - **`detection/sshBruteForce.js`**: Detection logic for SSH brute-force style behavior (reads events, produces alerts).
  - **`.env`**: Environment variables (e.g., Mongo URI, ports). Not committed; create your own from local needs.

- **How data flows (backend)**
  1. Ingest endpoints (e.g., `routes/ingest.js`) receive events from agents or test scripts.
  2. Events are stored via the `SecurityEvent` Mongoose model.
  3. Detection modules in `detection/` (like `sshBruteForce.js`) analyze recent events and create `Alert` documents.
  4. The frontend calls `routes/events.js` and `routes/alerts.js` to read events/alerts for visualization.

- **Typical backend changes**
  - **Add a new field to events**: Update `models/SecurityEvent.js`, adapt `routes/ingest.js`, and adjust any detection logic using that field.
  - **Add a new detection**: Create a module in `detection/`, wire it into wherever detections are scheduled or triggered, and expose any new alert fields via `Alert` model and `routes/alerts.js`.
  - **Extend query filters**: Modify `routes/events.js` or `routes/alerts.js` to accept new query params and include them in the Mongo query object.

---

## Frontend Overview (`frontend/`)

- **Tech stack**
  - **Build tool**: Vite
  - **UI library**: React
  - **Component framework**: MUI (`@mui/material`, `@mui/x-data-grid`, `@mui/icons-material`)
  - **HTTP client**: Axios

- **Key files**
  - **`src/main.jsx`**: React entrypoint; mounts the root App into `index.html`.
  - **`src/App.jsx`**: Top-level app component; usually sets up routing and layout.
  - **`src/pages/Dashboard.jsx`**: Main SOC dashboard view (overview metrics, high-level widgets).
  - **`src/pages/Alerts.jsx`**: Alerts page for listing and inspecting alerts (likely uses MUI DataGrid).
  - **`src/api/events.js`**: Axios-based API helpers for talking to backend `/events` and related endpoints.
  - **`src/components/SeverityChip.jsx`**: Small reusable UI for representing alert/event severities with color-coded chips.

- **How data flows (frontend)**
  1. Page components (`Dashboard.jsx`, `Alerts.jsx`) call API helpers from `src/api/events.js` (and similar) using Axios.
  2. API helpers talk to backend Express endpoints, sending query params like `event_type`, `src_ip`, `lastMinutes`.
  3. The responses (lists of events/alerts) are rendered into MUI `DataGrid`s and other MUI components.
  4. Components like `SeverityChip.jsx` handle consistent visual representation of severity or status.

- **Typical frontend changes**
  - **Add a new filter**:
    - Update the page (e.g., `Alerts.jsx` or `Dashboard.jsx`) to include new filter UI (MUI inputs, selects, etc.).
    - Pass the new filter value into the API helper in `src/api/events.js` as a query param.
    - Ensure the backend route understands this param and applies it in its Mongo query.
  - **Add a new column to tables**:
    - Extend the `columns` definition in the relevant page (e.g., `Alerts.jsx`) for the MUI DataGrid.
    - Ensure the backend model/route returns the corresponding field.
  - **Adjust severity logic/visuals**:
    - Modify `SeverityChip.jsx` to change color mappings or labels for different severity levels.

---

## How to Run Locally

From the repo root (`mini_soc`):

1. **Backend**
   - `cd backend`
   - `npm install`
   - Ensure `.env` is configured (Mongo connection URI, port, etc.).
   - `npm run dev` to start the Express server with nodemon.

2. **Frontend**
   - `cd frontend`
   - `npm install`
   - `npm run dev` to start the Vite dev server.

Make sure the frontend is configured to call the correct backend base URL (e.g., via Axios base URL or environment variables).

---

## Adding/Changing Features – Quick Recipe

When you want to implement or modify a feature:

1. **Decide which layer changes**:
   - Data shape or detection logic → backend (`models/`, `routes/`, `detection/`).
   - UI/UX, filters, or visualizations → frontend (`src/pages/`, `src/components/`, `src/api/`).

2. **Wire data end-to-end**:
   - Backend: update models, routes, and detection logic as needed.
   - Frontend: adjust API helpers and page components to send/consume new fields and filters.

3. **Test scenario**:
   - Generate test events (via `routes/ingest.js` or tooling).
   - Verify detections (alerts created correctly).
   - Confirm the UI (`Dashboard`, `Alerts`) reflects the new behavior and filters correctly.

---

## Where to Look First for Common Tasks

- **Understanding event querying**: `backend/routes/events.js`, `frontend/src/api/events.js`, and any pages that call those helpers.
- **Understanding alerts listing**: `backend/routes/alerts.js`, `backend/models/Alert.js`, `frontend/src/pages/Alerts.jsx`.
- **Understanding detection logic**: `backend/detection/sshBruteForce.js` and other files inside `backend/detection/`.
- **Tweaking severity visuals**: `frontend/src/components/SeverityChip.jsx`.

Use this document as your first stop to decide which file(s) to open when adding functionality or debugging behavior in the mini SOC.

