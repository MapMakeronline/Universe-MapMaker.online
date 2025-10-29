'use client';

import React, { useState, useEffect, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CloseIcon from '@mui/icons-material/Close';
import LocationIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import { MapRef } from 'react-map-gl';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { flyToLocation } from '@/redux/slices/mapSlice';
import { searchPlaces, type SearchResult as MapboxSearchResult } from '@/mapbox/search';
import { useTheme } from '@mui/material/styles';
import { useSearchParams } from 'next/navigation';
import ParcelSearchTab from './ParcelSearchTab';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  mapRef: React.RefObject<MapRef>;
}

// Using SearchResult from lib/mapbox/search
type SearchResult = MapboxSearchResult;

type TabValue = 'global' | 'parcels';

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, mapRef }) => {
  const theme = useTheme();
  // ✅ Use mapRef.current instead of useMap() hook (SearchModal is rendered outside <Map> component)
  const map = mapRef.current?.getMap();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  // Get project name from URL (works for both authenticated and guest users)
  const projectNameFromURL = searchParams.get('project');

  // Fallback to Redux state for authenticated users (if URL param missing)
  const { currentProject } = useAppSelector((state) => state.projects);
  const projectName = projectNameFromURL || currentProject?.project_name || null;

  // Tab state - DEFAULT: 'parcels' (Działki)
  const [activeTab, setActiveTab] = useState<TabValue>('parcels');

  // Mapbox search state (global tab)
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Get current map center for proximity bias
        const center = map?.getCenter();
        const proximity: [number, number] = center
          ? [center.lng, center.lat]
          : [21.0122, 52.2297]; // Warsaw default

        const features = await searchPlaces(searchQuery, {
          proximity,
          country: ['pl'],
          language: 'pl',
          limit: 5,
        });

        setResults(features);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    const [lng, lat] = result.center;

    dispatch(flyToLocation({
      longitude: lng,
      latitude: lat,
      zoom: 16,
    }));

    onClose();
    setSearchQuery('');
    setResults([]);
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setResults([]);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      keepMounted  // Keep children mounted when closed (important for ParcelSearchTab IdentifyModal)
      PaperProps={{
        sx: {
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          maxWidth: '600px',
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
          Wyszukiwanie
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
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue as TabValue)}
          variant="fullWidth"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '13px',
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          <Tab
            value="parcels"
            label="Działki"
            icon={<MapIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
          />
          <Tab
            value="global"
            label="Wyszukiwanie globalne"
            icon={<PublicIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
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
        {/* Tab 1: Działki (Backend Layer Search) */}
        {activeTab === 'parcels' && (
          <ParcelSearchTab projectName={projectName} mapRef={mapRef} onClose={handleClose} />
        )}

        {/* Tab 2: Wyszukiwanie globalne (Mapbox Geocoding) */}
        {activeTab === 'global' && (
          <>
            {/* Description */}
            <Box
              sx={{
                p: 2,
                bgcolor: '#e3f2fd',
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                <strong>Wyszukiwarka Mapbox</strong> - możesz używać nazw gmin, miejscowości, ulic oraz adresów do wyszukiwania lokalizacji na mapie.
              </Typography>
            </Box>

            {/* Search Input */}
            <Box
              sx={{
                p: 3,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: 'white',
              }}
            >
              <Box
                component="input"
                type="text"
                placeholder="Wpisz nazwę miejsca, ulicę, adres..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                autoFocus
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
            </Box>

            {/* Results */}
            <Box sx={{ minHeight: '200px', position: 'relative' }}>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              )}

              {!loading && searchQuery && results.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
                  <LocationIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Nie znaleziono wyników dla &quot;{searchQuery}&quot;
                  </Typography>
                </Box>
              )}

              {!loading && results.length > 0 && (
                <List sx={{ py: 0 }}>
                  {results.map((result) => (
                    <ListItem key={result.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleResultClick(result)}
                        sx={{
                          px: 3,
                          py: 1.5,
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                          },
                        }}
                      >
                        <LocationIcon
                          sx={{
                            fontSize: '20px',
                            color: theme.palette.primary.main,
                            mr: 2
                          }}
                        />
                        <ListItemText
                          primary={result.text}
                          secondary={result.place_name}
                          primaryTypographyProps={{
                            fontSize: '14px',
                            fontWeight: 500,
                          }}
                          secondaryTypographyProps={{
                            fontSize: '12px',
                            color: 'text.secondary',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}

              {!loading && !searchQuery && (
                <Box sx={{ textAlign: 'center', py: 4, px: 3 }}>
                  <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Zacznij wpisywać, aby wyszukać miejsce
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
