## Reusable UI (No-MUI) – How to Build Pages Fast

This frontend intentionally avoids MUI and other large UI frameworks. Instead, it uses a small, reusable “UI kit” made of:

- **Global styles** in `src/styles.css`
- **Consistent class names** that behave like components
- **Tiny React components** when needed (example: `src/components/SeverityChip.jsx`)

Goal: **build new pages with minimal boilerplate** and keep the look consistent.

---

## Where the UI kit lives

- **Global CSS**: `src/styles.css`
  - Defines the reusable building blocks (card, table, modal, chip, buttons, grids).
- **Global import**: `src/main.jsx`
  - Imports `./styles.css` once so every page can use the same classes.
- **App shell layout**: `src/App.jsx`
  - Uses `.app-shell`, `.app-header`, `.app-tabs`, `.app-main` patterns.

---

## “Component” Building Blocks (CSS classes)

### Layout / shell

- **`app-shell`**: full app wrapper
- **`app-header`**, **`app-header-left`**, **`app-logo`**, **`app-title`**: top header styling
- **`app-tabs`**, **`app-tab`**, **`app-tab active`**: tab bar + active state
- **`app-main`**: page container (centered, max width, padding)

Use this for any new top-level layout to stay consistent with the rest of the app.

---

### Cards

- **`card`**: the default panel container (used for almost everything)
- **`card-header`**: left title + right actions layout
- **`card-title`**: consistent title style

Typical pattern:

```jsx
<div className="card">
  <div className="card-header">
    <div className="card-title">Title</div>
    <button className="icon-button" type="button">↻</button>
  </div>
  <div>Body content…</div>
</div>
```

---

### Buttons

- **`button`**: primary action button
- **`icon-button`**: small circular icon button for tool actions (refresh, close, view)

```jsx
<button className="button" type="button">Close</button>
<button className="icon-button" type="button" aria-label="Refresh">↻</button>
```

---

### Chips / badges (status, severity, tags)

- **Base**: `chip`
- **Variants**:
  - `chip-neutral`, `chip-info`, `chip-warning`, `chip-error`, `chip-critical`, `chip-success`, `chip-muted`
- **Helpers**:
  - `chip-icon` for an icon inside the chip
  - `mono` for monospace content (IPs, hashes, IDs)

```jsx
<span className="chip chip-warning">INVESTIGATING</span>
<span className="chip chip-muted mono">192.168.0.10</span>
```

The existing `SeverityChip` component is just a convenience wrapper around these chip styles.

---

### Filters row (search + dropdowns)

- **`filters-row`**: a responsive horizontal row that wraps on small screens
- **`field`**, **`field-label`**: label + control stack
- **`select`**, **`input`**: consistent controls
- **`input-with-icon`**: input wrapper that supports an icon

```jsx
<div className="filters-row">
  <div className="field" style={{ minWidth: 220 }}>
    <span className="field-label">Search</span>
    <div className="input-with-icon">
      <span>🔍</span>
      <input placeholder="Search..." />
    </div>
  </div>
  <div className="field">
    <span className="field-label">Status</span>
    <select className="select">
      <option value="all">All</option>
    </select>
  </div>
</div>
```

---

### Tables (lists of alerts/events)

- **`table-wrapper`**: provides rounded border, background, scroll container
- **`table`**: consistent table styling
- **`cell-raw-log`**: long text cell treatment for logs

```jsx
<div className="table-wrapper" style={{ maxHeight: 500, overflow: "auto" }}>
  <table className="table">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

This replaces MUI’s `DataGrid` with a much smaller surface area and no dependency overhead.

---

### Modal / dialog (overlay)

- **`modal-backdrop`**: full-screen overlay
- **`modal`**: dialog container
- **`modal-header`**, **`modal-title`**, **`modal-body`**, **`modal-footer`**

Pattern used in `src/pages/Alerts.jsx`:

```jsx
{open && (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2 className="modal-title">Title</h2>
        <button className="icon-button" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">...</div>
      <div className="modal-footer">
        <button className="button" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
)}
```

---

## Utility classes

- **Spacing**: `mt-1`, `mt-2`, `mt-3`, `mt-4`
- **Text**: `muted-text`
- **Monospace**: `mono`

---

## How to keep it reusable (rules of thumb)

- **Prefer CSS “components” first**: if you can express it as a class pattern (`card`, `chip`, `table`), do that before making a React component.
- **Create a React component only when logic repeats**:
  - Severity/status mapping (`SeverityChip`)
  - Table row rendering with complex formatting
  - Modals with repeated behavior
- **Keep pages thin**:
  - Data loading + filtering in pages.
  - Visual atoms (chips/buttons) should be reusable and dumb.
- **Add new variants instead of new one-off styles**:
  - Example: if you need a new badge style, add a `chip-*` class in `styles.css` rather than inline styles.

---

## Next cleanup step (optional but recommended)

Right now the “UI kit” is class-based. If you want even less copy/paste, the next step is to create tiny wrappers under `src/ui/`:

- `src/ui/Card.jsx` (`<Card title actions>...</Card>`)
- `src/ui/Button.jsx`, `src/ui/IconButton.jsx`
- `src/ui/Modal.jsx`
- `src/ui/Table.jsx`

Those wrappers would still be “yours” (no dependencies) but reduce JSX repetition further.

