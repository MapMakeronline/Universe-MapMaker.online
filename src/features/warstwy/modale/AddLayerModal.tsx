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
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

interface Column {
  id: string;
  name: string;
  type: 'tekst' | 'liczba_calkowita' | 'liczba_dziesietna' | 'data';
}

interface AddLayerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { nazwaWarstwy: string; typGeometrii: string; nazwaGrupy: string; columns: Column[] }) => void;
}

const AddLayerModal: React.FC<AddLayerModalProps> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nazwaWarstwy: '',
    typGeometrii: 'Multi Poligon',
    nazwaGrupy: 'Stwórz poza grupami',
  });

  const [columns, setColumns] = useState<Column[]>([]);
  const [newColumns, setNewColumns] = useState({
    tekst: '',
    liczba_calkowita: '',
    liczba_dziesietna: '',
    data: '',
  });

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewColumnChange = (type: keyof typeof newColumns, value: string) => {
    setNewColumns(prev => ({ ...prev, [type]: value }));
  };

  const addColumn = (type: 'tekst' | 'liczba_calkowita' | 'liczba_dziesietna' | 'data') => {
    const columnName = newColumns[type].trim();
    if (columnName) {
      const newColumn: Column = {
        id: `${type}_${Date.now()}`,
        name: columnName,
        type: type,
      };
      setColumns(prev => [...prev, newColumn]);
      setNewColumns(prev => ({ ...prev, [type]: '' }));
    }
  };

  const removeAllColumns = () => {
    setColumns([]);
  };

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      columns
    });
    
    // Reset form
    setFormData({
      nazwaWarstwy: '',
      typGeometrii: 'Multi Poligon',
      nazwaGrupy: 'Stwórz poza grupami',
    });
    setColumns([]);
    setNewColumns({
      tekst: '',
      liczba_calkowita: '',
      liczba_dziesietna: '',
      data: '',
    });
    onClose();
  };

  const isSubmitDisabled = () => {
    return !formData.nazwaWarstwy.trim();
  };

  const getColumnTypeLabel = (type: string) => {
    switch (type) {
      case 'tekst': return 'Tekst';
      case 'liczba_calkowita': return 'Liczba całkowita';
      case 'liczba_dziesietna': return 'Liczba dziesiętna';
      case 'data': return 'Data';
      default: return type;
    }
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
        Dodaj warstwę
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

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 3,
        }}
      >
        <Grid container spacing={3}>
          {/* Left Side - Form Fields */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                  placeholder="Wpisz nazwę warstwy"
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

              {/* Typ geometrii */}
              <Box>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    mb: 1,
                  }}
                >
                  Typ geometrii
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={formData.typGeometrii}
                  onChange={(e) => handleFormChange('typGeometrii', e.target.value)}
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
                  <MenuItem value="Multi Poligon">Multi Poligon</MenuItem>
                  <MenuItem value="Punkt">Punkt</MenuItem>
                  <MenuItem value="Linia">Linia</MenuItem>
                  <MenuItem value="Poligon">Poligon</MenuItem>
                </TextField>
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

              {/* Dodaj kolumny section */}
              <Box sx={{ mt: 2 }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2,
                    textAlign: 'center',
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    pb: 1,
                  }}
                >
                  Dodaj kolumny
                </Typography>

                {/* Column type inputs */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {/* Tekst */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.text.primary,
                        minWidth: '120px',
                      }}
                    >
                      Tekst
                    </Typography>
                    <TextField
                      size="small"
                      value={newColumns.tekst}
                      onChange={(e) => handleNewColumnChange('tekst', e.target.value)}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          borderRadius: '4px',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          fontSize: '12px',
                          py: 1,
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => addColumn('tekst')}
                      disabled={!newColumns.tekst.trim()}
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        '&:hover': { bgcolor: theme.palette.primary.dark },
                        '&:disabled': { bgcolor: '#ccc' },
                        width: 28,
                        height: 28,
                      }}
                    >
                      <AddIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </Box>

                  {/* Liczba całkowita */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.text.primary,
                        minWidth: '120px',
                      }}
                    >
                      Liczba całkowita
                    </Typography>
                    <TextField
                      size="small"
                      value={newColumns.liczba_calkowita}
                      onChange={(e) => handleNewColumnChange('liczba_calkowita', e.target.value)}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          borderRadius: '4px',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          fontSize: '12px',
                          py: 1,
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => addColumn('liczba_calkowita')}
                      disabled={!newColumns.liczba_calkowita.trim()}
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        '&:hover': { bgcolor: theme.palette.primary.dark },
                        '&:disabled': { bgcolor: '#ccc' },
                        width: 28,
                        height: 28,
                      }}
                    >
                      <AddIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </Box>

                  {/* Liczba dziesiętna */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.text.primary,
                        minWidth: '120px',
                      }}
                    >
                      Liczba dziesiętna
                    </Typography>
                    <TextField
                      size="small"
                      value={newColumns.liczba_dziesietna}
                      onChange={(e) => handleNewColumnChange('liczba_dziesietna', e.target.value)}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          borderRadius: '4px',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          fontSize: '12px',
                          py: 1,
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => addColumn('liczba_dziesietna')}
                      disabled={!newColumns.liczba_dziesietna.trim()}
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        '&:hover': { bgcolor: theme.palette.primary.dark },
                        '&:disabled': { bgcolor: '#ccc' },
                        width: 28,
                        height: 28,
                      }}
                    >
                      <AddIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </Box>

                  {/* Data */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: theme.palette.text.primary,
                        minWidth: '120px',
                      }}
                    >
                      Data
                    </Typography>
                    <TextField
                      size="small"
                      value={newColumns.data}
                      onChange={(e) => handleNewColumnChange('data', e.target.value)}
                      sx={{
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          borderRadius: '4px',
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          fontSize: '12px',
                          py: 1,
                        }
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => addColumn('data')}
                      disabled={!newColumns.data.trim()}
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        '&:hover': { bgcolor: theme.palette.primary.dark },
                        '&:disabled': { bgcolor: '#ccc' },
                        width: 28,
                        height: 28,
                      }}
                    >
                      <AddIcon sx={{ fontSize: '16px' }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Right Side - Column List */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: '8px',
                p: 2,
                minHeight: '300px',
                border: '1px solid #e5e7eb',
              }}
            >
              {columns.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: '200px',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.text.secondary,
                      textAlign: 'center',
                    }}
                  >
                    Brak dostępnych kolumn
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 2,
                    }}
                  >
                    Dostępne kolumny ({columns.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {columns.map((column) => (
                      <Box
                        key={column.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          bgcolor: '#f8f9fa',
                          borderRadius: '4px',
                          border: '1px solid #e9ecef',
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: '12px', fontWeight: 500 }}>
                            {column.name}
                          </Typography>
                          <Typography sx={{ fontSize: '10px', color: theme.palette.text.secondary }}>
                            {getColumnTypeLabel(column.type)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: 3,
          py: 2,
          borderTop: '1px solid #e5e7eb',
          justifyContent: 'space-between',
        }}
      >
        <Button
          onClick={removeAllColumns}
          variant="outlined"
          disabled={columns.length === 0}
          sx={{
            color: theme.palette.error.main,
            borderColor: theme.palette.error.main,
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '4px',
            textTransform: 'none',
            '&:hover': {
              bgcolor: theme.palette.error.main,
              color: 'white',
            },
            '&:disabled': {
              color: '#a0aec0',
              borderColor: '#a0aec0',
            }
          }}
        >
          Usuń wszystkie
        </Button>

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
          Dodaj warstwę
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLayerModal;