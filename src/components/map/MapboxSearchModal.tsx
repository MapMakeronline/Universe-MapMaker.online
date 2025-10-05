'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { useMap } from 'react-map-gl';
import { useAppDispatch } from '@/store/hooks';
import { flyToLocation } from '@/store/slices/mapSlice';
import { useTheme } from '@mui/material/styles';

interface MapboxSearchModalProps {
  open: boolean;
  onClose: () => void;
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
      id={`search-tabpanel-${index}`}
      aria-labelledby={`search-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MapboxSearchModal: React.FC<MapboxSearchModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { current: map } = useMap();
  const dispatch = useAppDispatch();

  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setResults([]);
    setError(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // This would call MCP Mapbox search-and-geocode tool
      // For now, we'll add a placeholder message
      setError('Funkcja wyszukiwania MCP Mapbox będzie dostępna wkrótce!');
      setResults([]);
    } catch (err) {
      setError('Błąd podczas wyszukiwania');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySearch = async () => {
    if (!categoryQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // This would call MCP Mapbox category-search tool
      // For now, we'll add a placeholder message
      setError('Funkcja wyszukiwania kategorii MCP Mapbox będzie dostępna wkrótce!');
      setResults([]);
    } catch (err) {
      setError('Błąd podczas wyszukiwania kategorii');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setCategoryQuery('');
    setResults([]);
    setError(null);
    setTabValue(0);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SearchIcon sx={{ fontSize: '20px' }} />
          Wyszukiwanie Mapbox
        </Box>
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            px: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 48,
            }
          }}
        >
          <Tab
            icon={<SearchIcon />}
            iconPosition="start"
            label="Wyszukiwanie"
          />
          <Tab
            icon={<CategoryIcon />}
            iconPosition="start"
            label="Kategorie"
          />
          <Tab
            icon={<MyLocationIcon />}
            iconPosition="start"
            label="Geokodowanie"
          />
        </Tabs>
      </Box>

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: '#f7f9fc',
          px: 0,
          py: 0,
          minHeight: '300px',
        }}
      >
        {/* Search Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.text.primary }}>
              Wyszukaj miejsca, adresy, POI
            </Typography>

            <Box
              component="input"
              type="text"
              placeholder="Wpisz nazwę miejsca, ulicę, adres..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
              sx={{
                width: '100%',
                p: '12px 16px',
                borderRadius: '4px',
                border: `1px solid #d1d5db`,
                bgcolor: 'white',
                fontSize: '14px',
                color: theme.palette.text.primary,
                fontFamily: 'inherit',
                '&::placeholder': {
                  color: theme.palette.text.disabled,
                },
                '&:focus': {
                  outline: 'none',
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 3px ${theme.palette.primary.main}22`,
                },
              }}
            />

            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              fullWidth
              sx={{
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Szukaj'}
            </Button>

            {error && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Category Search Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.text.primary }}>
              Wyszukaj według kategorii (restauracje, hotele, muzea...)
            </Typography>

            <Box
              component="input"
              type="text"
              placeholder="np. restauracja, muzeum, hotel..."
              value={categoryQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategoryQuery(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleCategorySearch()}
              sx={{
                width: '100%',
                p: '12px 16px',
                borderRadius: '4px',
                border: `1px solid #d1d5db`,
                bgcolor: 'white',
                fontSize: '14px',
                color: theme.palette.text.primary,
                fontFamily: 'inherit',
                '&::placeholder': {
                  color: theme.palette.text.disabled,
                },
                '&:focus': {
                  outline: 'none',
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 3px ${theme.palette.primary.main}22`,
                },
              }}
            />

            <Button
              variant="contained"
              onClick={handleCategorySearch}
              disabled={loading || !categoryQuery.trim()}
              fullWidth
              sx={{
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Szukaj kategorii'}
            </Button>

            {error && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Reverse Geocoding Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.text.primary }}>
              Geokodowanie odwrotne - znajdź adres dla współrzędnych
            </Typography>

            <Alert severity="info">
              Funkcja geokodowania odwrotnego MCP Mapbox będzie dostępna wkrótce!
            </Alert>
          </Box>
        </TabPanel>
      </DialogContent>

      {/* Footer */}
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
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderColor: '#d1d5db',
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.text.primary,
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Zamknij
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MapboxSearchModal;
