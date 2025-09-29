'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Straighten,
  CropFree,
  Clear,
  Delete,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setMeasurementMode,
  clearAllMeasurements,
  removeMeasurement,
} from '@/store/slices/drawSlice';

const MeasurementTools: React.FC = () => {
  const dispatch = useAppDispatch();
  const { measurement } = useAppSelector((state) => state.draw);

  const handleDistanceMode = () => {
    const newMode = !measurement.isDistanceMode;
    dispatch(setMeasurementMode({
      distance: newMode,
      area: false
    }));
  };

  const handleAreaMode = () => {
    const newMode = !measurement.isAreaMode;
    dispatch(setMeasurementMode({
      distance: false,
      area: newMode
    }));
  };

  const handleClearAll = () => {
    dispatch(clearAllMeasurements());
  };

  const handleRemoveMeasurement = (id: string) => {
    dispatch(removeMeasurement(id));
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ px: 2, py: 1, fontWeight: 600 }}>
        Narzędzia pomiarowe
      </Typography>

      <Box sx={{ px: 2, pb: 2 }}>
        {/* Measurement tools */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Tooltip title="Mierz odległość między punktami" placement="right">
            <Button
              variant={measurement.isDistanceMode ? "contained" : "outlined"}
              startIcon={<Straighten />}
              onClick={handleDistanceMode}
              size="small"
              sx={{
                justifyContent: 'flex-start',
                backgroundColor: measurement.isDistanceMode ? 'primary.main' : 'transparent',
                '&:hover': {
                  backgroundColor: measurement.isDistanceMode ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              Odległość
            </Button>
          </Tooltip>

          <Tooltip title="Mierz powierzchnię obszaru" placement="right">
            <Button
              variant={measurement.isAreaMode ? "contained" : "outlined"}
              startIcon={<CropFree />}
              onClick={handleAreaMode}
              size="small"
              sx={{
                justifyContent: 'flex-start',
                backgroundColor: measurement.isAreaMode ? 'primary.main' : 'transparent',
                '&:hover': {
                  backgroundColor: measurement.isAreaMode ? 'primary.dark' : 'action.hover',
                },
              }}
            >
              Powierzchnia
            </Button>
          </Tooltip>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Instructions */}
        {(measurement.isDistanceMode || measurement.isAreaMode) && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="caption" color="info.contrastText">
              {measurement.isDistanceMode && "Kliknij dwa punkty na mapie, aby zmierzyć odległość"}
              {measurement.isAreaMode && "Kliknij punkty na mapie, aby zmierzyć powierzchnię. Kliknij dwukrotnie, aby zakończyć"}
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          <Tooltip title="Wyczyść wszystkie pomiary" placement="right">
            <span>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClearAll}
                size="small"
                color="error"
                disabled={measurement.measurements.length === 0}
                sx={{ justifyContent: 'flex-start' }}
              >
                Wyczyść wszystkie
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Measurements list */}
        {measurement.measurements.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Wyniki pomiarów
            </Typography>
            <List dense>
              {measurement.measurements.map((m) => (
                <ListItem
                  key={m.id}
                  sx={{
                    px: 0,
                    py: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 0.5
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleRemoveMeasurement(m.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {m.type === 'distance' ? 'Odległość' : 'Powierzchnia'}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {m.label}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Stats */}
        {measurement.measurements.length > 0 && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption">
              Pomiary: {measurement.measurements.length}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MeasurementTools;