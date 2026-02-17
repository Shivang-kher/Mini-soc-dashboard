const severityConfig = {
  1: {
    label: "Low",
    icon: "ℹ️",
    variant: "neutral"
  },
  2: {
    label: "Info",
    icon: "ℹ️",
    variant: "info"
  },
  3: {
    label: "Medium", 
    icon: "⚠️",
    variant: "warning"
  },
  4: {
    label: "High",
    icon: "⛔",
    variant: "error"
  },
  5: {
    label: "Critical",
    icon: "🔥",
    variant: "critical"
  }
};

export default function SeverityChip({ severity }) {
  const config = severityConfig[severity] || severityConfig[1];
  
  return (
    <span className={`chip chip-${config.variant}`}>
      <span className="chip-icon">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
