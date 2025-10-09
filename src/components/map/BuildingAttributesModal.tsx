/**
 * @deprecated This component is deprecated. Use FeatureAttributesModal instead.
 *
 * **Migration:** Replace usage with FeatureAttributesModal which supports ALL feature types,
 * not just buildings. FeatureAttributesModal handles buildings, POI, points, lines, polygons, etc.
 *
 * **This component only handles 3D buildings** and uses the deprecated buildingsSlice.
 *
 * @see src/components/map/FeatureAttributesModal.tsx
 * @see src/store/slices/featuresSlice.ts
 */
'use client';


import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { useTheme } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setAttributeModalOpen,
  updateBuilding,
  addBuildingAttribute,
  deleteBuildingAttribute,
  updateBuildingAttribute,
} from '@/store/slices/buildingsSlice';
import type { BuildingAttribute } from '@/store/slices/buildingsSlice';

const BuildingAttributesModal = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAttributeModalOpen, selectedBuildingId, buildings } = useAppSelector(
    (state) => state.buildings
  );

  const [editingName, setEditingName] = useState(false);
  const [buildingName, setBuildingName] = useState('');
  const [editingAttr, setEditingAttr] = useState<string | null>(null);
  const [editAttrValue, setEditAttrValue] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  const selectedBuilding = selectedBuildingId ? buildings[selectedBuildingId] : null;

  const handleClose = () => {
    dispatch(setAttributeModalOpen(false));
    setEditingName(false);
    setEditingAttr(null);
    setNewAttrKey('');
    setNewAttrValue('');
  };

  const handleSaveName = () => {
    if (selectedBuildingId && buildingName.trim()) {
      dispatch(updateBuilding({
        id: selectedBuildingId,
        updates: { name: buildingName.trim() }
      }));
      setEditingName(false);
    }
  };

  const handleStartEditName = () => {
    setBuildingName(selectedBuilding?.name || '');
    setEditingName(true);
  };

  const handleStartEditAttr = (key: string, value: string | number) => {
    setEditingAttr(key);
    setEditAttrValue(value.toString());
  };

  const handleSaveAttr = (key: string) => {
    if (selectedBuildingId && editAttrValue.trim()) {
      dispatch(updateBuildingAttribute({
        buildingId: selectedBuildingId,
        attributeKey: key,
        value: editAttrValue.trim()
      }));
      setEditingAttr(null);
      setEditAttrValue('');
    }
  };

  const handleDeleteAttr = (key: string) => {
    if (selectedBuildingId) {
      dispatch(deleteBuildingAttribute({
        buildingId: selectedBuildingId,
        attributeKey: key
      }));
    }
  };

  const handleAddAttribute = () => {
    if (selectedBuildingId && newAttrKey.trim() && newAttrValue.trim()) {
      dispatch(addBuildingAttribute({
        buildingId: selectedBuildingId,
        attribute: { key: newAttrKey.trim(), value: newAttrValue.trim() }
      }));
      setNewAttrKey('');
      setNewAttrValue('');
    }
  };

  if (!selectedBuilding) {
    return null;
  }

  return (
    <Dialog
      open={isAttributeModalOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: isMobile ? '100%' : '800px',
          width: isMobile ? '100%' : '90%',
          m: isMobile ? 0 : 2,
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
        Atrybuty budynku 3D
        <IconButton
          onClick={handleClose}
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
          px: isMobile ? 2 : 3,
          py: isMobile ? 2 : 3,
        }}
      >
        {/* Building Name */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            Nazwa budynku
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {editingName ? (
              <>
                <TextField
                  fullWidth
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="Wprowadź nazwę budynku"
                  size="small"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveName();
                    }
                  }}
                />
                <IconButton
                  onClick={handleSaveName}
                  color="primary"
                  size="small"
                >
                  <SaveIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Typography sx={{ flex: 1, fontSize: '16px', fontWeight: 600 }}>
                  {selectedBuilding.name}
                </Typography>
                <IconButton
                  onClick={handleStartEditName}
                  color="primary"
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              </>
            )}
          </Box>
        </Box>

        {/* Coordinates */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 500,
              color: theme.palette.text.primary,
              mb: 1,
            }}
          >
            Współrzędne
          </Typography>
          <Typography sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
            {selectedBuilding.coordinates[1].toFixed(6)}, {selectedBuilding.coordinates[0].toFixed(6)}
          </Typography>
        </Box>

        {/* Attributes Table */}
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 500,
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          Tabela atrybutów
        </Typography>

        <TableContainer
          component={Paper}
          sx={{
            mb: 2,
            maxHeight: isMobile ? '50vh' : '400px',
            borderRadius: '4px',
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: isMobile ? '100%' : 650
            }
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#e5e7eb' }}>Atrybut</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#e5e7eb' }}>Wartość</TableCell>
                <TableCell sx={{ fontWeight: 600, bgcolor: '#e5e7eb', width: 100 }}>Akcje</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedBuilding.attributes.map((attr) => (
                <TableRow key={attr.key} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{attr.key}</TableCell>
                  <TableCell>
                    {editingAttr === attr.key ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          value={editAttrValue}
                          onChange={(e) => setEditAttrValue(e.target.value)}
                          size="small"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveAttr(attr.key);
                            }
                          }}
                        />
                        <IconButton
                          onClick={() => handleSaveAttr(attr.key)}
                          color="primary"
                          size="small"
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      attr.value
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edytuj">
                        <IconButton
                          onClick={() => handleStartEditAttr(attr.key, attr.value)}
                          size="small"
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Usuń">
                        <IconButton
                          onClick={() => handleDeleteAttr(attr.key)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              {/* Add new attribute row */}
              <TableRow>
                <TableCell>
                  <TextField
                    fullWidth
                    value={newAttrKey}
                    onChange={(e) => setNewAttrKey(e.target.value)}
                    placeholder="Nowy atrybut"
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={newAttrValue}
                    onChange={(e) => setNewAttrValue(e.target.value)}
                    placeholder="Wartość"
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddAttribute();
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Dodaj atrybut">
                    <IconButton
                      onClick={handleAddAttribute}
                      color="primary"
                      size="small"
                      disabled={!newAttrKey.trim() || !newAttrValue.trim()}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: '#f7f9fc',
          px: isMobile ? 2 : 3,
          pb: isMobile ? 2 : 3,
          pt: 0,
          gap: 2,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={handleClose}
          variant="contained"
          fullWidth={isMobile}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark },
          }}
        >
          Zamknij
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BuildingAttributesModal;
