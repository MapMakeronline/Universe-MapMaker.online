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
import React, { useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { SearchBarProps } from '@/types/layers';

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
  },
  
  // Kolory
  colors: {
    // Kolory przycisków
    button: {
      default: 'rgba(255, 255, 255, 0.7)',
      active: '#4fc3f7',
      hover: '#4fc3f7'
    },
    // Kolory tła
    background: {
      button: {
        default: 'rgba(255, 255, 255, 0.08)',
        active: 'rgba(79, 195, 247, 0.2)',
        hover: 'rgba(79, 195, 247, 0.1)'
      },
      dropdown: 'rgba(60, 60, 60, 0.95)',
      dropdownHover: 'rgba(255, 255, 255, 0.1)',
      input: {
        default: 'rgba(255, 255, 255, 0.08)',
        focus: 'rgba(255, 255, 255, 0.12)'
      }
    },
    // Kolory obramowań
    border: {
      input: {
        default: 'rgba(79, 195, 247, 0.3)',
        focus: '#4fc3f7'
      },
      dropdown: 'rgba(255, 255, 255, 0.2)'
    },
    // Kolory tekstu
    text: {
      default: '#ffffff',
      active: '#4fc3f7',
      placeholder: 'rgba(255, 255, 255, 0.5)'
    },
    // Kolory cieni
    shadow: {
      dropdown: 'rgba(0, 0, 0, 0.4)',
      inputFocus: 'rgba(79, 195, 247, 0.2)'
    }
  }
} as const;

// Funkcja pomocnicza dla przycisków akcji
const ActionButton: React.FC<{
  title: string;
  onClick: () => void;
  icon: React.ReactElement;
}> = ({ title, onClick, icon }) => (
  <Tooltip title={title} arrow>
    <IconButton
      size={SEARCHBAR_CONFIG.button.size}
      onClick={onClick}
      sx={{
        color: SEARCHBAR_CONFIG.colors.button.default,
        bgcolor: SEARCHBAR_CONFIG.colors.background.button.default,
        borderRadius: SEARCHBAR_CONFIG.button.borderRadius,
        p: SEARCHBAR_CONFIG.button.padding,
        '&:hover': { 
          color: SEARCHBAR_CONFIG.colors.button.hover,
          bgcolor: SEARCHBAR_CONFIG.colors.background.button.hover
        }
      }}
    >
      {React.cloneElement(icon, { sx: { fontSize: SEARCHBAR_CONFIG.icon.fontSize } })}
    </IconButton>
  </Tooltip>
);

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
                color: filterMenuOpen ? SEARCHBAR_CONFIG.colors.button.active : SEARCHBAR_CONFIG.colors.button.default,
                bgcolor: filterMenuOpen ? SEARCHBAR_CONFIG.colors.background.button.active : SEARCHBAR_CONFIG.colors.background.button.default,
                borderRadius: SEARCHBAR_CONFIG.button.borderRadius,
                p: SEARCHBAR_CONFIG.button.padding,
                '&:hover': { 
                  color: SEARCHBAR_CONFIG.colors.button.hover,
                  bgcolor: SEARCHBAR_CONFIG.colors.background.button.hover
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
                bgcolor: SEARCHBAR_CONFIG.colors.background.dropdown,
                backdropFilter: 'blur(8px)',
                borderRadius: SEARCHBAR_CONFIG.dropdown.borderRadius,
                border: `1px solid ${SEARCHBAR_CONFIG.colors.border.dropdown}`,
                boxShadow: `0 4px 20px ${SEARCHBAR_CONFIG.colors.shadow.dropdown}`,
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
                    onFilterChange(option.key as any);
                    onFilterMenuToggle();
                  }}
                  sx={{
                    px: SEARCHBAR_CONFIG.dropdown.itemPadding.horizontal,
                    py: SEARCHBAR_CONFIG.dropdown.itemPadding.vertical,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    color: selectedFilter === option.key ? SEARCHBAR_CONFIG.colors.text.active : SEARCHBAR_CONFIG.colors.text.default,
                    fontSize: SEARCHBAR_CONFIG.dropdown.fontSize,
                    fontWeight: selectedFilter === option.key ? 500 : 400,
                    fontFamily: SEARCHBAR_CONFIG.dropdown.fontFamily,
                    '&:hover': {
                      bgcolor: SEARCHBAR_CONFIG.colors.background.dropdownHover,
                      color: SEARCHBAR_CONFIG.colors.text.active
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
            border: `1px solid ${SEARCHBAR_CONFIG.colors.border.input.default}`,
            bgcolor: SEARCHBAR_CONFIG.colors.background.input.default,
            color: SEARCHBAR_CONFIG.colors.text.default,
            fontSize: SEARCHBAR_CONFIG.input.fontSize,
            fontFamily: SEARCHBAR_CONFIG.input.fontFamily,
            '&::placeholder': {
              color: SEARCHBAR_CONFIG.colors.text.placeholder
            },
            '&:focus': {
              outline: 'none',
              borderColor: SEARCHBAR_CONFIG.colors.border.input.focus,
              bgcolor: SEARCHBAR_CONFIG.colors.background.input.focus,
              boxShadow: `0 0 0 2px ${SEARCHBAR_CONFIG.colors.shadow.inputFocus}`
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
