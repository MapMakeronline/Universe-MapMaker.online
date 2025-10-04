'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useMap } from 'react-map-gl';
import { useAppDispatch } from '@/store/hooks';
import { flyToLocation } from '@/store/slices/mapSlice';
import { MAPBOX_TOKEN } from '@/lib/mapbox/config';
import { useTheme } from '@mui/material/styles';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
  text: string;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { current: map } = useMap();
  const dispatch = useAppDispatch();
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
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
          `access_token=${MAPBOX_TOKEN}&` +
          `proximity=21.0122,52.2297&` +
          `country=pl&` +
          `language=pl&` +
          `limit=5`
        );

        const data = await response.json();
        setResults(data.features || []);
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
    dispatch(flyToLocation({
      longitude: result.center[0],
      latitude: result.center[1],
      zoom: 14,
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
          Wyszukiwanie miejsca
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

      {/* Content */}
      <DialogContent
        sx={{
          bgcolor: '#f7f9fc',
          px: 0,
          py: 0,
          minHeight: '300px',
        }}
      >
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
                Nie znaleziono wyników dla "{searchQuery}"
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
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
