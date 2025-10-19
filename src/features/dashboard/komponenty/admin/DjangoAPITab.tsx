'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CodeIcon from '@mui/icons-material/Code';
import { useTestDjangoEndpointMutation } from '@/redux/api/adminApi';
import {
  djangoEndpointsFull,
  endpointCategories,
  getEndpointsByCategory,
  type DjangoEndpoint,
} from '@/data/djangoEndpoints';

interface TestResult {
  endpoint: string;
  success: boolean;
  status: number;
  responseTime: number;
  timestamp: Date;
}

export default function DjangoAPITab() {
  const [testEndpoint] = useTestDjangoEndpointMutation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [testing, setTesting] = useState<Set<string>>(new Set());

  // Filter endpoints
  const filteredEndpoints = djangoEndpointsFull.filter((endpoint) => {
    const matchesSearch =
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || endpoint.category === categoryFilter;
    const matchesMethod = methodFilter === 'all' || endpoint.method === methodFilter;
    return matchesSearch && matchesCategory && matchesMethod;
  });

  // Calculate stats
  const totalEndpoints = djangoEndpointsFull.length;
  const frontendEndpoints = djangoEndpointsFull.filter((e) => e.frontend).length;
  const testedEndpoints = testResults.size;
  const successfulTests = Array.from(testResults.values()).filter((r) => r.success).length;

  const handleTestEndpoint = async (endpoint: DjangoEndpoint) => {
    setTesting((prev) => new Set(prev).add(endpoint.path));

    try {
      const result = await testEndpoint({
        path: endpoint.path,
        method: endpoint.method,
        requiresAuth: endpoint.auth,
      }).unwrap();

      const testResult: TestResult = {
        endpoint: endpoint.path,
        success: result.success,
        status: result.status,
        responseTime: result.responseTime,
        timestamp: new Date(),
      };

      setTestResults((prev) => new Map(prev).set(endpoint.path, testResult));
    } catch (error) {
      const testResult: TestResult = {
        endpoint: endpoint.path,
        success: false,
        status: 0,
        responseTime: 0,
        timestamp: new Date(),
      };

      setTestResults((prev) => new Map(prev).set(endpoint.path, testResult));
    } finally {
      setTesting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(endpoint.path);
        return newSet;
      });
    }
  };

  const handleTestAll = async () => {
    const frontendOnly = filteredEndpoints.filter((e) => e.frontend);

    for (const endpoint of frontendOnly.slice(0, 10)) {
      // Test first 10 to avoid overwhelming
      await handleTestEndpoint(endpoint);
      await new Promise((resolve) => setTimeout(resolve, 500)); // Delay between requests
    }
  };

  const getTestResult = (path: string) => testResults.get(path);
  const isTesting = (path: string) => testing.has(path);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Django API Endpoints
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Total Endpoints
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {totalEndpoints}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Frontend Endpoints
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {frontendEndpoints}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Tested
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                {testedEndpoints}
              </Typography>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Success Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                {testedEndpoints > 0 ? Math.round((successfulTests / testedEndpoints) * 100) : 0}%
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Szukaj endpointów..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, minWidth: '250px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Kategoria</InputLabel>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} label="Kategoria">
            <MenuItem value="all">Wszystkie</MenuItem>
            {endpointCategories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Metoda</InputLabel>
          <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} label="Metoda">
            <MenuItem value="all">Wszystkie</MenuItem>
            <MenuItem value="GET">GET</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
            <MenuItem value="PUT">PUT</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
            <MenuItem value="PATCH">PATCH</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={handleTestAll}
          disabled={testing.size > 0}
        >
          Testuj (10 pierwszych)
        </Button>
      </Box>

      {/* Endpoints Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Kategoria</TableCell>
              <TableCell>Endpoint</TableCell>
              <TableCell>Metoda</TableCell>
              <TableCell>Opis</TableCell>
              <TableCell>Auth</TableCell>
              <TableCell>Frontend</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEndpoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    Nie znaleziono endpointów
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredEndpoints.map((endpoint, index) => {
                const result = getTestResult(endpoint.path);
                const testing = isTesting(endpoint.path);

                return (
                  <TableRow key={`${endpoint.path}-${index}`}>
                    <TableCell>
                      <Chip label={endpoint.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 500 }}
                      >
                        {endpoint.path}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={endpoint.method}
                        size="small"
                        color={
                          endpoint.method === 'GET'
                            ? 'info'
                            : endpoint.method === 'POST'
                              ? 'success'
                              : endpoint.method === 'DELETE'
                                ? 'error'
                                : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {endpoint.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {endpoint.auth ? (
                        <Tooltip title="Wymaga autoryzacji">
                          <LockIcon fontSize="small" color="warning" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Publiczny">
                          <LockOpenIcon fontSize="small" color="success" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {endpoint.frontend ? (
                        <Chip label="Frontend" size="small" color="primary" />
                      ) : (
                        <Chip label="Backend" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {result && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {result.success ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                          ) : (
                            <ErrorIcon fontSize="small" color="error" />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {result.status} • {result.responseTime}ms
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Testuj endpoint">
                        <IconButton
                          size="small"
                          onClick={() => handleTestEndpoint(endpoint)}
                          disabled={testing}
                        >
                          {testing ? (
                            <CircularProgress size={20} />
                          ) : (
                            <PlayArrowIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Wyświetlanie {filteredEndpoints.length} z {totalEndpoints} endpointów
      </Typography>
    </Box>
  );
}
