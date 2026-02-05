import { Chip } from "@mui/material";
import { 
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Dangerous as CriticalIcon
} from "@mui/icons-material";

const severityConfig = {
  1: {
    color: "default",
    label: "Low",
    icon: <InfoIcon style={{ fontSize: 16 }} />,
    bgColor: "#f5f5f5",
    textColor: "#666"
  },
  2: {
    color: "info", 
    label: "Info",
    icon: <InfoIcon style={{ fontSize: 16 }} />,
    bgColor: "#e3f2fd",
    textColor: "#1976d2"
  },
  3: {
    color: "warning",
    label: "Medium", 
    icon: <WarningIcon style={{ fontSize: 16 }} />,
    bgColor: "#fff3e0",
    textColor: "#f57c00"
  },
  4: {
    color: "error",
    label: "High",
    icon: <ErrorIcon style={{ fontSize: 16 }} />,
    bgColor: "#ffebee", 
    textColor: "#d32f2f"
  },
  5: {
    color: "error",
    label: "Critical",
    icon: <CriticalIcon style={{ fontSize: 16 }} />,
    bgColor: "#ffebee",
    textColor: "#b71c1c"
  }
};

export default function SeverityChip({ severity }) {
  const config = severityConfig[severity] || severityConfig[1];
  
  return (
    <Chip
      icon={config.icon}
      label={config.label}
      variant="filled"
      size="small"
      sx={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        fontWeight: 'bold',
        fontSize: '0.75rem',
        '& .MuiChip-icon': {
          color: config.textColor
        },
        '&:hover': {
          backgroundColor: config.bgColor,
          filter: 'brightness(1.1)'
        }
      }}
    />
  );
}
