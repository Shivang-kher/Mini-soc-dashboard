import { 
  DataGrid, 
  GridToolbar
} from "@mui/x-data-grid";
import { 
  useEffect, 
  useState 
} from "react";
import { 
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Close as CloseIcon
} from "@mui/icons-material";
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
        lastMinutes: 2880,
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
    { 
      field: "alert_type", 
      headerName: "Alert Type", 
      flex: 1.5,
      renderCell: (params) => (
        <Box display="flex" alignItems="center">
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: "source_ip", 
      headerName: "Source IP", 
      flex: 1,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          variant="outlined" 
          size="small"
          sx={{ fontFamily: 'monospace' }}
        />
      )
    },
    {
      field: "severity",
      headerName: "Severity",
      flex: 1,
      renderCell: (params) => <SeverityChip severity={params.value} />
    },
    { 
      field: "event_count", 
      headerName: "Events", 
      flex: 0.8,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color="primary" 
          variant="filled" 
          size="small"
        />
      )
    },
    { 
      field: "status", 
      headerName: "Status", 
      flex: 1,
      renderCell: (params) => {
        const statusColors = {
          OPEN: 'error',
          INVESTIGATING: 'warning',
          RESOLVED: 'success'
        };
        return (
          <Chip 
            label={params.value} 
            color={statusColors[params.value] || 'default'}
            variant="filled" 
            size="small"
          />
        );
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View Related Events">
          <IconButton 
            size="small" 
            color="primary"
            onClick={() => handleViewEvents(params.row)}
          >
            <ViewIcon />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" component="h2">
            Security Alerts
          </Typography>
          <IconButton onClick={loadAlerts} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>

        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="INVESTIGATING">Investigating</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={severityFilter}
              label="Severity"
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <MenuItem value="all">All Levels</MenuItem>
              <MenuItem value="1">1 - Low</MenuItem>
              <MenuItem value="2">2 - Info</MenuItem>
              <MenuItem value="3">3 - Medium</MenuItem>
              <MenuItem value="4">4 - High</MenuItem>
              <MenuItem value="5">5 - Critical</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            components={{
              Toolbar: GridToolbar,
            }}
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'rgba(0, 172, 193, 0.1)',
                borderBottom: '2px solid rgba(0, 172, 193, 0.3)',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(0, 172, 193, 0.05)',
              },
            }}
          />
        </Box>

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Showing {filteredRows.length} of {rows.length} alerts
          </Typography>
          <Box display="flex" gap={1}>
            <Chip 
              label={`${rows.filter(r => r.status === 'OPEN').length} Open`} 
              color="error" 
              size="small" 
            />
            <Chip 
              label={`${rows.filter(r => r.severity >= 4).length} High Priority`} 
              color="warning" 
              size="small" 
            />
          </Box>
        </Box>
      </CardContent>

      {/* Related Events Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              Related Events - {selectedAlert?.source_ip}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedAlert && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                <strong>Alert Type:</strong> {selectedAlert.alert_type}<br/>
                <strong>Source IP:</strong> {selectedAlert.source_ip}<br/>
                <strong>Event Count:</strong> {selectedAlert.event_count}<br/>
                <strong>First Seen:</strong> {new Date(selectedAlert.first_seen).toLocaleString()}<br/>
                <strong>Last Seen:</strong> {new Date(selectedAlert.last_seen).toLocaleString()}
              </Typography>
            </Box>
          )}

          {eventsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography>Loading events...</Typography>
            </Box>
          ) : relatedEvents.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Source IP</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Source Host</TableCell>
                    <TableCell>Raw Log</TableCell>
                    <TableCell>Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {relatedEvents.map((event, index) => (
                    <TableRow key={event._id || index}>
                      <TableCell>
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={event.event_type} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <code>{event.src_ip}</code>
                      </TableCell>
                      <TableCell>
                        {event.username || '-'}
                      </TableCell>
                      <TableCell>
                        {event.source_host || '-'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 400, wordBreak: 'break-all' }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {event.raw_log}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <SeverityChip severity={event.severity} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box display="flex" justifyContent="center" p={3}>
              <Typography color="text.secondary">
                No related events found for this alert.
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
