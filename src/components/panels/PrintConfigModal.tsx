'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  IconButton,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface Warstwa {
  id: string;
  nazwa: string;
  widoczna?: boolean;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  dzieci?: Warstwa[];
  rozwinięta?: boolean;
}

interface LayerColumn {
  id: string;
  nazwa: string;
}

interface PlanLayer {
  id: string;
  warstwaId: string;
  nazwaWarstwy: string;
  kolumnaPrzeznaczenia: string;
  ustaleniaOgolne?: File | null;
  ustaleniaKoncowe?: File | null;
}

interface PrintConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    nazwaWypisu: string;
    warstwaId: string;
    kolumnaObreb: string;
    kolumnaNumerDzialki: string;
    warstwyPrzeznaczenia: PlanLayer[];
  }) => void;
  projectLayers: Warstwa[];
}

const PrintConfigModal: React.FC<PrintConfigModalProps> = ({
  open,
  onClose,
  onSubmit,
  projectLayers,
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nazwaWypisu: '',
    warstwaId: '',
    kolumnaObreb: 'Wybierz z listy',
    kolumnaNumerDzialki: 'Wybierz z listy',
  });
  const [selectedPlanLayerId, setSelectedPlanLayerId] = useState('Wybierz z listy');
  const [planLayers, setPlanLayers] = useState<PlanLayer[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    kolumnaPrzeznaczenia: 'Wybierz z listy',
    ustaleniaOgolne: null as File | null,
    ustaleniaKoncowe: null as File | null,
  });
  const [selectedPrzeznaczenie, setSelectedPrzeznaczenie] = useState('Wybierz z listy');
  const [przeznaczenia, setPrzeznaczenia] = useState<Array<{ id: string; nazwa: string; dokument: File | null }>>([]);

  // Mock columns (będzie z backendu)
  const mockColumns: LayerColumn[] = [
    { id: 'gid', nazwa: 'gid' },
    { id: 'resolution', nazwa: 'resolution' },
    { id: 'personalData', nazwa: 'personalData' },
    { id: 'eMail', nazwa: 'eMail' },
    { id: 'phoneNumber', nazwa: 'phoneNumber' },
    { id: 'proposal', nazwa: 'proposal' },
    { id: 'consultation_date', nazwa: 'consultation_date' },
    { id: 'validFrom', nazwa: 'validFrom' },
    { id: 'validTo', nazwa: 'validTo' },
    { id: 'specificSupplementaryRegulation', nazwa: 'specificSupplementaryRegulation' },
    { id: 'processStepGeneral', nazwa: 'processStepGeneral' },
    { id: 'backgroundMapDate', nazwa: 'backgroundMapDate' },
    { id: 'backgroundMapReference', nazwa: 'backgroundMapReference' },
    { id: 'backgroundMapURI', nazwa: 'backgroundMapURI' },
    { id: 'beginLifespanVersion', nazwa: 'beginLifespanVersion' },
  ];

  // Mock columns for layer selection dropdown
  const mockLayerColumns: LayerColumn[] = [
    { id: 'zoningelement', nazwa: 'zoningelement' },
    { id: 'suplementaryregulation', nazwa: 'suplementaryregulation' },
    { id: 'spatialplan', nazwa: 'spatialplan' },
    { id: 'officialdocumentation', nazwa: 'officialdocumentation' },
    { id: 'test111', nazwa: 'test111' },
    { id: 'punktowa', nazwa: 'punktowa' },
    { id: 'jhehfsdh', nazwa: 'jhehfsdh' },
    { id: 'test', nazwa: 'test' },
    { id: 'ukyrtiufg', nazwa: 'ukyrtiufg' },
  ];

  // Get all vector layers from project
  const getVectorLayers = (layers: Warstwa[]): Warstwa[] => {
    const vectorLayers: Warstwa[] = [];
    const traverse = (items: Warstwa[]) => {
      items.forEach(item => {
        if (item.typ === 'wektor') {
          vectorLayers.push(item);
        }
        if (item.dzieci) {
          traverse(item.dzieci);
        }
      });
    };
    traverse(layers);
    return vectorLayers;
  };

  const vectorLayers = getVectorLayers(projectLayers);

  const handleAddPlanLayer = () => {
    if (selectedPlanLayerId !== 'Wybierz z listy') {
      const layer = mockLayerColumns.find(l => l.id === selectedPlanLayerId);
      if (layer && !planLayers.find(pl => pl.warstwaId === layer.id)) {
        const newPlanLayer: PlanLayer = {
          id: `plan-${Date.now()}`,
          warstwaId: layer.id,
          nazwaWarstwy: layer.nazwa,
          kolumnaPrzeznaczenia: 'Wybierz z listy',
          ustaleniaOgolne: null,
          ustaleniaKoncowe: null,
        };
        setPlanLayers([...planLayers, newPlanLayer]);
        setSelectedPlanLayerId('Wybierz z listy');
      }
    }
  };

  const handleDeletePlanLayer = (layerId: string) => {
    setPlanLayers(planLayers.filter(l => l.id !== layerId));
  };

  const handleEditPlanLayer = (layerId: string) => {
    const layer = planLayers.find(l => l.id === layerId);
    if (layer) {
      setEditingLayerId(layerId);
      setEditFormData({
        kolumnaPrzeznaczenia: layer.kolumnaPrzeznaczenia,
        ustaleniaOgolne: layer.ustaleniaOgolne || null,
        ustaleniaKoncowe: layer.ustaleniaKoncowe || null,
      });
      setPrzeznaczenia([]);
      setSelectedPrzeznaczenie('Wybierz z listy');
      setEditModalOpen(true);
    }
  };

  const handleAddPrzeznaczenie = () => {
    if (selectedPrzeznaczenie !== 'Wybierz z listy') {
      const column = mockColumns.find(c => c.id === selectedPrzeznaczenie);
      if (column && !przeznaczenia.find(p => p.id === column.id)) {
        setPrzeznaczenia([...przeznaczenia, {
          id: column.id,
          nazwa: column.nazwa,
          dokument: null,
        }]);
        setSelectedPrzeznaczenie('Wybierz z listy');
      }
    }
  };

  const handleDeletePrzeznaczenie = (id: string) => {
    setPrzeznaczenia(przeznaczenia.filter(p => p.id !== id));
  };

  const handlePrzeznaczenieDocumentChange = (id: string, file: File | null) => {
    setPrzeznaczenia(przeznaczenia.map(p =>
      p.id === id ? { ...p, dokument: file } : p
    ));
  };

  const handleEditSubmit = () => {
    if (editingLayerId) {
      setPlanLayers(planLayers.map(layer => {
        if (layer.id === editingLayerId) {
          return {
            ...layer,
            kolumnaPrzeznaczenia: editFormData.kolumnaPrzeznaczenia,
            ustaleniaOgolne: editFormData.ustaleniaOgolne,
            ustaleniaKoncowe: editFormData.ustaleniaKoncowe,
          };
        }
        return layer;
      }));
      setEditModalOpen(false);
      setEditingLayerId(null);
      setPrzeznaczenia([]);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      nazwaWypisu: formData.nazwaWypisu,
      warstwaId: formData.warstwaId,
      kolumnaObreb: formData.kolumnaObreb,
      kolumnaNumerDzialki: formData.kolumnaNumerDzialki,
      warstwyPrzeznaczenia: planLayers,
    });
    // Reset form
    setFormData({
      nazwaWypisu: '',
      warstwaId: '',
      kolumnaObreb: 'Wybierz z listy',
      kolumnaNumerDzialki: 'Wybierz z listy',
    });
    setPlanLayers([]);
  };

  const handleFileChange = (field: 'ustaleniaOgolne' | 'ustaleniaKoncowe', file: File | null) => {
    setEditFormData(prev => ({ ...prev, [field]: file }));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            maxWidth: '550px',
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
            py: 1.5,
            px: 2,
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          Konfiguracja wypisu
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ bgcolor: '#f7f9fc', p: 3 }}>
          {/* Nazwa wypisu */}
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#e53e3e',
                mb: 1,
              }}
            >
              Nazwa wypisu
            </Typography>
            <TextField
              fullWidth
              value={formData.nazwaWypisu}
              onChange={(e) => setFormData(prev => ({ ...prev, nazwaWypisu: e.target.value }))}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: '#d1d5db',
                  },
                },
              }}
            />
          </Box>

          {/* Wybierz warstwę działek */}
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#e53e3e',
                mb: 1,
              }}
            >
              Wybierz warstwę działek:
            </Typography>
            <TextField
              fullWidth
              select
              value={formData.warstwaId}
              onChange={(e) => setFormData(prev => ({ ...prev, warstwaId: e.target.value }))}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: '#d1d5db',
                  },
                },
              }}
            >
              <MenuItem value="">Wybierz z listy</MenuItem>
              {mockLayerColumns.map(col => (
                <MenuItem key={col.id} value={col.id}>
                  {col.nazwa}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Kolumna obręb */}
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#3182ce',
                mb: 1,
              }}
            >
              Kolumna obręb:
            </Typography>
            <TextField
              fullWidth
              select
              value={formData.kolumnaObreb}
              onChange={(e) => setFormData(prev => ({ ...prev, kolumnaObreb: e.target.value }))}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: '#d1d5db',
                  },
                },
              }}
            >
              <MenuItem value="Wybierz z listy">Wybierz z listy</MenuItem>
              {mockColumns.map(col => (
                <MenuItem key={col.id} value={col.id}>
                  {col.nazwa}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Kolumna numer działki */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#3182ce',
                mb: 1,
              }}
            >
              Kolumna numer działki:
            </Typography>
            <TextField
              fullWidth
              select
              value={formData.kolumnaNumerDzialki}
              onChange={(e) => setFormData(prev => ({ ...prev, kolumnaNumerDzialki: e.target.value }))}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: '#d1d5db',
                  },
                },
              }}
            >
              <MenuItem value="Wybierz z listy">Wybierz z listy</MenuItem>
              {mockColumns.map(col => (
                <MenuItem key={col.id} value={col.id}>
                  {col.nazwa}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Dodaj warstwy przeznaczenia planu */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#3182ce',
                  flex: 1,
                }}
              >
                Dodaj warstwy przeznaczenia planu
              </Typography>
              <IconButton
                onClick={handleAddPlanLayer}
                size="small"
                sx={{
                  bgcolor: '#4a5568',
                  color: 'white',
                  width: 24,
                  height: 24,
                  '&:hover': { bgcolor: '#2d3748' },
                }}
              >
                <AddIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <TextField
                select
                value={selectedPlanLayerId}
                onChange={(e) => setSelectedPlanLayerId(e.target.value)}
                size="small"
                sx={{
                  width: 200,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    borderRadius: '4px',
                    '& fieldset': {
                      borderColor: '#d1d5db',
                    },
                  },
                }}
              >
                <MenuItem value="Wybierz z listy">Wybierz z listy</MenuItem>
                {mockLayerColumns.map(col => (
                  <MenuItem key={col.id} value={col.id}>
                    {col.nazwa}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Lista dodanych warstw */}
            {planLayers.map(layer => (
              <Box
                key={layer.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1,
                  pl: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    color: '#3182ce',
                    flex: 1,
                    textDecoration: 'underline',
                  }}
                >
                  {layer.nazwaWarstwy}
                </Typography>
                <IconButton
                  onClick={() => handleEditPlanLayer(layer.id)}
                  size="small"
                  sx={{ color: '#4a5568' }}
                >
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  onClick={() => handleDeletePlanLayer(layer.id)}
                  size="small"
                  sx={{ color: '#e53e3e' }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            ))}

            {/* Brak dodanych warstw - pokazuj tylko gdy lista pusta */}
            {planLayers.length === 0 && (
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#e53e3e',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  pl: 1,
                  mt: 1,
                }}
              >
                Brak dodanych warstw
              </Typography>
            )}
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Box
              onClick={onClose}
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                py: 1,
                px: 4,
                borderRadius: '4px',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                flex: 1,
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Powrót
            </Box>
            <Box
              onClick={handleSubmit}
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                py: 1,
                px: 4,
                borderRadius: '4px',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                flex: 1,
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Zapisz
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Layer Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            maxWidth: '550px',
            width: '90%',
          }
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: '#4a5568',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
            px: 2,
            fontSize: '16px',
            fontWeight: 500,
          }}
        >
          Edytuj warstwę planu
          <IconButton
            onClick={() => setEditModalOpen(false)}
            size="small"
            sx={{
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ bgcolor: '#f7f9fc', p: 3 }}>
          {/* Ustalenia ogólne */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                flex: 1,
              }}
            >
              Ustalenia ogólne
            </Typography>
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
              }}
            >
              {editFormData.ustaleniaOgolne ? editFormData.ustaleniaOgolne.name : 'Brak dokumentu'}
            </Typography>
            <Box
              component="label"
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                py: 0.5,
                px: 2,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Załącz dokument
              <input
                type="file"
                hidden
                onChange={(e) => handleFileChange('ustaleniaOgolne', e.target.files?.[0] || null)}
              />
            </Box>
          </Box>

          {/* Ustalenia końcowe */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                flex: 1,
              }}
            >
              Ustalenia końcowe
            </Typography>
            <Typography
              sx={{
                fontSize: '13px',
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
              }}
            >
              {editFormData.ustaleniaKoncowe ? editFormData.ustaleniaKoncowe.name : 'Brak dokumentu'}
            </Typography>
            <Box
              component="label"
              sx={{
                bgcolor: '#4a5568',
                color: 'white',
                py: 0.5,
                px: 2,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#2d3748',
                },
              }}
            >
              Załącz dokument
              <input
                type="file"
                hidden
                onChange={(e) => handleFileChange('ustaleniaKoncowe', e.target.files?.[0] || null)}
              />
            </Box>
          </Box>

          {/* Wybierz kolumnę przeznaczenia */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              Wybierz kolumnę przeznaczenia:
            </Typography>
            <TextField
              fullWidth
              select
              value={editFormData.kolumnaPrzeznaczenia}
              onChange={(e) => setEditFormData(prev => ({ ...prev, kolumnaPrzeznaczenia: e.target.value }))}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  borderRadius: '4px',
                  '& fieldset': {
                    borderColor: '#d1d5db',
                  },
                },
              }}
            >
              <MenuItem value="Wybierz z listy">Wybierz z listy</MenuItem>
              {mockColumns.map(col => (
                <MenuItem key={col.id} value={col.id}>
                  {col.nazwa}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Dodaj przeznaczenie - pokazuje się tylko gdy kolumna jest wybrana */}
          {editFormData.kolumnaPrzeznaczenia !== 'Wybierz z listy' && (
            <Box sx={{ mb: 3, bgcolor: '#e8eaf6', p: 2, borderRadius: '4px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#3182ce',
                    flex: 1,
                  }}
                >
                  Dodaj przeznaczenie:
                </Typography>
                <IconButton
                  onClick={handleAddPrzeznaczenie}
                  size="small"
                  sx={{
                    bgcolor: '#4a5568',
                    color: 'white',
                    width: 24,
                    height: 24,
                    '&:hover': { bgcolor: '#2d3748' },
                  }}
                >
                  <AddIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <TextField
                  select
                  value={selectedPrzeznaczenie}
                  onChange={(e) => setSelectedPrzeznaczenie(e.target.value)}
                  size="small"
                  sx={{
                    width: 200,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      borderRadius: '4px',
                      '& fieldset': {
                        borderColor: '#d1d5db',
                      },
                    },
                  }}
                >
                  <MenuItem value="Wybierz z listy">Wybierz z listy</MenuItem>
                  {mockColumns.map(col => (
                    <MenuItem key={col.id} value={col.id}>
                      {col.nazwa}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Lista dodanych przeznczeń */}
              {przeznaczenia.map(prz => (
                <Box
                  key={prz.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.text.primary,
                      flex: 1,
                    }}
                  >
                    {prz.nazwa}
                  </Typography>
                  <IconButton
                    onClick={() => handleDeletePrzeznaczenie(prz.id)}
                    size="small"
                    sx={{ color: '#e53e3e' }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <Box
                    component="label"
                    sx={{
                      bgcolor: '#4a5568',
                      color: 'white',
                      py: 0.5,
                      px: 2,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      '&:hover': {
                        bgcolor: '#2d3748',
                      },
                    }}
                  >
                    Załącz dokument
                    <input
                      type="file"
                      hidden
                      onChange={(e) => handlePrzeznaczenieDocumentChange(prz.id, e.target.files?.[0] || null)}
                    />
                  </Box>
                </Box>
              ))}

              {/* Brak wyników */}
              {przeznaczenia.length === 0 && (
                <Box
                  sx={{
                    bgcolor: '#4a5568',
                    color: 'white',
                    py: 1,
                    px: 2,
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '13px',
                  }}
                >
                  Brak wyników
                </Box>
              )}
            </Box>
          )}

          {/* Zapisz Button */}
          <Box
            onClick={handleEditSubmit}
            sx={{
              bgcolor: '#4a5568',
              color: 'white',
              py: 1,
              px: 4,
              borderRadius: '4px',
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              '&:hover': {
                bgcolor: '#2d3748',
              },
            }}
          >
            Zapisz
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrintConfigModal;
