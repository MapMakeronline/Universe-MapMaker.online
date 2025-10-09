'use client';

import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import { useTheme } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface AddNationalLawModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { type: 'create' | 'import'; [key: string]: any }) => void;
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const AddNationalLawModal: React.FC<AddNationalLawModalProps> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [createFormData, setCreateFormData] = useState({
    nazwaApp: '',
    nazwaGrupy: 'Stwórz poza grupami',
    warstwaZrodlowa: 'test111',
    temat: '3.4 Zagospodarowanie pr...',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importFormData, setImportFormData] = useState({
    nazwaApp: '',
    nazwaGrupy: 'Stwórz poza grupami',
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImportFormChange = (field: string, value: string) => {
    setImportFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (activeTab === 0) {
      // Stwórz APP
      onSubmit({
        type: 'create',
        ...createFormData
      });
    } else {
      // Importuj APP
      onSubmit({
        type: 'import',
        file: selectedFile,
        ...importFormData
      });
    }
    
    // Reset form
    setCreateFormData({
      nazwaApp: '',
      nazwaGrupy: 'Stwórz poza grupami',
      warstwaZrodlowa: 'test111',
      temat: '3.4 Zagospodarowanie pr...',
    });
    setImportFormData({
      nazwaApp: '',
      nazwaGrupy: 'Stwórz poza grupami',
    });
    setSelectedFile(null);
    setActiveTab(0);
    onClose();
  };

  const isSubmitDisabled = () => {
    if (activeTab === 0) {
      return !createFormData.nazwaApp.trim();
    } else {
      return !selectedFile || !importFormData.nazwaApp.trim();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '480px',
          width: '90%',
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: '#4a5568',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          fontSize: '16px',
          fontWeight: 600,
          m: 0,
        }}
      >
        Stwórz lub importuj APP
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ 
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          <CloseIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ bgcolor: '#f7f9fc', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              color: '#4a5568',
              '&.Mui-selected': {
                color: '#4a5568',
                bgcolor: 'white',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
              }
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            }
          }}
        >
          <Tab label="Stwórz APP" />
          <Tab label="Importuj APP" />
        </Tabs>
      </Box>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 3,
        }}
      >
        {/* Stwórz APP Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Nazwa APP */}
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Nazwa APP
              </Typography>
              <TextField
                fullWidth
                value={createFormData.nazwaApp}
                onChange={(e) => handleCreateFormChange('nazwaApp', e.target.value)}
                placeholder="Wpisz nazwę APP"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '14px',
                    py: 1.5,
                  }
                }}
              />
            </Box>

            {/* Nazwa grupy */}
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Nazwa grupy
              </Typography>
              <TextField
                select
                fullWidth
                value={createFormData.nazwaGrupy}
                onChange={(e) => handleCreateFormChange('nazwaGrupy', e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '14px',
                    py: 1.5,
                  },
                  '& .MuiSelect-icon': {
                    color: theme.palette.text.secondary,
                  }
                }}
              >
                <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
                <MenuItem value="Miejscowe plany">Miejscowe plany</MenuItem>
                <MenuItem value="Infrastruktura">Infrastruktura</MenuItem>
                <MenuItem value="Środowisko">Środowisko</MenuItem>
              </TextField>
            </Box>

            {/* Warstwa źródłowa */}
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Warstwa źródłowa
              </Typography>
              <TextField
                select
                fullWidth
                value={createFormData.warstwaZrodlowa}
                onChange={(e) => handleCreateFormChange('warstwaZrodlowa', e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '14px',
                    py: 1.5,
                  },
                  '& .MuiSelect-icon': {
                    color: theme.palette.text.secondary,
                  }
                }}
              >
                <MenuItem value="test111">test111</MenuItem>
                <MenuItem value="Warstwa 1">Warstwa 1</MenuItem>
                <MenuItem value="Warstwa 2">Warstwa 2</MenuItem>
                <MenuItem value="Warstwa 3">Warstwa 3</MenuItem>
              </TextField>
            </Box>

            {/* Temat */}
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Temat
              </Typography>
              <TextField
                select
                fullWidth
                value={createFormData.temat}
                onChange={(e) => handleCreateFormChange('temat', e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '14px',
                    py: 1.5,
                  },
                  '& .MuiSelect-icon': {
                    color: theme.palette.text.secondary,
                  }
                }}
              >
                <MenuItem value="3.4 Zagospodarowanie pr...">3.4 Zagospodarowanie przestrzenne</MenuItem>
                <MenuItem value="1.1 Budynki">1.1 Budynki</MenuItem>
                <MenuItem value="1.2 Działki katasztralne">1.2 Działki katasztralne</MenuItem>
                <MenuItem value="2.1 Sieci transportowe">2.1 Sieci transportowe</MenuItem>
                <MenuItem value="2.2 Usługi komunalne i administracyjne">2.2 Usługi komunalne i administracyjne</MenuItem>
                <MenuItem value="3.1 Pomniki przyrody">3.1 Pomniki przyrody</MenuItem>
              </TextField>
            </Box>
          </Box>
        </TabPanel>

        {/* Importuj APP Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* File upload area */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 1,
              }}
            >
              <input
                accept=".app,.zip,.shp,.geojson"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="contained"
                  component="span"
                  sx={{
                    bgcolor: '#4a5568',
                    color: 'white',
                    px: 2,
                    py: 1,
                    fontSize: '14px',
                    fontWeight: 500,
                    borderRadius: '4px',
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: '#2d3748',
                    }
                  }}
                >
                  Wybierz plik
                </Button>
              </label>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.text.secondary,
                }}
              >
                {selectedFile ? selectedFile.name : 'Nie wybrano pliku'}
              </Typography>
            </Box>

            {/* Nazwa APP for import */}
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Nazwa APP
              </Typography>
              <TextField
                fullWidth
                value={importFormData.nazwaApp}
                onChange={(e) => handleImportFormChange('nazwaApp', e.target.value)}
                placeholder="Wpisz nazwę APP"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '14px',
                    py: 1.5,
                  }
                }}
              />
            </Box>

            {/* Nazwa grupy for import */}
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Nazwa grupy
              </Typography>
              <TextField
                select
                fullWidth
                value={importFormData.nazwaGrupy}
                onChange={(e) => handleImportFormChange('nazwaGrupy', e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '14px',
                    py: 1.5,
                  },
                  '& .MuiSelect-icon': {
                    color: theme.palette.text.secondary,
                  }
                }}
              >
                <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
                <MenuItem value="Miejscowe plany">Miejscowe plany</MenuItem>
                <MenuItem value="Infrastruktura">Infrastruktura</MenuItem>
                <MenuItem value="Środowisko">Środowisko</MenuItem>
              </TextField>
            </Box>
          </Box>
        </TabPanel>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 2,
          borderTop: '1px solid #e5e7eb',
          justifyContent: 'center',
        }}
      >
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitDisabled()}
          sx={{
            bgcolor: '#4a5568',
            color: 'white',
            px: 4,
            py: 1,
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '4px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#2d3748',
            },
            '&:disabled': {
              bgcolor: '#a0aec0',
              color: 'white',
            }
          }}
        >
          {activeTab === 0 ? 'Stwórz' : 'Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddNationalLawModal;