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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import FolderIcon from '@mui/icons-material/Folder';

// TODO: Migrate to @/backend/admin API
// Temporary mock hooks until backend admin endpoints are implemented
const useGetStorageFilesQuery = () => ({ data: undefined, isLoading: false, error: null });
type StorageFile = {
  filename: string;
  project: string;
  type: 'qgs' | 'json';
  description: string;
  path: string;
  url: string;
};

export default function StorageTab() {
  const { data: files, isLoading, error } = useGetStorageFilesQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'qgs' | 'json'>('all');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !files) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Nie udało się załadować plików storage
      </Alert>
    );
  }

  // Filter files
  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = fileTypeFilter === 'all' || file.type === fileTypeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate stats
  const qgsCount = files.filter((f) => f.type === 'qgs').length;
  const jsonCount = files.filter((f) => f.type === 'json').length;
  const projectCount = new Set(files.map((f) => f.project)).size;

  const handleDownload = (file: StorageFile) => {
    window.open(file.url, '_blank');
  };

  const handleView = (file: StorageFile) => {
    // Open in new window for viewing
    const viewWindow = window.open('', '_blank');
    if (viewWindow) {
      viewWindow.document.write(`
        <html>
          <head>
            <title>${file.filename}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                background: #1e1e1e;
                color: #d4d4d4;
                padding: 20px;
                margin: 0;
              }
              pre {
                background: #252526;
                padding: 20px;
                border-radius: 8px;
                overflow: auto;
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .header {
                background: #2d2d30;
                padding: 15px 20px;
                margin: -20px -20px 20px -20px;
                border-bottom: 2px solid #007acc;
              }
              .header h1 {
                margin: 0;
                color: #007acc;
                font-size: 18px;
              }
              .header p {
                margin: 5px 0 0 0;
                color: #858585;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${file.filename}</h1>
              <p>${file.project} - ${file.description}</p>
            </div>
            <pre id="content">Loading...</pre>
            <script>
              fetch('${file.url}')
                .then(response => response.text())
                .then(text => {
                  document.getElementById('content').textContent = text;
                })
                .catch(err => {
                  document.getElementById('content').textContent = 'Error loading file: ' + err.message;
                });
            </script>
          </body>
        </html>
      `);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Project Storage & Files
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    QGIS Files
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {qgsCount}
                  </Typography>
                </Box>
                <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
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
                    JSON Files
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {jsonCount}
                  </Typography>
                </Box>
                <CodeIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.3 }} />
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
                    Projects
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {projectCount}
                  </Typography>
                </Box>
                <FolderIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
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
                    Total Files
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {files.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Szukaj plików lub projektów..."
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label="Wszystkie"
            onClick={() => setFileTypeFilter('all')}
            color={fileTypeFilter === 'all' ? 'primary' : 'default'}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="QGS"
            onClick={() => setFileTypeFilter('qgs')}
            color={fileTypeFilter === 'qgs' ? 'primary' : 'default'}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="JSON"
            onClick={() => setFileTypeFilter('json')}
            color={fileTypeFilter === 'json' ? 'primary' : 'default'}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
      </Box>

      {/* Files Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Typ</TableCell>
              <TableCell>Nazwa pliku</TableCell>
              <TableCell>Projekt</TableCell>
              <TableCell>Opis</TableCell>
              <TableCell>Ścieżka</TableCell>
              <TableCell align="right">Akcje</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    Nie znaleziono plików
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredFiles.map((file, index) => (
                <TableRow key={`${file.project}-${file.filename}-${index}`}>
                  <TableCell>
                    <Chip
                      label={file.type.toUpperCase()}
                      size="small"
                      color={file.type === 'qgs' ? 'primary' : 'secondary'}
                      icon={file.type === 'qgs' ? <DescriptionIcon /> : <CodeIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {file.filename}
                    </Typography>
                  </TableCell>
                  <TableCell>{file.project}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {file.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: 'monospace', color: 'text.secondary' }}
                    >
                      {file.path}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Wyświetl plik">
                      <IconButton size="small" onClick={() => handleView(file)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Pobierz plik">
                      <IconButton size="small" onClick={() => handleDownload(file)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Wyświetlanie {filteredFiles.length} z {files.length} plików
      </Typography>
    </Box>
  );
}
