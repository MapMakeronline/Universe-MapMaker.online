'use client';

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import MapIcon from '@mui/icons-material/Map';
import LayersIcon from '@mui/icons-material/Layers';
import WarningIcon from '@mui/icons-material/Warning';
import BuildIcon from '@mui/icons-material/Build';
import { useTestQGISEndpointMutation, useGetAllProjectsQuery } from '@/redux/api/adminApi';

interface QGISTestResult {
  project: string;
  service: string;
  request: string;
  success: boolean;
  status: number;
  url: string;
  timestamp: Date;
}

export default function QGISServerTab() {
  const [testQGIS] = useTestQGISEndpointMutation();
  const { data: projectsData, isLoading: projectsLoading } = useGetAllProjectsQuery();
  const [testResults, setTestResults] = useState<Map<string, QGISTestResult>>(new Map());
  const [testing, setTesting] = useState<Set<string>>(new Set());

  const projects = projectsData?.projects?.filter((p) => p.published) || [];

  const handleTestEndpoint = async (projectName: string, service: string, request: string) => {
    const key = `${projectName}-${service}-${request}`;
    setTesting((prev) => new Set(prev).add(key));

    try {
      const result = await testQGIS({
        project: projectName,
        service,
        request,
      }).unwrap();

      const url = `https://api.universemapmaker.online/ows?SERVICE=${service}&VERSION=1.3.0&REQUEST=${request}&MAP=${projectName}`;

      const testResult: QGISTestResult = {
        project: projectName,
        service,
        request,
        success: result.success,
        status: result.status,
        url,
        timestamp: new Date(),
      };

      setTestResults((prev) => new Map(prev).set(key, testResult));
    } catch (error) {
      const url = `https://api.universemapmaker.online/ows?SERVICE=${service}&VERSION=1.3.0&REQUEST=${request}&MAP=${projectName}`;

      const testResult: QGISTestResult = {
        project: projectName,
        service,
        request,
        success: false,
        status: 0,
        url,
        timestamp: new Date(),
      };

      setTestResults((prev) => new Map(prev).set(key, testResult));
    } finally {
      setTesting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleTestAll = async () => {
    const publishedProjects = projects.slice(0, 5); // Test first 5 projects

    for (const project of publishedProjects) {
      await handleTestEndpoint(project.project_name, 'WMS', 'GetCapabilities');
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const handleCopyURL = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const getTestResult = (projectName: string, service: string, request: string) => {
    const key = `${projectName}-${service}-${request}`;
    return testResults.get(key);
  };

  const isTesting = (projectName: string, service: string, request: string) => {
    const key = `${projectName}-${service}-${request}`;
    return testing.has(key);
  };

  // Calculate stats
  const testedProjects = new Set(Array.from(testResults.values()).map((r) => r.project)).size;
  const successfulTests = Array.from(testResults.values()).filter((r) => r.success).length;
  const totalTests = testResults.size;

  if (projectsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        QGIS Server & GeoServer Status
      </Typography>

      {/* GeoServer Notice */}
      <Alert
        severity="warning"
        icon={<BuildIcon />}
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #f59e0b',
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>GeoServer - Planowana integracja</AlertTitle>
        <Typography variant="body2">
          <strong>Status:</strong> Do zintegrowania
          <br />
          <strong>Obecne rozwiązanie:</strong> QGIS Server (działający i przetestowany poniżej)
          <br />
          <strong>Endpoint QGIS Server:</strong>{' '}
          <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
            https://api.universemapmaker.online/ows
          </code>
        </Typography>
      </Alert>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Published Projects
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {projects.length}
                  </Typography>
                </Box>
                <MapIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Tested Projects
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                    {testedProjects}
                  </Typography>
                </Box>
                <LayersIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Total Tests
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {totalTests}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Success Rate
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={handleTestAll}
          disabled={testing.size > 0 || projects.length === 0}
        >
          Testuj pierwsze 5 projektów
        </Button>
        <Typography variant="body2" color="text.secondary">
          Testuje WMS GetCapabilities dla opublikowanych projektów
        </Typography>
      </Box>

      {/* QGIS Tests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Projekt</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Request</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    Brak opublikowanych projektów
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              projects.slice(0, 10).map((project) => {
                const services = [
                  { service: 'WMS', request: 'GetCapabilities' },
                  { service: 'WMS', request: 'GetMap' },
                ];

                return services.map(({ service, request }, idx) => {
                  const result = getTestResult(project.project_name, service, request);
                  const testingNow = isTesting(project.project_name, service, request);
                  const url = `https://api.universemapmaker.online/ows?SERVICE=${service}&VERSION=1.3.0&REQUEST=${request}&MAP=${project.project_name}`;

                  return (
                    <TableRow key={`${project.project_name}-${service}-${request}-${idx}`}>
                      {idx === 0 && (
                        <TableCell rowSpan={services.length}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {project.custom_project_name || project.project_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {project.project_name}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip label={service} size="small" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Chip label={request} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: 'text.secondary',
                            display: 'block',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {url}
                        </Typography>
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
                              HTTP {result.status}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Testuj endpoint">
                          <IconButton
                            size="small"
                            onClick={() => handleTestEndpoint(project.project_name, service, request)}
                            disabled={testingNow}
                          >
                            {testingNow ? (
                              <CircularProgress size={20} />
                            ) : (
                              <PlayArrowIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Kopiuj URL">
                          <IconButton size="small" onClick={() => handleCopyURL(url)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Otwórz w nowej karcie">
                          <IconButton size="small" onClick={() => window.open(url, '_blank')}>
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                });
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Info */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Wyświetlanie {Math.min(projects.length, 10)} z {projects.length} opublikowanych projektów
      </Typography>
    </Box>
  );
}
