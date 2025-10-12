// Dialog for creating a new project with backend integration
// Supports:
// 1. Create empty project
// 2. Import QGIS project (.qgz, .qgs)
// 3. Import Shapefile project (.shp + supporting files)
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
import Map from '@mui/icons-material/Map';
import FolderZip from '@mui/icons-material/FolderZip';
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
  onImportShapefile?: (
    shapefiles: ShapefileSet[],
    projectName: string,
    domain: string,
    description?: string,
    onProgress?: (current: number, total: number) => void
  ) => Promise<void>;
}

export interface ShapefileSet {
  name: string; // Layer name (from filename)
  shpFile: File; // Required .shp file
  shxFile?: File; // Optional .shx file
  dbfFile?: File; // Optional .dbf file
  prjFile?: File; // Optional .prj file
  cpgFile?: File; // Optional .cpg file
  qpjFile?: File; // Optional .qpj file
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
  onImportQGIS,
  onImportShapefile
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
  const [importStep, setImportStep] = useState<'idle' | 'creating' | 'uploading' | 'processing'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Shapefile import form state
  const [shapefiles, setShapefiles] = useState<ShapefileSet[]>([]);
  const [shpProjectName, setShpProjectName] = useState('');
  const [shpDomain, setShpDomain] = useState('');
  const [shpDescription, setShpDescription] = useState('');
  const [shpError, setShpError] = useState<string | null>(null);
  const [isImportingShp, setIsImportingShp] = useState(false);
  const [shpImportProgress, setShpImportProgress] = useState({ current: 0, total: 0 });
  const [isDraggingShp, setIsDraggingShp] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Reset errors when switching tabs
    setQgisError(null);
    setShpError(null);
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
        // When upload reaches 100%, switch to processing state
        if (progress >= 100 && importStep !== 'processing') {
          setImportStep('processing');
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
      // Extract detailed error message from RTK Query error structure
      const errorMessage = error?.data?.message || error?.message || 'Wystąpił błąd podczas importowania projektu';

      setQgisError(errorMessage);
      setUploadProgress(0);
      setImportStep('idle');
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Handle Shapefile selection
   * User can select multiple .shp files or ZIP files
   * Groups files by base name (e.g., "layer.shp", "layer.shx", "layer.dbf" → one ShapefileSet)
   */
  const handleShapefileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setShpError(null);

    // Group files by base name (without extension)
    const fileGroups: { [baseName: string]: { [ext: string]: File } } = {};

    Array.from(files).forEach((file) => {
      const fileName = file.name;
      const extension = fileName.split('.').pop()?.toLowerCase() || '';

      // Handle ZIP files (assume each ZIP is a complete shapefile)
      if (extension === 'zip') {
        const baseName = fileName.replace(/\.zip$/i, '');
        if (!fileGroups[baseName]) {
          fileGroups[baseName] = {};
        }
        fileGroups[baseName]['zip'] = file;
        return;
      }

      // Handle individual shapefile components
      if (['shp', 'shx', 'dbf', 'prj', 'cpg', 'qpj'].includes(extension)) {
        const baseName = fileName.replace(/\.(shp|shx|dbf|prj|cpg|qpj)$/i, '');
        if (!fileGroups[baseName]) {
          fileGroups[baseName] = {};
        }
        fileGroups[baseName][extension] = file;
      }
    });

    // Convert file groups to ShapefileSet array
    const newShapefiles: ShapefileSet[] = Object.entries(fileGroups).map(([baseName, files]) => {
      // If ZIP, we'll handle it on backend
      if (files['zip']) {
        return {
          name: baseName,
          shpFile: files['zip'], // ZIP file treated as SHP for backend
        };
      }

      // Validate: must have at least .shp file
      if (!files['shp']) {
        setShpError(`Brak pliku .shp dla warstwy "${baseName}". Każdy shapefile musi zawierać plik .shp.`);
        return null;
      }

      return {
        name: baseName,
        shpFile: files['shp'],
        shxFile: files['shx'],
        dbfFile: files['dbf'],
        prjFile: files['prj'],
        cpgFile: files['cpg'],
        qpjFile: files['qpj'],
      };
    }).filter((shp): shp is ShapefileSet => shp !== null);

    setShapefiles((prev) => [...prev, ...newShapefiles]);

    // Auto-generate project name from first shapefile
    if (newShapefiles.length > 0 && !shpProjectName) {
      const sanitized = newShapefiles[0].name
        .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĘŁŃÓŚŹŻ_]/g, '_')
        .replace(/^_+|_+$/g, '');
      setShpProjectName(sanitized);
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
          {activeTab === 0 ? <Add /> : activeTab === 1 ? <CloudUpload /> : <Map />}
          <Typography variant="h6" component="span" fontWeight={600}>
            {activeTab === 0 ? 'Utwórz nowy projekt' : activeTab === 1 ? 'Importuj projekt QGIS' : 'Importuj Shapefile'}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          disabled={isSubmitting || isImporting || isImportingShp}
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
          {onImportShapefile && (
            <Tab
              icon={<Map />}
              iconPosition="start"
              label="Importuj SHP"
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
                  {importStep === 'processing' && '⚙️ Przetwarzanie pliku QGIS na serwerze... To może potrwać kilka minut.'}
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

        {/* Tab 2: Import Shapefile project */}
        <TabPanel value={activeTab} index={2}>
          <Stack spacing={3}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Importuj pliki Shapefile (.shp + pliki pomocnicze). System automatycznie:
              <br />1. Utworzy nowy projekt z podaną nazwą i domeną
              <br />2. Zaimportuje każdy shapefile jako osobną warstwę
              <br />
              <br /><strong>Wspierane formaty:</strong>
              <br />• Pliki ZIP zawierające shapefile (.shp + .shx + .dbf + .prj)
              <br />• Pojedyncze pliki .shp (plus pliki pomocnicze)
            </Alert>

            {isImportingShp && shpImportProgress.total > 0 && (
              <Box sx={{ width: '100%' }}>
                <LinearProgress
                  variant="determinate"
                  value={(shpImportProgress.current / shpImportProgress.total) * 100}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
                  ⚙️ Importowanie warstwy {shpImportProgress.current} z {shpImportProgress.total}...
                </Typography>
              </Box>
            )}

            {shpError && (
              <Alert severity="error" onClose={() => setShpError(null)}>
                {shpError}
              </Alert>
            )}

            <Box>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontSize: '14px', fontWeight: 500, mb: 2 }}
              >
                Wybierz pliki Shapefile:
              </Typography>

