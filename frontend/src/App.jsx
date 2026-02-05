import { useState } from "react";
import { 
  Container, 
  Tabs, 
  Tab, 
  ThemeProvider, 
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton
} from "@mui/material";
import { 
  Dashboard as DashboardIcon,
  Warning as AlertIcon,
  Brightness4,
  Security
} from "@mui/icons-material";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00acc1',
    },
    secondary: {
      main: '#ff6b6b',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)',
          border: '1px solid rgba(0, 172, 193, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 32px rgba(0, 172, 193, 0.2)',
          }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#00acc1',
        }
      }
    }
  }
});

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppBar position="static" sx={{ background: 'linear-gradient(90deg, #0a0a0a, #1a1a1a)', borderBottom: '1px solid rgba(0, 172, 193, 0.3)' }}>
        <Toolbar>
          <Security sx={{ mr: 2, color: '#00acc1' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Mini SOC Dashboard
          </Typography>
          <IconButton color="inherit">
            <Brightness4 />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={tab} 
            onChange={(e, v) => setTab(v)}
            variant="fullWidth"
            sx={{ '& .MuiTab-root': { fontSize: '1rem', fontWeight: 500 } }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Dashboard" 
              iconPosition="start"
            />
            <Tab 
              icon={<AlertIcon />} 
              label="Alerts" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {tab === 0 && <Dashboard />}
        {tab === 1 && <Alerts />}
      </Container>
    </ThemeProvider>
  );
}
