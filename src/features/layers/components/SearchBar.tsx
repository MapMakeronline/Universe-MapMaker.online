/**
 * KOMPONENT SEARCH BAR - PASEK WYSZUKIWANIA I FILTROWANIA
 *
 * Odpowiada za:
 * - Wyszukiwanie warstw po nazwie (live search)
 * - Filtrowanie warstw według typu (grupa, wektor, raster, WMS)
 * - Menu filtrów z checkboxami dla różnych typów
 * - Czyszczenie filtrów i wyszukiwania
 * - Podświetlanie aktywnych filtrów
 * - Responsywny design (kompaktowy widok na małych ekranach)
 */
'use client';

import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

type FilterType = 'wszystko' | 'wektor' | 'raster' | 'wms';

interface SearchBarProps {
  searchFilter: string;
  onSearchChange: (filter: string) => void;
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  filterMenuOpen: boolean;
  onFilterMenuToggle: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

// Obiekt konfiguracji dla wielkości i stylów paska wyszukiwania
const SEARCHBAR_CONFIG = {
  // Ustawienia kontenera
  container: {
    marginBottom: -1,
    gap: 1
  },

  // Ustawienia przycisków
  button: {
    size: 'small' as const,
    padding: 0.75,
    borderRadius: '4px'
  },

  // Ustawienia pola wejściowego
  input: {
    padding: '8px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  },

  // Ustawienia menu rozwijanego
  dropdown: {
    marginTop: 0.5,
    borderRadius: '8px',
    minWidth: 140,
    paddingVertical: 0.5,
    itemPadding: {
      horizontal: 2,
      vertical: 0.3
    },
    fontSize: '13px',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
  },

  // Ustawienia ikon
  icon: {
    fontSize: '16px'
  }
} as const;

// Funkcja pomocnicza dla przycisków akcji
const ActionButton: React.FC<{
  title: string;
  onClick: () => void;
  icon: React.ReactElement;
}> = ({ title, onClick, icon }) => {
  const theme = useTheme();

  return (
    <Tooltip title={title} arrow>
      <IconButton
        size={SEARCHBAR_CONFIG.button.size}
        onClick={onClick}
        sx={{
          color: theme.palette.text.secondary,
          bgcolor: theme.palette.action.hover,
          borderRadius: SEARCHBAR_CONFIG.button.borderRadius,
          p: SEARCHBAR_CONFIG.button.padding,
          '&:hover': {
            color: theme.palette.primary.main,
            bgcolor: theme.palette.action.selected
          }
        }}
      >
        {React.cloneElement(icon, { sx: { fontSize: SEARCHBAR_CONFIG.icon.fontSize } })}
      </IconButton>
    </Tooltip>
  );
};

export const SearchBar: React.FC<SearchBarProps> = ({
  searchFilter,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  filterMenuOpen,
  onFilterMenuToggle,
  onExpandAll,
  onCollapseAll
}) => {
  const theme = useTheme();

  // Zamknij menu filtrowania przy kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuOpen) {
        onFilterMenuToggle();
      }
    };

    if (filterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [filterMenuOpen, onFilterMenuToggle]);

  return (
    <Box sx={{ mb: SEARCHBAR_CONFIG.container.marginBottom }}>
      {/* Kontener z przyciskami i polem wyszukiwania */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: SEARCHBAR_CONFIG.container.gap, position: 'relative' }}>
        {/* Przycisk po lewej stronie */}
        <Box sx={{ position: 'relative' }}>
          <Tooltip title="Widoczność warstw" arrow>
            <IconButton
              size={SEARCHBAR_CONFIG.button.size}
              onClick={onFilterMenuToggle}
              sx={{
                color: filterMenuOpen ? theme.palette.primary.main : theme.palette.text.secondary,
                bgcolor: filterMenuOpen ? theme.palette.action.selected : theme.palette.action.hover,
                borderRadius: SEARCHBAR_CONFIG.button.borderRadius,
                p: SEARCHBAR_CONFIG.button.padding,
                '&:hover': {
                  color: theme.palette.primary.main,
                  bgcolor: theme.palette.action.selected
                }
              }}
            >
              <FilterListIcon sx={{ fontSize: SEARCHBAR_CONFIG.icon.fontSize }} />
            </IconButton>
          </Tooltip>

          {/* Dropdown menu filtrowania */}
          {filterMenuOpen && (
            <Box
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                mt: SEARCHBAR_CONFIG.dropdown.marginTop,
                bgcolor: theme.palette.background.paper,
                backdropFilter: 'blur(8px)',
                borderRadius: SEARCHBAR_CONFIG.dropdown.borderRadius,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[8],
                zIndex: 1000,
                minWidth: SEARCHBAR_CONFIG.dropdown.minWidth,
                py: SEARCHBAR_CONFIG.dropdown.paddingVertical,
              }}
            >
              {[
                { key: 'wszystko', label: 'Wszystko' },
                { key: 'wektor', label: 'Wektorowe' },
                { key: 'raster', label: 'Rastrowe' },
                { key: 'wms', label: 'WMS' }
              ].map((option) => (
                <Box
                  key={option.key}
                  onClick={() => {
                    onFilterChange(option.key as FilterType);
                    onFilterMenuToggle();
                  }}
                  sx={{
                    px: SEARCHBAR_CONFIG.dropdown.itemPadding.horizontal,
                    py: SEARCHBAR_CONFIG.dropdown.itemPadding.vertical,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: selectedFilter === option.key ? theme.palette.primary.main : theme.palette.text.primary,
                    fontSize: SEARCHBAR_CONFIG.dropdown.fontSize,
                    fontWeight: selectedFilter === option.key ? 500 : 400,
                    fontFamily: SEARCHBAR_CONFIG.dropdown.fontFamily,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                      color: theme.palette.primary.main
                    }
                  }}
                >
                  {option.label}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Pole wyszukiwania */}
        <Box
          component="input"
          type="text"
          placeholder="Znajdź warstwę lub grupę"
          value={searchFilter}
          onChange={(e: any) => onSearchChange(e.target.value)}
          sx={{
            flex: 1,
            p: SEARCHBAR_CONFIG.input.padding,
            borderRadius: SEARCHBAR_CONFIG.input.borderRadius,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.action.hover,
            color: theme.palette.text.primary,
            fontSize: SEARCHBAR_CONFIG.input.fontSize,
            fontFamily: SEARCHBAR_CONFIG.input.fontFamily,
            '&::placeholder': {
              color: theme.palette.text.disabled
            },
            '&:focus': {
              outline: 'none',
              borderColor: theme.palette.primary.main,
              bgcolor: theme.palette.action.selected,
              boxShadow: `0 0 0 2px ${theme.palette.primary.main}33`
            }
          }}
        />

        {/* Przyciski po prawej stronie */}
        <ActionButton
          title="Rozwiń wszystkie"
          onClick={onExpandAll}
          icon={<ExpandMoreIcon />}
        />

        <ActionButton
          title="Zwiń wszystkie"
          onClick={onCollapseAll}
          icon={<ExpandLessIcon />}
        />
      </Box>
    </Box>
  );
};
