## Mini SOC Dashboard – Novel Feature Ideas

This document summarizes novel / differentiating ideas for your mini SOC dashboard that go beyond a traditional “log search + alert table” SIEM.

Use it as a product & implementation backlog.

---

## 1. Incident-Centric “Story View”

**Problem with typical SIEMs**: They present a flat list of alerts, leaving analysts to mentally stitch events into a narrative.

**Idea**: Make the primary view an **incident story**, not just a table row.

- **Incident timeline**
  - Group related alerts/events into a single **incident**.
  - Show a time-ordered list or visual timeline: initial access → lateral movement → exfiltration, etc.
  - Each step links back to the underlying security events from the backend (`SecurityEvent` model).
- **Entity graph**
  - Visual graph view connecting users, IPs, hosts, processes involved in an incident.
  - Clicking a node shows:
    - All related alerts.
    - All related events (via `/events` queries).
  - This can be a future enhancement on top of existing alerts/events APIs.

**Why it’s novel**: Big tools may have workbench-like views, but they’re often secondary. Here, the **default experience** is incident/story-centric, which is simpler and more intuitive.

---

## 2. Analyst “Copilot” Rather Than Just AI Detections

Most platforms market “AI detection”, but your focus can be the **analyst’s experience**.

**Idea**: Build an “analyst copilot” that helps explain, summarize, and guide investigations.

- **Auto-summarized alerts/incidents**
  - For example, an SSH brute-force alert could be summarized as:
    - “In the last 20 minutes, IP X attempted 42 failed SSH logins against host Y targeting user Z.”
  - Initially, implement using templates and backend aggregation logic; later you can plug in LLMs if desired.
- **Explain-why panel**
  - Each alert shows a clear explanation:
    - “Rule: ssh_bruteforce”
    - “Condition: `failed_logins > 20` in 10 minutes for the same source IP.”
    - “Triggering data: src_ip = 1.2.3.4, count = 42.”
  - Makes alerts more transparent and easier to trust.
- **Guided investigation checklists**
  - For each detection type:
    - Show recommended next steps (e.g., “Check if there was a successful login from this IP”, “Check other services from this IP”).
    - Provide UI buttons that:
      - Call backend queries (e.g., `/events` with relevant filters).
      - Display results inline in the incident/alert view.

**Why it’s novel**: Most tools stop at “alert fired because rule matched X”. A copilot approach bakes investigation guidance into the UI.

---

## 3. Human Feedback Loop & Rule Tuning

Today, many SIEMs collect feedback implicitly but don’t make it central.

**Idea**: Treat analyst feedback as a **first-class signal** for improving detections and UX.

- **Per-alert feedback**
  - Buttons like:
    - `Correct`
    - `Benign / Expected`
    - `Too noisy`
  - Store this metadata alongside `Alert` records.
- **Rule quality metrics**
  - For each detection rule, compute:
    - Percentage of alerts marked `Correct` vs `Benign/Noisy`.
    - Volume trends over time.
  - Visualize this in a “Rule Health” dashboard.
- **Rule tuning suggestions**
  - Based on feedback and stats, surface suggestions, e.g.:
    - “Consider increasing threshold from 20 to 50 failed logins.”
    - “Consider lowering severity from High to Medium.”
    - “Top whitelisted IPs that frequently trigger benign alerts.”

**Why it’s novel**: Instead of static rules, you get a **learning detection system**, even with simple logic, driven by analyst feedback.

---

## 4. Triage Cockpit (Kanban for Alerts/Incidents)

Instead of separate “Events” and “Alerts” tables only, build a **triage cockpit** that mirrors how analysts actually work.

**Idea**: Represent alerts/incidents as cards moving through states.

- **Kanban-style board**
  - Columns such as:
    - `New`
    - `In Progress`
    - `Waiting on Info`
    - `Resolved`
  - Alerts or incidents are cards that analysts drag between columns.
- **Card content**
  - Severity + type (e.g., SSH brute force).
  - Key entities: user, IP, host.
  - Age / last activity timestamp.
- **Batch operations**
  - Select multiple similar cards (e.g., all SSH brute-force alerts from the same IP) to:
    - Bulk close.
    - Bulk acknowledge.
    - Bulk assign to an analyst.

**Why it’s novel**: Many SIEMs have workflow integrations but not a **simple, opinionated triage board** as the main view, which is intuitive and fast to use.

---

## 5. Personalization & Analyst Skill Levels

Most tools are “one-size-fits-all” UIs with lots of toggles.

**Idea**: Adapt the experience to the analyst’s skill level and preferences.

- **Experience modes**
  - Beginner mode:
    - More text explanations.
    - Inline help and guided actions.
    - Preset filters and queries.
  - Expert mode:
    - More compact tables.
    - Keyboard shortcuts.
    - Easier access to raw events/log views.
- **Saved personal views**
  - Allow analysts to save their own:
    - Filters.
    - Column sets.
    - Default pages (e.g., “SSH detections”, “Cloud IAM anomalies”).
- **Analyst analytics**
  - Track personal metrics (for internal use, training, and motivation), like:
    - Incidents handled.
    - Average time to close by severity.
    - Types of incidents they specialize in.

**Why it’s novel**: It focuses on **human performance and comfort**, not just detection coverage.

---

## 6. Rich Context Tiles Around Each Incident

XDR-style context is powerful but often complex. You can implement a smaller, focused version.

**Idea**: For each incident or alert, show context “tiles” drawn from your data and external enrichments.

- **IP context**
  - Geo information (country/city, if available).
  - ASN or ISP (static mapping or external lookup).
  - Whether it appears in any threat list (even a demo/static feed).
- **User context**
  - Recent login history (count per day, unusual bursts).
  - Devices / hosts recently accessed.
  - New factors compared to baseline (e.g., new country, new host).
- **Host context**
  - Typical login volume.
  - Common services accessed (SSH, RDP, HTTP, etc.).

These tiles can use existing `/events` queries plus any enrichment logic you add.

**Why it’s novel**: It moves from “just logs” to **lightweight XDR-style context** in a clean, simple UI.

---

## 7. Learning Lab / Training Mode

Most commercial tools are not optimized for training new SOC analysts.

**Idea**: Build a **training environment** directly into the mini SOC.

- **Replay scenarios**
  - Load a known attack dataset (e.g., pre-recorded SSH brute-force events).
  - “Replay” events over time, as if they’re arriving live.
- **Guided exercises**
  - Provide scenarios where the UI:
    - Gives hints about what to look for.
    - Highlights which filters/queries to run.
    - Explains why an alert is or is not serious.
- **Scoring and feedback**
  - Track:
    - How quickly the trainee identifies the core incident.
    - How many false positives they close correctly.
  - Provide a simple score or progress over multiple scenarios.

**Why it’s novel**: You get a SOC **learning platform** in addition to a monitoring tool—useful for self-training, demos, and education.

---

## 8. Prioritization – What to Build First

Given your current stack (Express/Mongo backend, React/MUI frontend), these are good first milestones:

1. **Incident-centric view**
   - Group alerts into incidents and show a simple timeline + list of involved entities on a dedicated “Incident Details” page.
2. **Explain-why + guided actions**
   - For existing detections (like SSH brute force), add:
     - A “Why this alert fired” explanation.
     - One or two guided action buttons that run backend queries and show results inline.
3. **Basic triage board**
   - Represent alerts/incidents with a few states and a simple Kanban-style UI for moving them through a workflow.

You can then iterate towards richer context tiles, feedback-driven rule tuning, and eventually a full training mode.

