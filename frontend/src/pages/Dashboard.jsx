import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box,
  LinearProgress,
  Avatar,
  useTheme
} from "@mui/material";
import { 
  Warning as AlertIcon,
  LocalFireDepartment as FireIcon,
  Assessment as TotalIcon,
  TrendingUp,
  Security,
  Shield
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { fetchAlerts } from "../api/alerts";

export default function Dashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

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

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${color}, ${theme.palette.primary.main})`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            sx={{
              bgcolor: color,
              width: 56,
              height: 56,
              mr: 2
            }}
          >
            {icon}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {loading ? '...' : value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        
        {subtitle && (
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            {subtitle}
          </Typography>
        )}
        
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            <TrendingUp sx={{ fontSize: 16, mr: 0.5, color: trend > 0 ? 'success.main' : 'error.main' }} />
            <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
              {Math.abs(trend)}% from last hour
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {loading && (
        <Box mb={3}>
          <LinearProgress />
        </Box>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Alerts"
            value={active.length}
            icon={<AlertIcon />}
            color={theme.palette.warning.main}
            subtitle={`${high.length} high priority`}
            trend={12}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="High Severity"
            value={high.length}
            icon={<FireIcon />}
            color={theme.palette.error.main}
            subtitle={`${critical.length} critical`}
            trend={-5}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Alerts"
            value={alerts.length}
            icon={<TotalIcon />}
            color={theme.palette.primary.main}
            subtitle={`${resolved.length} resolved`}
            trend={8}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Security Score"
            value="87"
            icon={<Shield />}
            color={theme.palette.success.main}
            subtitle="Good standing"
            trend={3}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Security sx={{ mr: 1, color: theme.palette.primary.main }} />
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time security events and alerts will appear here.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TotalIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Quick Stats
              </Typography>
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Response Time: <strong>2.3 min</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  False Positives: <strong>3.2%</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  System Health: <strong style={{ color: theme.palette.success.main }}>Optimal</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