              {/* File selection (simplified - will be extended later) */}
              <Box
                sx={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  bgcolor: 'white',
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <FolderZip sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Przeciągnij pliki ZIP lub SHP
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  lub
                </Typography>
                <input
                  accept=".zip,.shp,.shx,.dbf,.prj,.cpg,.qpj"
                  style={{ display: 'none' }}
                  id="shp-file-upload"
                  type="file"
                  multiple
                  disabled={isImportingShp}
                  onChange={(e) => handleShapefileSelection(e.target.files)}
                />
                <label htmlFor="shp-file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    disabled={isImportingShp}
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
                    Wybierz pliki
                  </Button>
                </label>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 2 }}>
                  Wybierz jeden lub więcej plików ZIP lub SHP
                </Typography>
              </Box>

              {/* List of selected files */}
              {shapefiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Wybrane pliki ({shapefiles.length}):
                  </Typography>
                  <Stack spacing={1}>
                    {shapefiles.map((shp, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          bgcolor: 'white',
                          p: 1.5,
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <InsertDriveFile sx={{ fontSize: 24, color: theme.palette.primary.main, mr: 1.5 }} />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {shp.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setShapefiles((prev) => prev.filter((_, i) => i !== index));
                          }}
                          disabled={isImportingShp}
                          sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            {shapefiles.length > 0 && (
              <>
                <TextField
                  label="Nazwa projektu"
                  placeholder="Nazwa projektu (min. 3 znaki)"
                  fullWidth
                  required
                  value={shpProjectName}
                  onChange={(e) => {
                    const sanitized = e.target.value
                      .replace(/[^a-zA-Z0-9ąćęłńóśźżĄĘŁŃÓŚŹŻ_]/g, '_')
                      .replace(/^_+|_+$/g, '');
                    setShpProjectName(sanitized);
                  }}
                  helperText="Tylko litery, cyfry i _ (wymagane, minimum 3 znaki)"
                  error={shpProjectName.length > 0 && shpProjectName.length < 3}
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
                  value={shpDomain}
                  onChange={(e) => {
                    const sanitized = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setShpDomain(sanitized);
                  }}
                  helperText="Minimum 3 znaki, format: example-domain (wymagane)"
                  error={shpDomain.length > 0 && shpDomain.length < 3}
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
                  value={shpDescription}
                  onChange={(e) => setShpDescription(e.target.value)}
                  helperText={`${shpDescription.length}/100 (opcjonalnie)`}
                  error={shpDescription.length > 100}
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
          disabled={isSubmitting || isImporting || isImportingShp}
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
        ) : activeTab === 1 ? (
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
        ) : (
          <Button
            onClick={async () => {
              if (!onImportShapefile || shapefiles.length === 0) return;

              setIsImportingShp(true);
              setShpError(null);
              setShpImportProgress({ current: 0, total: shapefiles.length });

              try {
                await onImportShapefile(
                  shapefiles,
                  shpProjectName,
                  shpDomain,
                  shpDescription,
                  (current, total) => {
                    setShpImportProgress({ current, total });
                  }
                );

                // Reset form on success
                setShapefiles([]);
                setShpProjectName('');
                setShpDomain('');
                setShpDescription('');
                setShpImportProgress({ current: 0, total: 0 });
                setActiveTab(0); // Switch back to create tab
              } catch (error: any) {
                const errorMessage = error?.data?.message || error?.message || 'Wystąpił błąd podczas importowania plików SHP';
                setShpError(errorMessage);
                setShpImportProgress({ current: 0, total: 0 });
              } finally {
                setIsImportingShp(false);
              }
            }}
            variant="contained"
            disabled={shapefiles.length === 0 || shpProjectName.length < 3 || shpDomain.length < 3 || isImportingShp}
            startIcon={<Map />}
            sx={{
              bgcolor: theme.palette.primary.main,
              textTransform: 'none',
              px: 3,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            {isImportingShp ? 'Importowanie warstw...' : 'Utwórz i importuj SHP'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
