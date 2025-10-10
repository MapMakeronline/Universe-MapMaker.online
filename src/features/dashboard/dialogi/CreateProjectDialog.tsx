// Dialog for creating a new project with backend integration
// Supports: Create new project OR Import QGIS project (.qgz, .qgs)
'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Close from '@mui/icons-material/Close';
import Add from '@mui/icons-material/Add';
import CloudUpload from '@mui/icons-material/CloudUpload';
import InsertDriveFile from '@mui/icons-material/InsertDriveFile';
import CheckCircle from '@mui/icons-material/CheckCircle';
import type { CreateProjectData } from '@/api/typy/types';

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: CreateProjectData) => Promise<void>;
  onImportQGIS?: (
    file: File,
    projectName: string,
    domain: string,
    description?: string,
    onProgress?: (progress: number) => void
  ) => Promise<void>;
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
  const [qgisDomain, setQgisDomain] = useState('');
  const [qgisDescription, setQgisDescription] = useState('');
  const [qgisError, setQgisError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<'idle' | 'creating' | 'uploading'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

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

  const validateAndSetFile = (file: File | null) => {
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

    // Validate file size (max 100 MB)
    const maxSize = 100 * 1024 * 1024; // 100 MB in bytes
    if (file.size > maxSize) {
      setQgisError(`Plik jest za duży (${(file.size / 1024 / 1024).toFixed(2)} MB). Maksymalny rozmiar to 100 MB.`);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    validateAndSetFile(file || null);
  };

  // Drag & drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isImporting) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isImporting) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleImportSubmit = async () => {
    if (!qgisFile || !qgisProjectName || !qgisDomain || !onImportQGIS) return;

    setIsImporting(true);
    setQgisError(null);
    setImportStep('creating');

    try {
      // Create progress callback that updates state and sets step to uploading
      const handleProgress = (progress: number) => {
        setUploadProgress(progress);
        if (progress > 0 && importStep !== 'uploading') {
          setImportStep('uploading');
        }
      };

      await onImportQGIS(qgisFile, qgisProjectName, qgisDomain, qgisDescription, handleProgress);
      // Reset form on success
      setQgisFile(null);
      setQgisProjectName('');
      setQgisDomain('');
      setQgisDescription('');
      setUploadProgress(0);
      setImportStep('idle');
      setActiveTab(0); // Switch back to create tab
    } catch (error: any) {
      setQgisError(error.message || 'Wystąpił błąd podczas importowania projektu');
      setUploadProgress(0);
      setImportStep('idle');
    } finally {
      setIsImporting(false);
    }
  };

  const isCreateValid =
    formData.project.length >= 3 && formData.domain.length >= 3 &&
    (formData.projectDescription?.length || 0) <= 100;

  const isImportValid = qgisFile !== null && qgisProjectName.length >= 3 && qgisDomain.length >= 3;

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
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                  gap: 1,
                }}
              >
                {CATEGORIES.map((category) => (
                  <FormControlLabel
                    key={category}
                    control={
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                      />
                    }
                    label={category}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        </TabPanel>

        {/* Tab 1: Import QGIS project */}
        <TabPanel value={activeTab} index={1}>
          <Stack spacing={3}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Importuj projekt QGIS z pliku .qgz lub .qgs. System automatycznie:
              <br />1. Utworzy nowy projekt z podaną nazwą i domeną
              <br />2. Zaimportuje warstwy z pliku QGIS do projektu
            </Alert>

            {isImporting && (
              <Box sx={{ width: '100%' }}>
                <LinearProgress
                  variant={importStep === 'uploading' && uploadProgress > 0 ? 'determinate' : 'indeterminate'}
                  value={uploadProgress}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
                  {importStep === 'creating' && '⏳ Tworzenie projektu...'}
                  {importStep === 'uploading' && uploadProgress > 0 && `📤 Wysyłanie pliku... ${uploadProgress}%`}
                  {importStep === 'uploading' && uploadProgress === 0 && '📤 Rozpoczynanie wysyłania...'}
                </Typography>
              </Box>
            )}

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

              {/* Drag & Drop Zone */}
              <Box
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  border: isDragging
                    ? `2px dashed ${theme.palette.primary.main}`
                    : qgisFile
                    ? `2px solid ${theme.palette.success.main}`
                    : '2px dashed #d1d5db',
                  borderRadius: '8px',
                  bgcolor: isDragging
                    ? 'rgba(247, 94, 76, 0.05)'
                    : qgisFile
                    ? 'rgba(76, 175, 80, 0.05)'
                    : 'white',
                  p: 3,
                  textAlign: 'center',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    borderColor: isImporting ? '#d1d5db' : theme.palette.primary.main,
                    bgcolor: isImporting ? 'white' : 'rgba(247, 94, 76, 0.02)',
                  },
                }}
              >
                {!qgisFile ? (
                  <>
                    <CloudUpload
                      sx={{
                        fontSize: 48,
                        color: isDragging ? theme.palette.primary.main : '#9ca3af',
                        mb: 2,
                      }}
                    />
                    <Typography variant="body1" fontWeight={600} gutterBottom>
                      {isDragging
                        ? 'Upuść plik tutaj'
                        : 'Przeciągnij i upuść plik QGIS'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      lub
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
                        variant="outlined"
                        component="span"
                        disabled={isImporting}
                        sx={{
                          mt: 1,
                          textTransform: 'none',
                          borderColor: theme.palette.primary.main,
                          color: theme.palette.primary.main,
                          '&:hover': {
                            borderColor: theme.palette.primary.dark,
                            bgcolor: 'rgba(247, 94, 76, 0.05)',
                          },
                        }}
                      >
                        Wybierz plik z komputera
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
                      Obsługiwane formaty: .qgz, .qgs (max. 100 MB)
                    </Typography>
                  </>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    <InsertDriveFile sx={{ fontSize: 40, color: theme.palette.success.main }} />
                    <Box sx={{ textAlign: 'left', flex: 1 }}>
                      <Typography variant="body1" fontWeight={600} color="success.main">
                        {qgisFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(qgisFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <Chip
                      icon={<CheckCircle />}
                      label="Gotowy do importu"
                      color="success"
                      size="small"
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        setQgisFile(null);
                        setQgisProjectName('');
                      }}
                      disabled={isImporting}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' },
                      }}
                    >
                      <Close />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </Box>

            {qgisFile && (
              <>
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

                <TextField
                  label="Domena"
                  placeholder="Subdomena dla projektu (minimum 3 znaki)"
                  fullWidth
                  required
                  value={qgisDomain}
                  onChange={(e) => {
                    const sanitized = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setQgisDomain(sanitized);
                  }}
                  helperText="Minimum 3 znaki, format: example-domain (wymagane)"
                  error={qgisDomain.length > 0 && qgisDomain.length < 3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      '&:hover fieldset': { borderColor: theme.palette.primary.main },
                    },
                  }}
                />

                <TextField
                  label="Opis"
                  placeholder="Opisz projekt (opcjonalnie, maksymalnie 100 znaków)"
                  fullWidth
                  multiline
                  rows={3}
                  value={qgisDescription}
                  onChange={(e) => setQgisDescription(e.target.value)}
                  helperText={`${qgisDescription.length}/100 (opcjonalnie)`}
                  error={qgisDescription.length > 100}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      '&:hover fieldset': { borderColor: theme.palette.primary.main },
                    },
                  }}
                />
              </>
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
            {isImporting ? 'Tworzenie i importowanie...' : 'Utwórz i importuj'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
