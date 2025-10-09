// Dialog for creating a new project with backend integration
// Supports: Create new project OR Import QGIS project (.qgz, .qgs)
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  Stack,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Alert,
  Chip,
} from '@mui/material';
import { Close, Add, CloudUpload, InsertDriveFile, CheckCircle } from '@mui/icons-material';
import type { CreateProjectData } from '@/lib/api/types';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateProjectData) => Promise<void>;
  onImportQGIS?: (file: File, projectName: string) => Promise<void>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const CATEGORIES = ['EMUiA', 'SIP', 'Suikzp', 'MPZP', 'EGiB', 'Inne'];

export function CreateProjectDialog({
  open,
  onClose,
  onCreate,
  onImportQGIS
}: CreateProjectDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Create project form state
  const [formData, setFormData] = useState({
    project: '',
    domain: '',
    projectDescription: '',
    keywords: '',
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // QGIS import form state
  const [qgisFile, setQgisFile] = useState<File | null>(null);
  const [qgisProjectName, setQgisProjectName] = useState('');
  const [qgisError, setQgisError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Reset errors when switching tabs
    setQgisError(null);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onCreate({
        project: formData.project,
        domain: formData.domain,
        projectDescription: formData.projectDescription,
        keywords: formData.keywords,
        categories: selectedCategories.length > 0 ? [selectedCategories[0]] : ['Inne'],
      });
      // Reset form
      setFormData({
        project: '',
        domain: '',
        projectDescription: '',
        keywords: '',
      });
      setSelectedCategories([]);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setQgisError(null);

    if (!file) {
      setQgisFile(null);
      setQgisProjectName('');
      return;
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'qgz' && extension !== 'qgs') {
      setQgisError('Nieprawidłowy format pliku. Wybierz plik .qgz lub .qgs');
      setQgisFile(null);
      setQgisProjectName('');
      return;
    }

    setQgisFile(file);

    // Auto-generate project name from filename (sanitize for backend)
    const baseName = file.name.replace(/\.(qgz|qgs)$/i, '');
    const sanitized = baseName
      .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĘŁŃÓŚŹŻ_]/g, '_')
      .replace(/^_+|_+$/g, '');
    setQgisProjectName(sanitized);
  };

  const handleImportSubmit = async () => {
    if (!qgisFile || !qgisProjectName || !onImportQGIS) return;

    setIsImporting(true);
    setQgisError(null);

    try {
      await onImportQGIS(qgisFile, qgisProjectName);
      // Reset form on success
      setQgisFile(null);
      setQgisProjectName('');
      setActiveTab(0); // Switch back to create tab
    } catch (error: any) {
      setQgisError(error.message || 'Wystąpił błąd podczas importowania projektu');
    } finally {
      setIsImporting(false);
    }
  };

  const isCreateValid =
    formData.project.length >= 3 && formData.domain.length >= 3 &&
    (formData.projectDescription?.length || 0) <= 100;

  const isImportValid = qgisFile !== null && qgisProjectName.length >= 3;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600,
          bgcolor: '#4a5568',
          color: 'white',
          py: 2,
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeTab === 0 ? <Add /> : <CloudUpload />}
          <Typography variant="h6" component="span" fontWeight={600}>
            {activeTab === 0 ? 'Utwórz nowy projekt' : 'Importuj projekt QGIS'}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          disabled={isSubmitting || isImporting}
          sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' } }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          sx={{ bgcolor: '#f7f9fc' }}
        >
          <Tab
            icon={<Add />}
            iconPosition="start"
            label="Utwórz nowy"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': { color: theme.palette.primary.main },
            }}
          />
          {onImportQGIS && (
            <Tab
              icon={<CloudUpload />}
              iconPosition="start"
              label="Importuj QGIS"
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                '&.Mui-selected': { color: theme.palette.primary.main },
              }}
            />
          )}
        </Tabs>
      </Box>

      <DialogContent sx={{ bgcolor: '#f7f9fc', px: 3, py: 3 }}>
        {/* Tab 0: Create new project */}
        <TabPanel value={activeTab} index={0}>
          <Stack spacing={3}>
            <TextField
              label="Nazwa projektu"
              placeholder="Wpisz minimum 3 znaki (bez spacji)"
              fullWidth
              required
              value={formData.project}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, project: e.target.value }))
              }
              helperText="Minimum 3 znaki, dozwolone: litery, cyfry, _ (wymagane)"
              error={formData.project.length > 0 && formData.project.length < 3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                },
              }}
            />

            <TextField
              label="Domena"
              placeholder="Subdomena dla projektu (minimum 3 znaki)"
              fullWidth
              required
              value={formData.domain}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, domain: e.target.value }))
              }
              helperText="Minimum 3 znaki, format: example-domain (wymagane)"
              error={formData.domain.length > 0 && formData.domain.length < 3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                },
              }}
            />

            <TextField
              label="Słowa kluczowe"
              placeholder="Opisz projekt słowami kluczowymi (oddziel przecinkami)"
              fullWidth
              value={formData.keywords}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, keywords: e.target.value }))
              }
              helperText="Opcjonalne"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                },
              }}
            />

            <TextField
              label="Opis"
              placeholder="Opisz swój projekt (maksymalnie 100 znaków)"
              fullWidth
              multiline
              rows={3}
              value={formData.projectDescription}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, projectDescription: e.target.value }))
              }
              helperText={`${formData.projectDescription.length}/100 (opcjonalnie)`}
              error={formData.projectDescription.length > 100}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  '&:hover fieldset': { borderColor: theme.palette.primary.main },
                },
              }}
            />

            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="600">
                Kategorie:
              </Typography>
              <Grid container spacing={1}>
                {CATEGORIES.map((category) => (
                  <Grid item xs={6} sm={4} key={category}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryToggle(category)}
                        />
                      }
                      label={category}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </TabPanel>

        {/* Tab 1: Import QGIS project */}
        <TabPanel value={activeTab} index={1}>
          <Stack spacing={3}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Importuj projekt QGIS z pliku .qgz lub .qgs. Plik zostanie przeanalizowany
              i utworzony zostanie nowy projekt z warstwami.
            </Alert>

            {qgisError && (
              <Alert severity="error" onClose={() => setQgisError(null)}>
                {qgisError}
              </Alert>
            )}

            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontSize: '14px', fontWeight: 500, mb: 2 }}
              >
                Wybierz plik QGIS:
              </Typography>

              <input
                accept=".qgz,.qgs"
                style={{ display: 'none' }}
                id="qgis-file-upload"
                type="file"
                onChange={handleFileChange}
                disabled={isImporting}
              />
              <label htmlFor="qgis-file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={isImporting}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    textTransform: 'none',
                    px: 3,
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                  }}
                >
                  Wybierz plik (.qgz, .qgs)
                </Button>
              </label>

              {qgisFile && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <InsertDriveFile color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {qgisFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(qgisFile.size / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>
                  <Chip
                    icon={<CheckCircle />}
                    label="Wybrano"
                    color="success"
                    size="small"
                  />
                </Box>
              )}
            </Box>

            {qgisFile && (
              <TextField
                label="Nazwa projektu"
                placeholder="Nazwa projektu (min. 3 znaki)"
                fullWidth
                required
                value={qgisProjectName}
                onChange={(e) => {
                  const sanitized = e.target.value
                    .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĘŁŃÓŚŹŻ_]/g, '_')
                    .replace(/^_+|_+$/g, '');
                  setQgisProjectName(sanitized);
                }}
                helperText="Tylko litery, cyfry i _ (wymagane, minimum 3 znaki)"
                error={qgisProjectName.length > 0 && qgisProjectName.length < 3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    '&:hover fieldset': { borderColor: theme.palette.primary.main },
                  },
                }}
              />
            )}
          </Stack>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#f7f9fc', px: 3, pb: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={isSubmitting || isImporting}
          sx={{
            textTransform: 'none',
            color: theme.palette.text.primary,
          }}
        >
          Anuluj
        </Button>

        {activeTab === 0 ? (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isCreateValid || isSubmitting}
            sx={{
              bgcolor: theme.palette.primary.main,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            {isSubmitting ? 'Tworzenie...' : 'Utwórz projekt'}
          </Button>
        ) : (
          <Button
            onClick={handleImportSubmit}
            variant="contained"
            disabled={!isImportValid || isImporting}
            startIcon={<CloudUpload />}
            sx={{
              bgcolor: theme.palette.primary.main,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            {isImporting ? 'Importowanie...' : 'Importuj projekt'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
