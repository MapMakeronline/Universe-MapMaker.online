'use client';

import React, { useState, useCallback } from 'react';
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
import Link from '@mui/material/Link';
import {
  Close as CloseIcon,
} from '@mui/icons-material';

interface ImportLayerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

type FileFormat = 'csv' | 'gml' | 'shp' | 'geoJSON' | 'geoTIFF' | 'WMS' | 'WFS';

const ImportLayerModal: React.FC<ImportLayerModalProps> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>('csv');
  const [formData, setFormData] = useState({
    nazwaWarstwy: '',
    nazwaGrupy: 'Stwórz poza grupami',
    epsg: '', // Empty by default - backend will use .prj file coordinate system
    wmsUrl: '',
    wfsUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null); // Multiple files for Shapefile
  const [isDragging, setIsDragging] = useState(false);
  const [availableLayers, setAvailableLayers] = useState<string[]>([]);

  const handleFormatChange = (_event: React.SyntheticEvent, newValue: FileFormat) => {
    setSelectedFormat(newValue);
    setSelectedFile(null);
    setSelectedFiles(null); // Clear multiple files
    setAvailableLayers([]);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (selectedFormat === 'shp') {
        // For Shapefile, store all files
        setSelectedFiles(files);
        setSelectedFile(null);
      } else {
        // For other formats, store single file
        setSelectedFile(files[0]);
        setSelectedFiles(null);
      }
    }
  }, [selectedFormat]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (selectedFormat === 'shp') {
        // For Shapefile, store all files
        setSelectedFiles(files);
        setSelectedFile(null);
      } else {
        // For other formats, store single file
        setSelectedFile(files[0]);
        setSelectedFiles(null);
      }
    }
  };

  const handleFetchLayers = () => {
    // Mock fetch for now
    console.log('Fetching layers from:', selectedFormat === 'WMS' ? formData.wmsUrl : formData.wfsUrl);
    // In real implementation, this would fetch from the URL
  };

  const handleSubmit = () => {
    if (selectedFormat === 'WMS' || selectedFormat === 'WFS') {
      onSubmit({
        format: selectedFormat,
        url: selectedFormat === 'WMS' ? formData.wmsUrl : formData.wfsUrl,
        layers: availableLayers,
      });
    } else {
      onSubmit({
        nazwaWarstwy: formData.nazwaWarstwy,
        nazwaGrupy: formData.nazwaGrupy,
        format: selectedFormat,
        file: selectedFile,
        files: selectedFiles, // Pass multiple files for Shapefile
        epsg: selectedFormat === 'shp' ? formData.epsg : undefined,
      });
    }

    // Reset form
    setFormData({
      nazwaWarstwy: '',
      nazwaGrupy: 'Stwórz poza grupami',
      epsg: '3857',
      wmsUrl: '',
      wfsUrl: '',
    });
    setSelectedFile(null);
    setSelectedFiles(null);
    setAvailableLayers([]);
    setSelectedFormat('csv');
    onClose();
  };

  const isSubmitDisabled = () => {
    if (selectedFormat === 'WMS' || selectedFormat === 'WFS') {
      return availableLayers.length === 0;
    }
    // For Shapefile, check if files are selected, otherwise check single file
    const hasFile = selectedFormat === 'shp'
      ? (selectedFiles !== null && selectedFiles.length > 0)
      : (selectedFile !== null);
    return !formData.nazwaWarstwy.trim() || !hasFile;
  };

  const getFileExtension = () => {
    switch (selectedFormat) {
      case 'csv': return '.csv';
      case 'gml': return '.gml';
      case 'shp': return '.shp, .shx, .dbf, .cpj, .prj, .qpj, .qix, .cpg, .sbn, .sbx, .atx, .ixs, .mxs, .xml';
      case 'geoJSON': return '.geojson';
      case 'geoTIFF': return '.tiff, .TIFF, .TIF, .tif';
      default: return '';
    }
  };

  const renderFileUploadContent = () => {
    const isWmsWfs = selectedFormat === 'WMS' || selectedFormat === 'WFS';

    if (isWmsWfs) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* WMS/WFS URL Input */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Link {selectedFormat}
              </Typography>
              <TextField
                fullWidth
                value={selectedFormat === 'WMS' ? formData.wmsUrl : formData.wfsUrl}
                onChange={(e) => handleFormChange(selectedFormat === 'WMS' ? 'wmsUrl' : 'wfsUrl', e.target.value)}
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
                }}
              />
            </Box>
            <Button
              onClick={handleFetchLayers}
              variant="contained"
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                textTransform: 'none',
                '&:hover': { bgcolor: '#2d3748' },
              }}
            >
              Pobierz
            </Button>
          </Box>

          {/* Layers Display Area */}
          <Box
            sx={{
              bgcolor: 'rgba(200, 200, 220, 0.3)',
              borderRadius: '4px',
              p: 4,
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontStyle: 'italic',
                color: theme.palette.text.secondary,
              }}
            >
              Brak dostępnych warstw do wyświetlenia
            </Typography>
          </Box>
        </Box>
      );
    }

    return (
      <>
        {/* Nazwa warstwy */}
        <Box>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            Nazwa warstwy
          </Typography>
          <TextField
            fullWidth
            value={formData.nazwaWarstwy}
            onChange={(e) => handleFormChange('nazwaWarstwy', e.target.value)}
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
                color: theme.palette.text.primary,
              },
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
            fullWidth
            select
            value={formData.nazwaGrupy}
            onChange={(e) => handleFormChange('nazwaGrupy', e.target.value)}
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
              '& .MuiSelect-select': {
                fontSize: '14px',
                color: theme.palette.text.primary,
              },
            }}
          >
            <MenuItem value="Stwórz poza grupami">Stwórz poza grupami</MenuItem>
            <MenuItem value="Obszar Rewitalizacji">Obszar Rewitalizacji</MenuItem>
            <MenuItem value="Granice">Granice</MenuItem>
          </TextField>
        </Box>

        {/* EPSG field for shp only */}
        {selectedFormat === 'shp' && (
          <Box>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              EPSG (opcjonalne):
            </Typography>
            <TextField
              fullWidth
              value={formData.epsg}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only numbers
                if (value === '' || /^\d+$/.test(value)) {
                  handleFormChange('epsg', value);
                }
              }}
              placeholder="Pozostaw puste aby użyć .prj"
              size="small"
              type="number"
              inputProps={{
                min: 2000,
                max: 29385,
              }}
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
                  color: theme.palette.text.primary,
                },
              }}
            />
          </Box>
        )}

        {/* CSV specific text */}
        {selectedFormat === 'csv' && (
          <Box>
            <Typography
              sx={{
                fontSize: '13px',
                fontStyle: 'italic',
                color: theme.palette.text.primary,
                mb: 0.5,
                textAlign: 'center',
              }}
            >
              Wymagany plik z rozszerzeniem: .csv
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                color: theme.palette.text.secondary,
                textAlign: 'center',
              }}
            >
              Należy załączyć plik CSV wygenerowany przez dedykowany skrypt. Opis skryptu:{' '}
              <Link
                href="https://docs.google.com/document/d/1ZqNPzsHt_QbeShrIiXAEVzF5RyeJrrn1Vl9IqDocEw/edit?usp=sharing"
                target="_blank"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'underline',
                }}
              >
                https://docs.google.com/document/d/1ZqNPzsHt_QbeShrIiXAEVzF5RyeJrrn1Vl9IqDocEw/edit?usp=sharing
              </Link>
            </Typography>
          </Box>
        )}

        {/* SHP specific text */}
        {selectedFormat === 'shp' && (
          <Box>
            <Typography
              sx={{
                fontSize: '13px',
                fontStyle: 'italic',
                color: theme.palette.text.primary,
                mb: 0.5,
                textAlign: 'center',
              }}
            >
              Wymagane pliki z rozszerzeniem: .shp .shx .dbf
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                fontStyle: 'italic',
                color: theme.palette.text.secondary,
                textAlign: 'center',
              }}
            >
              *Wybierz EPSG z listy dostępnych lub dodaj jeden z plików (.prj lub .qpj)
            </Typography>
          </Box>
        )}

        {/* File Upload Area */}
        <Box>
          <input
            type="file"
            id="file-upload"
            accept={getFileExtension()}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            multiple={selectedFormat === 'shp'}
          />
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
            sx={{
              border: '2px dashed',
              borderColor: isDragging ? theme.palette.primary.main : '#d1d5db',
              borderRadius: '8px',
              bgcolor: isDragging ? 'rgba(79, 195, 247, 0.05)' : 'white',
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: 'rgba(79, 195, 247, 0.02)',
              },
            }}
          >
            {selectedFormat === 'shp' && selectedFiles && selectedFiles.length > 0 ? (
              <Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: theme.palette.primary.main,
                    mb: 1,
                    fontWeight: 600,
                  }}
                >
                  Wybrane pliki ({selectedFiles.length}):
                </Typography>
                {Array.from(selectedFiles).map((file, index) => (
                  <Typography
                    key={index}
                    sx={{
                      fontSize: '13px',
                      color: theme.palette.text.primary,
                      mb: 0.5,
                    }}
                  >
                    {file.name}
                  </Typography>
                ))}
              </Box>
            ) : selectedFile ? (
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.primary.main,
                  mb: 0.5,
                }}
              >
                {selectedFile.name}
              </Typography>
            ) : (
              <Typography
                sx={{
                  fontSize: '14px',
                  color: theme.palette.primary.main,
                  mb: 0.5,
                }}
              >
                {`Upuść ${selectedFormat === 'shp' ? 'pliki' : 'plik'} tutaj lub kliknij, aby wybrać z dysku (${getFileExtension()})`}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Info Text - only for non-csv formats */}
        {selectedFormat !== 'csv' && (
          <Box>
            <Typography
              sx={{
                fontSize: '12px',
                fontStyle: 'italic',
                color: theme.palette.text.secondary,
                textAlign: 'center',
              }}
            >
              Błędy geometrii są naprawiane automatycznie
            </Typography>
            <Typography
              sx={{
                fontSize: '11px',
                fontStyle: 'italic',
                color: theme.palette.text.disabled,
                textAlign: 'center',
                mt: 0.5,
              }}
            >
              Kodowanie znaków: UTF-8 · ID układu współrzędnych projektu: EPSG: 3857
            </Typography>
          </Box>
        )}
      </>
    );
  };

  const renderFooter = () => {
    const isWmsWfs = selectedFormat === 'WMS' || selectedFormat === 'WFS';

    if (isWmsWfs) {
      return (
        <DialogActions
          sx={{
            bgcolor: '#f7f9fc',
            px: 3,
            pb: 3,
            pt: 0,
            gap: 2,
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                textTransform: 'none',
                '&:hover': { bgcolor: '#2d3748' },
              }}
            >
              Wyczyść
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                textTransform: 'none',
                '&:hover': { bgcolor: '#2d3748' },
              }}
            >
              Zaznacz wszystkie
            </Button>
          </Box>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitDisabled()}
            sx={{
              bgcolor: '#4a5568',
              color: 'white',
              textTransform: 'none',
              '&:hover': { bgcolor: '#2d3748' },
              '&.Mui-disabled': {
                bgcolor: '#d1d5db',
                color: 'white',
              },
            }}
          >
            Import
          </Button>
        </DialogActions>
      );
    }

    return (
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          pb: 3,
          pt: 0,
          gap: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: '#d1d5db',
            color: theme.palette.text.primary,
            textTransform: 'none',
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Anuluj
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitDisabled()}
          sx={{
            bgcolor: '#4a5568',
            color: 'white',
            textTransform: 'none',
            '&:hover': { bgcolor: '#2d3748' },
            '&.Mui-disabled': {
              bgcolor: '#d1d5db',
              color: 'white',
            },
          }}
        >
          Import
        </Button>
      </DialogActions>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '700px',
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
        Importuj warstwę
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

      {/* Format Tabs */}
      <Box sx={{ bgcolor: '#f7f9fc', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selectedFormat}
          onChange={handleFormatChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '14px',
              minHeight: '48px',
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
            },
          }}
        >
          <Tab label="csv" value="csv" />
          <Tab label="gml" value="gml" />
          <Tab label="shp" value="shp" />
          <Tab label="geoJSON" value="geoJSON" />
          <Tab label="geoTIFF" value="geoTIFF" />
          <Tab label="WMS" value="WMS" />
          <Tab label="WFS" value="WFS" />
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {renderFileUploadContent()}
        </Box>
      </DialogContent>

      {/* Footer */}
      {renderFooter()}
    </Dialog>
  );
};

export default ImportLayerModal;
