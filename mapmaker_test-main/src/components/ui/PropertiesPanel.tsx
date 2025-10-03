/**
 * KOMPONENT PROPERTIES PANEL - PANEL WŁAŚCIWOŚCI WARSTWY
 * 
 * Odpowiada za:
 * - Wyświetlanie szczegółowych właściwości wybranej warstwy
 * - Edycję ustawień warstwy (przezroczystość, widoczność, style)
 * - Zarządzanie sekcjami rozwijalnymi (Style, Filtry, Metadane)
 * - Formularz edycji parametrów warstwy
 * - Akcje na warstwie (usuwanie, duplikowanie, eksport)
 * - Podgląd informacji o warstwie (typ, source, rozmiar)
 */
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { PropertiesPanelProps } from '@/types/layers';

// ===== KONFIGURACJA WIELKOŚCI I STYLÓW =====

const PANEL_CONFIG = {
  // Główne wymiary panelu
  panel: {
    height: '260px', // Wysokość całego panelu właściwości
    headerHeight: '40px', // Wysokość nagłówka panelu
    contentPadding: '0px', // Padding dla zawartości (nieużywane)
  },
  
   // Czcionki i tekst
  typography: {
    headerFontSize: '15px', // Rozmiar czcionki w nagłówku panelu
    sectionTitleFontSize: '15px', // Rozmiar tytułów sekcji
    labelFontSize: '11px', // Rozmiar etykiet pól
    valueFontSize: '11px', // Rozmiar wartości w polach
    buttonFontSize: '10px', // Rozmiar czcionki w przyciskach
    iconSize: '14px', // Rozmiar ikon w sekcjach
    closeIconSize: '14px', // Rozmiar ikony zamknięcia
  },
  
  // Elementy interfejsu (jednostki MUI: liczby = * 8px, stringi = dokładne wartości)
  elements: {
    sectionMarginBottom: 0.8, // Odstęp między sekcjami (0.8 * 8px = 6.4px)
    sectionContentMarginLeft: 2, // Wcięcie zawartości sekcji (2 * 8px = 16px)
    sectionContentMarginTop: 1, // Odstęp góra zawartości sekcji (1 * 8px = 8px)
    fieldMarginBottom: 0.8, // Odstęp między polami (0.8 * 8px = 6.4px)
    checkboxSize: '16px', // Rozmiar checkboxów (jednostka dokładna)
    buttonPaddingX: 2, // Padding poziomy przycisków (2 * 8px = 16px)
    buttonPaddingY: 0.3, // Padding pionowy przycisków (0.3 * 8px = 2.4px)
    buttonMinWidth: '60px', // Minimalna szerokość przycisków
    sliderHeight: '6px', // Wysokość sliderów
    sliderThumbSize: '14px', // Rozmiar suwaka slidera
  },
  
    // Kolory (dla łatwej zmiany motywu)
  colors: {
    panelBackground: 'rgba(50, 50, 50, 0.95)',
    headerBackground: 'rgba(40, 40, 40, 0.9)',
    buttonBackground: 'rgba(70, 80, 90, 0.8)',
    buttonBorder: 'rgba(100, 110, 120, 0.6)',
    buttonHoverBackground: 'rgba(79, 195, 247, 0.2)',
    buttonHoverBorder: 'rgba(79, 195, 247, 0.4)',
    accent: '#4fc3f7',
    text: 'white',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
  }
  
  };

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedLayer,
  warstwy,
  expandedSections,
  checkboxStates,
  onToggleSection,
  onToggleCheckbox,
  onClosePanel,
  onEditLayerStyle,
  onManageLayer,
  onLayerLabeling,
  findParentGroup
}) => {
  // Pomocnicze funkcje do renderowania elementów z konfiguracją
  const renderLabel = (text: string) => (
    <Typography sx={{ 
      fontSize: PANEL_CONFIG.typography.labelFontSize, 
      color: PANEL_CONFIG.colors.text, 
      mb: 0.5 
    }}>
      {text}
    </Typography>
  );

  const renderValue = (text: string, italic: boolean = true) => (
    <Typography sx={{ 
      fontSize: PANEL_CONFIG.typography.valueFontSize, 
      color: PANEL_CONFIG.colors.text, 
      fontStyle: italic ? 'italic' : 'normal',
      lineHeight: 1.3
    }}>
      {text}
    </Typography>
  );

  const renderFieldBox = (children: React.ReactNode, marginBottom: boolean = true) => (
    <Box sx={{ mb: marginBottom ? PANEL_CONFIG.elements.fieldMarginBottom : 0 }}>
      {children}
    </Box>
  );

  const renderCheckbox = (checkboxName: string, isChecked: boolean) => (
    <Box
      sx={{
        width: PANEL_CONFIG.elements.checkboxSize,
        height: PANEL_CONFIG.elements.checkboxSize,
        border: '1px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        bgcolor: isChecked ? `${PANEL_CONFIG.colors.accent}30` : 'transparent',
        '&:hover': {
          borderColor: PANEL_CONFIG.colors.accent
        }
      }}
      onClick={() => onToggleCheckbox(checkboxName)}
    >
      {isChecked && (
        <Box sx={{ 
          width: 8, 
          height: 4, 
          borderLeft: '2px solid white',
          borderBottom: '2px solid white',
          transform: 'rotate(-45deg)',
          mt: '-1px'
        }} />
      )}
    </Box>
  );

  const renderActionButton = (label: string, onClick: () => void, width: string = 'fit-content') => (
    <Box
      sx={{
        bgcolor: PANEL_CONFIG.colors.buttonBackground,
        border: `1px solid ${PANEL_CONFIG.colors.buttonBorder}`,
        borderRadius: '4px',
        px: width === 'fit-content' ? 2 : 1.5,
        py: 0.3,
        cursor: 'pointer',
        fontSize: PANEL_CONFIG.typography.buttonFontSize,
        color: PANEL_CONFIG.colors.text,
        fontWeight: 500,
        textAlign: 'center',
        width: width,
        minWidth: width === 'fit-content' ? PANEL_CONFIG.elements.buttonMinWidth : width,
        '&:hover': {
          bgcolor: PANEL_CONFIG.colors.buttonHoverBackground,
          borderColor: PANEL_CONFIG.colors.buttonHoverBorder
        }
      }}
      onClick={onClick}
    >
      {label}
    </Box>
  );

  const renderSection = (
    sectionId: string, 
    title: string, 
    children: React.ReactNode, 
    hasLock: boolean = false
  ) => (
    <Box sx={{ mb: PANEL_CONFIG.elements.sectionMarginBottom }}>
      <Box
        onClick={() => onToggleSection(sectionId)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          mb: 1,
          '&:hover': { color: PANEL_CONFIG.colors.accent }
        }}
      >
        {expandedSections[sectionId] ? 
          <ExpandMoreIcon sx={{ 
            fontSize: PANEL_CONFIG.typography.iconSize, 
            color: PANEL_CONFIG.colors.text, 
            mr: 0.5 
          }} /> :
          <ChevronRightIcon sx={{ 
            fontSize: PANEL_CONFIG.typography.iconSize, 
            color: PANEL_CONFIG.colors.text, 
            mr: 0.5 
          }} />
        }
        <Typography sx={{ 
          color: PANEL_CONFIG.colors.text, 
          fontSize: PANEL_CONFIG.typography.sectionTitleFontSize, 
          fontWeight: 500 
        }}>
          {title}
        </Typography>
        {hasLock && (
          <LockIcon sx={{ 
            ml: 1,
            fontSize: '12px',
            color: PANEL_CONFIG.colors.textMuted,
            cursor: 'help'
          }} />
        )}
      </Box>
      
      {expandedSections[sectionId] && (
        <Box sx={{ 
          ml: PANEL_CONFIG.elements.sectionContentMarginLeft, 
          mt: PANEL_CONFIG.elements.sectionContentMarginTop
        }}>
          {children}
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        flexShrink: 0,
        bgcolor: PANEL_CONFIG.colors.panelBackground,
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        height: PANEL_CONFIG.panel.height,
        overflow: 'hidden'
      }}
    >
      {/* Nagłówek panelu właściwości */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 0.5,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: PANEL_CONFIG.colors.headerBackground,
          minHeight: PANEL_CONFIG.panel.headerHeight
        }}
      >
        <Typography
          sx={{
            color: PANEL_CONFIG.colors.text,
            fontSize: PANEL_CONFIG.typography.headerFontSize,
            fontWeight: 500,
            flex: 1
          }}
        >
          {selectedLayer 
            ? `Właściwości ${selectedLayer.typ === 'grupa' ? 'grupy' : 'warstwy'}`
            : 'Właściwości projektu'
          }
        </Typography>
        {selectedLayer && (
          <IconButton
            size="small"
            onClick={onClosePanel}
            sx={{
              color: PANEL_CONFIG.colors.textSecondary,
              p: 0.5,
              '&:hover': { color: '#ff6b6b' }
            }}
          >
            <CloseIcon sx={{ fontSize: PANEL_CONFIG.typography.closeIconSize }} />
          </IconButton>
        )}
      </Box>

      {/* Zawartość panelu właściwości */}
      <Box sx={{ flex: 1, p: `${PANEL_CONFIG.panel.contentPadding}px`, overflow: 'auto' }}>
        {selectedLayer ? (
          <>
            {/* WŁAŚCIWOŚCI GRUPY */}
            {selectedLayer.typ === 'grupa' ? (
              <>
                {renderSection('grupa-informacje-ogolne', 'Informacje ogólne', (
                  <>
                    {renderFieldBox(
                      <>
                        {renderLabel('Nazwa')}
                        {renderValue('MIEJSCOWE PLANY ZAGOSPODAROWANIA PRZESTRZENNEGO')}
                      </>
                    )}
                    
                    {renderFieldBox(
                      <>
                        {renderLabel('Grupa')}
                        {renderValue(selectedLayer?.id ? (findParentGroup(warstwy, selectedLayer.id)?.nazwa || 'Grupa główna') : 'Grupa główna')}
                      </>,
                      false
                    )}
                  </>
                ))}

                {renderSection('grupa-pobieranie', 'Pobieranie', (
                  renderActionButton('Grupa', () => console.log('Pobierz grupę'))
                ), true)}

                {renderSection('grupa-widocznosc', 'Widoczność', (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: 'white' }}>
                        Domyślne wyświetlanie grupy
                      </Typography>
                      {renderCheckbox('grupaDomyslneWyswietlanie', checkboxStates.grupaDomyslneWyswietlanie)}
                    </Box>
                    {renderActionButton('Zapisz', () => console.log('Zapisz widoczność grupy'))}
                  </>
                ))}

                {renderSection('grupa-informacje-szczegolowe', 'Informacje szczegółowe', (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '11px', color: 'white' }}>
                      Legenda
                    </Typography>
                    {renderActionButton('Pokaż', () => console.log('Pokaż legendę grupy'))}
                  </Box>
                ))}
              </>
            ) : (
              <>
                {/* WŁAŚCIWOŚCI WARSTWY */}
                {renderSection('warstwa-informacje-ogolne', 'Informacje ogólne', (
                  <>
                    <Box sx={{ mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: 'white', mb: 0.5 }}>
                        Nazwa
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '11px', 
                        color: 'white', 
                        fontStyle: 'italic',
                        lineHeight: 1.3
                      }}>
                        {selectedLayer.nazwa}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: 'white', mb: 0.5 }}>
                        Grupa
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '11px', 
                        color: 'white', 
                        fontStyle: 'italic'
                      }}>
                        {selectedLayer.id ? (findParentGroup(warstwy, selectedLayer.id)?.nazwa || 'Brak grupy nadrzędnej') : 'Brak grupy nadrzędnej'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: 'white', mb: 0.5 }}>
                        Typ geometrii
                      </Typography>
                      <Typography sx={{ 
                        fontSize: '11px', 
                        color: 'white', 
                        fontStyle: 'italic'
                      }}>
                        Multi-polygon
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '11px', color: 'white' }}>
                        Tabela atrybutów
                      </Typography>
                      {renderActionButton('Pokaż', () => console.log('Pokaż tabelę atrybutów warstwy'))}
                    </Box>
                  </>
                ))}

                {renderSection('warstwa-pobieranie', 'Pobieranie', (
                  renderActionButton('Warstwa', () => console.log('Pobierz warstwę'))
                ), true)}

                {renderSection('warstwa-widocznosc', 'Widoczność', (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: 'white' }}>
                        Widoczność kolumn
                      </Typography>
                      {renderActionButton('Edytuj', () => console.log('Edytuj widoczność kolumn'), '60px')}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: 'white' }}>
                        Domyślne wyświetlanie warstwy
                      </Typography>
                      {renderCheckbox('warstwaDomyslneWyswietlanie', checkboxStates.warstwaDomyslneWyswietlanie)}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: 'white' }}>
                        Widoczność od zadanej skali
                      </Typography>
                      {renderCheckbox('warstwaWidocznoscOdSkali', checkboxStates.warstwaWidocznoscOdSkali)}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontSize: '11px', color: 'white' }}>
                        Widoczność w trybie opublikowanym
                      </Typography>
                      {renderCheckbox('warstwaWidocznoscTrybOpublikowany', checkboxStates.warstwaWidocznoscTrybOpublikowany)}
                    </Box>

                    {renderActionButton('Zapisz', () => console.log('Zapisz ustawienia widoczności warstwy'))}

                    {/* Przezroczystość warstwy ze sliderem */}
                    <Box sx={{ mb: 1, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: 'white' }}>
                          Przezroczystość warstwy
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              bgcolor: 'rgba(70, 80, 90, 0.8)',
                              border: '1px solid rgba(100, 110, 120, 0.6)',
                              borderRadius: '4px',
                              px: 1,
                              py: 0.3,
                              fontSize: '10px',
                              color: 'white',
                              minWidth: '30px',
                              textAlign: 'center'
                            }}
                          >
                            60
                          </Box>
                          <Typography sx={{ fontSize: '10px', color: 'white' }}>
                            %
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Slider */}
                      <Box sx={{ position: 'relative', height: '6px', bgcolor: 'rgba(255, 255, 255, 0.3)', borderRadius: '3px' }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '60%',
                            height: '100%',
                            bgcolor: '#4fc3f7',
                            borderRadius: '3px'
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '60%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 14,
                            height: 14,
                            bgcolor: 'white',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: '#4fc3f7'
                            }
                          }}
                          onClick={() => console.log('Zmień przezroczystość warstwy')}
                        />
                      </Box>
                    </Box>
                  </>
                ))}

                {renderSection('warstwa-informacje-szczegolowe', 'Informacje szczegółowe', (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '11px', color: 'white' }}>
                      Legenda
                    </Typography>
                    {renderActionButton('Pokaż', () => console.log('Pokaż legendę warstwy'))}
                  </Box>
                ))}

                {renderSection('warstwa-styl-warstwy', 'Styl warstwy', (
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.8, flexWrap: 'wrap' }}>
                    {renderActionButton('Edytuj', onEditLayerStyle, '60px')}
                    {renderActionButton('Zarządzaj', onManageLayer, '70px')}
                    {renderActionButton('Etykietowanie', onLayerLabeling, '90px')}
                  </Box>
                ), true)}
              </>
            )}
          </>
        ) : (
          <>
            {/* WŁAŚCIWOŚCI PROJEKTU */}
            {renderSection('uslugi', 'Usługi', (
              <Typography sx={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', mb: 1, fontStyle: 'italic' }}>
                Brak udostępnionych usług
              </Typography>
            ))}

            {renderSection('pobieranie', 'Pobieranie', (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box
                  sx={{
                    bgcolor: 'rgba(79, 195, 247, 0.2)',
                    border: '1px solid rgba(79, 195, 247, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#4fc3f7',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(79, 195, 247, 0.3)',
                    }
                  }}
                  onClick={() => console.log('QGS/QGZ clicked')}
                >
                  QGS/QGZ
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(79, 195, 247, 0.2)',
                    border: '1px solid rgba(79, 195, 247, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#4fc3f7',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(79, 195, 247, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Zbiór APP clicked')}
                >
                  Zbiór APP
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(79, 195, 247, 0.2)',
                    border: '1px solid rgba(79, 195, 247, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#4fc3f7',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(79, 195, 247, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Metadane clicked')}
                >
                  Metadane
                </Box>
              </Box>
            ))}

            {renderSection('metadane', 'Metadane', (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Box
                  sx={{
                    bgcolor: 'rgba(156, 39, 176, 0.2)',
                    border: '1px solid rgba(156, 39, 176, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#ab47bc',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(156, 39, 176, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Wyświetl clicked')}
                >
                  Wyświetl
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(63, 81, 181, 0.2)',
                    border: '1px solid rgba(63, 81, 181, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#5c6bc0',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(63, 81, 181, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Wyszukaj clicked')}
                >
                  Wyszukaj
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(76, 175, 80, 0.2)',
                    border: '1px solid rgba(76, 175, 80, 0.4)',
                    borderRadius: '4px',
                    px: 1.5,
                    py: 0.5,
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#66bb6a',
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: 'rgba(76, 175, 80, 0.3)',
                    }
                  }}
                  onClick={() => console.log('Stwórz clicked')}
                >
                  Stwórz
                </Box>
              </Box>
            ))}

            {renderSection('inne-projekty', 'Inne projekty użytkownika', (
              <Typography sx={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic' }}>
                Brak innych projektów
              </Typography>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
};
