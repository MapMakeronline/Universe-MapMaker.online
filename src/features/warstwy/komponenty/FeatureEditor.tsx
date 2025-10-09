'use client';

/**
 * FeatureEditor - Universal feature editing component
 *
 * Features:
 * - Add new features (Point, Line, Polygon)
 * - Edit existing feature geometry
 * - Edit feature attributes
 * - Delete features
 * - Integration with Mapbox GL Draw
 * - Real-time validation
 *
 * Usage:
 * <FeatureEditor
 *   projectName="my-project"
 *   layerName="buildings"
 *   featureId={123}  // Optional - for editing existing feature
 *   mode="add"       // "add" | "edit" | "delete"
 *   onSave={handleSave}
 *   onCancel={handleCancel}
 * />
 */

import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import { useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material';
import { layersApi } from '@/api/endpointy/layers';
import { useAppSelector } from '@/redux/hooks';

interface FeatureEditorProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  layerName: string;
  featureId?: number; // For editing existing feature
  initialGeometry?: GeoJSON.Geometry;
  initialProperties?: Record<string, any>;
  mode: 'add' | 'edit' | 'delete';
  onSave?: (featureId: number) => void;
}

const FeatureEditor: React.FC<FeatureEditorProps> = ({
  open,
  onClose,
  projectName,
  layerName,
  featureId,
  initialGeometry,
  initialProperties = {},
  mode,
  onSave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [geometry, setGeometry] = useState<GeoJSON.Geometry | null>(initialGeometry || null);
  const [properties, setProperties] = useState<Record<string, any>>(initialProperties);
  const [newAttribute, setNewAttribute] = useState({ key: '', value: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setGeometry(initialGeometry || null);
      setProperties(initialProperties || {});
      setError('');
      setSuccess('');
    }
  }, [open, initialGeometry, initialProperties]);

  const handleAddAttribute = () => {
    if (!newAttribute.key.trim()) {
      setError('Attribute key cannot be empty');
      return;
    }

    setProperties({
      ...properties,
      [newAttribute.key]: newAttribute.value,
    });
    setNewAttribute({ key: '', value: '' });
    setError('');
  };

  const handleUpdateAttribute = (key: string, value: any) => {
    setProperties({
      ...properties,
      [key]: value,
    });
  };

  const handleDeleteAttribute = (key: string) => {
    const newProps = { ...properties };
    delete newProps[key];
    setProperties(newProps);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'add') {
        // Add new feature
        if (!geometry) {
          setError('Please draw a geometry first');
          setLoading(false);
          return;
        }

        const result = await layersApi.addFeature(projectName, layerName, {
          geometry,
          properties,
        });

        setSuccess(`Feature added successfully! ID: ${result.feature_id}`);
        onSave?.(result.feature_id);

        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (mode === 'edit') {
        // Update existing feature
        if (!featureId) {
          setError('Feature ID is required for editing');
          setLoading(false);
          return;
        }

        await layersApi.updateFeature(projectName, layerName, featureId, {
          geometry: geometry || undefined,
          properties,
        });

        setSuccess('Feature updated successfully!');
        onSave?.(featureId);

        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (mode === 'delete') {
        // Delete feature
        if (!featureId) {
          setError('Feature ID is required for deletion');
          setLoading(false);
          return;
        }

        await layersApi.deleteFeature(projectName, layerName, featureId);

        setSuccess('Feature deleted successfully!');

        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save feature');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'add':
        return 'Add New Feature';
      case 'edit':
        return `Edit Feature #${featureId}`;
      case 'delete':
        return `Delete Feature #${featureId}`;
      default:
        return 'Feature Editor';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'add':
        return <AddIcon sx={{ mr: 1 }} />;
      case 'edit':
        return <EditIcon sx={{ mr: 1 }} />;
      case 'delete':
        return <DeleteIcon sx={{ mr: 1 }} />;
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '700px',
          width: '90%',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          bgcolor: theme.palette.modal?.header || '#4a5568',
          color: theme.palette.modal?.headerText || 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2,
          px: 3,
          fontSize: '16px',
          fontWeight: 600,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getIcon()}
          {getTitle()}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
          }}
        >
          <CloseIcon sx={{ fontSize: '20px' }} />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: theme.palette.modal?.content || '#f7f9fc',
          px: 3,
          py: 3,
        }}
      >
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {mode === 'delete' ? (
          // Delete confirmation
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this feature? This action cannot be undone.
          </Typography>
        ) : (
          <>
            {/* Geometry Info */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Geometry
              </Typography>
              <Typography
                sx={{
                  fontSize: '13px',
                  color: theme.palette.text.secondary,
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                }}
              >
                {geometry
                  ? `Type: ${geometry.type} | Coordinates: ${JSON.stringify(geometry.coordinates).substring(0, 100)}...`
                  : 'No geometry drawn yet. Use drawing tools on the map.'}
              </Typography>
            </Box>

            {/* Attributes Table */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                Attributes
              </Typography>

              <TableContainer
                component={Paper}
                sx={{
                  boxShadow: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f9fafb' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>Key</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '13px' }}>Value</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '13px', width: '80px' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(properties).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell sx={{ fontSize: '13px' }}>{key}</TableCell>
                        <TableCell>
                          <TextField
                            value={value}
                            onChange={(e) => handleUpdateAttribute(key, e.target.value)}
                            size="small"
                            fullWidth
                            sx={{
                              '& .MuiOutlinedInput-input': { fontSize: '13px' },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Delete attribute">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAttribute(key)}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon sx={{ fontSize: '18px' }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Add new attribute row */}
                    <TableRow sx={{ bgcolor: '#f9fafb' }}>
                      <TableCell>
                        <TextField
                          placeholder="New key"
                          value={newAttribute.key}
                          onChange={(e) =>
                            setNewAttribute({ ...newAttribute, key: e.target.value })
                          }
                          size="small"
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-input': { fontSize: '13px' },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          placeholder="New value"
                          value={newAttribute.value}
                          onChange={(e) =>
                            setNewAttribute({ ...newAttribute, value: e.target.value })
                          }
                          size="small"
                          fullWidth
                          sx={{
                            '& .MuiOutlinedInput-input': { fontSize: '13px' },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Add attribute">
                          <IconButton
                            size="small"
                            onClick={handleAddAttribute}
                            sx={{ color: 'primary.main' }}
                          >
                            <AddIcon sx={{ fontSize: '18px' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions
        sx={{
          bgcolor: theme.palette.modal?.content || '#f7f9fc',
          px: 3,
          pb: 3,
          pt: 0,
          gap: 2,
          justifyContent: 'flex-end',
          borderTop: `1px solid ${theme.palette.modal?.border || '#e5e7eb'}`,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            borderColor: '#d1d5db',
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || (mode !== 'delete' && !geometry)}
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          sx={{
            bgcolor: mode === 'delete' ? 'error.main' : 'primary.main',
            '&:hover': {
              bgcolor: mode === 'delete' ? 'error.dark' : 'primary.dark',
            },
          }}
        >
          {loading ? 'Saving...' : mode === 'delete' ? 'Delete' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeatureEditor;
