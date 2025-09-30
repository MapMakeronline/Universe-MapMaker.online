'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Map as MapIcon,
  Layers as LayersIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  ZoomInMap as ZoomInMapIcon,
  Folder as FolderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarToday as CalendarTodayIcon,
  Public as PublicIcon,
  AddBox as AddBoxIcon,
  ArrowUpward as ArrowUpwardIcon,
  Clear as ClearIcon,
  Chat as ChatIcon,
  Star as StarIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

interface Warstwa {
  id: string;
  nazwa: string;
  widoczna: boolean;
  typ: 'grupa' | 'wektor' | 'raster';
  dzieci?: Warstwa[];
  rozwinięta?: boolean;
}

const PANEL_WIDTH = 320;

const LeftPanel: React.FC = () => {
  const theme = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('before');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'wszystko' | 'wektor' | 'raster' | 'wms'>('wszystko');
  const [warstwy, setWarstwy] = useState<Warstwa[]>([
    {
      id: 'obszar-rewitalizacji',
      nazwa: 'Obszar Rewitalizacji',
      widoczna: true,
      typ: 'grupa',
      rozwinięta: true,
      dzieci: [
        {
          id: 'miejscowe-plany',
          nazwa: 'MIEJSCOWE PLANY ZAGOSPODAROWANIA...',
          widoczna: true,
          typ: 'grupa',
          rozwinięta: false,
          dzieci: [
            { id: 'xxvii-282-2001', nazwa: 'XXVII_282_2001', widoczna: true, typ: 'wektor' },
            { id: 'xxxvii-283-2001', nazwa: 'XXXVII_283_2001', widoczna: true, typ: 'wektor' },
            { id: 'xxxvii-286-2001', nazwa: 'XXXVII_286_2001', widoczna: true, typ: 'wektor' },
            { id: 'xlii-307-2002', nazwa: 'XLII_307_2002', widoczna: true, typ: 'wektor' },
            { id: 'xlii-308-2002', nazwa: 'XLII_308_2002', widoczna: true, typ: 'wektor' },
            { id: 'xlviii-335-2002', nazwa: 'XLVIII_335_2002', widoczna: true, typ: 'wektor' },
            { id: 'xxxviii-325-2005', nazwa: 'XXXVIII_325_2005', widoczna: true, typ: 'wektor' }
          ]
        },
        {
          id: 'granice',
          nazwa: 'Granice',
          widoczna: false,
          typ: 'grupa',
          rozwinięta: true,
          dzieci: [
            { id: 'granica-miasta-gminy', nazwa: 'Granica Miasta i Gminy', widoczna: false, typ: 'wektor' },
            { id: 'granica-miasta-ogrodzieniec', nazwa: 'Granica Miasta Ogrodzieniec', widoczna: false, typ: 'wektor' },
            { id: 'granice-obreby-geodezyjne', nazwa: 'Granice obręby geodezyjne...', widoczna: false, typ: 'wektor' },
            { id: 'granice-dzialek-1-10000', nazwa: '(< 1:10000) Granice działek ...', widoczna: false, typ: 'wektor' }
          ]
        }
      ]
    }
  ]);

  // Zamknij menu filtrowania przy kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = () => {
      if (filterMenuOpen) {
        setFilterMenuOpen(false);
      }
    };

    if (filterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [filterMenuOpen]);

  const toggleWarstwaVisibility = (id: string) => {
    const updateWarstwy = (warstwy: Warstwa[]): Warstwa[] => {
      return warstwy.map(warstwa => {
        if (warstwa.id === id) {
          const newWarstwa = { ...warstwa, widoczna: !warstwa.widoczna };
          if (newWarstwa.dzieci) {
            newWarstwa.dzieci = newWarstwa.dzieci.map(dziecko => ({
              ...dziecko,
              widoczna: newWarstwa.widoczna
            }));
          }
          return newWarstwa;
        }
        if (warstwa.dzieci) {
          return { ...warstwa, dzieci: updateWarstwy(warstwa.dzieci) };
        }
        return warstwa;
      });
    };
    setWarstwy(updateWarstwy(warstwy));
  };

  const toggleWarstwaExpansion = (id: string) => {
    const updateExpansion = (warstwy: Warstwa[]): Warstwa[] => {
      return warstwy.map(warstwa => {
        if (warstwa.id === id && warstwa.typ === 'grupa') {
          return { ...warstwa, rozwinięta: !warstwa.rozwinięta };
        }
        if (warstwa.dzieci) {
          return { ...warstwa, dzieci: updateExpansion(warstwa.dzieci) };
        }
        return warstwa;
      });
    };
    setWarstwy(updateExpansion(warstwy));
  };

  const getWarstwaIcon = (typ: Warstwa['typ']) => {
    switch (typ) {
      case 'grupa': return <FolderIcon sx={{ color: theme.palette.primary.main }} />;
      case 'wektor': return <LayersIcon sx={{ color: theme.palette.success.main }} />;
      case 'raster': return <LayersIcon sx={{ color: theme.palette.success.main }} />;
      default: return <LayersIcon sx={{ color: theme.palette.success.main }} />;
    }
  };

  const filterWarstwy = (warstwy: Warstwa[], filter: string): Warstwa[] => {
    if (!filter) return warstwy;
    return warstwy.filter(warstwa => {
      const matchesName = warstwa.nazwa.toLowerCase().includes(filter.toLowerCase());
      const hasMatchingChildren = warstwa.dzieci &&
        filterWarstwy(warstwa.dzieci, filter).length > 0;
      return matchesName || hasMatchingChildren;
    }).map(warstwa => ({
      ...warstwa,
      dzieci: warstwa.dzieci ? filterWarstwy(warstwa.dzieci, filter) : undefined
    }));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedItem && draggedItem !== id) {
      const isValidTarget = !isDescendant(draggedItem, id);
      if (isValidTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY;
        const elementMiddle = rect.top + rect.height / 2;

        const position = mouseY < elementMiddle ? 'before' : 'after';

        setDropTarget(id);
        setDropPosition(position);
      }
    }
  };

  const isDescendant = (parentId: string, childId: string): boolean => {
    const findInTree = (items: Warstwa[], searchId: string): Warstwa | null => {
      for (const item of items) {
        if (item.id === searchId) return item;
        if (item.dzieci) {
          const found = findInTree(item.dzieci, searchId);
          if (found) return found;
        }
      }
      return null;
    };

    const parent = findInTree(warstwy, parentId);
    if (!parent || !parent.dzieci) return false;

    const checkChildren = (items: Warstwa[]): boolean => {
      for (const item of items) {
        if (item.id === childId) return true;
        if (item.dzieci && checkChildren(item.dzieci)) return true;
      }
      return false;
    };

    return checkChildren(parent.dzieci);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeavingElement = (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );

    if (isLeavingElement) {
      setDropTarget(null);
      setDropPosition('before');
    }
  };

  const handleDragOver = (e: React.DragEvent, id?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    if (draggedItem && id && id !== draggedItem) {
      const isValidTarget = !isDescendant(draggedItem, id);
      if (isValidTarget) {
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseY = e.clientY;
        const elementMiddle = rect.top + rect.height / 2;

        const position = mouseY < elementMiddle ? 'before' : 'after';

        if (dropTarget !== id || dropPosition !== position) {
          setDropTarget(id);
          setDropPosition(position);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem || draggedItem === targetId) {
      setDropTarget(null);
      return;
    }

    const reorderItemsInTree = (items: Warstwa[]): Warstwa[] => {
      const draggedIndex = items.findIndex(item => item.id === draggedItem);
      const targetIndex = items.findIndex(item => item.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newItems = [...items];
        const [draggedElement] = newItems.splice(draggedIndex, 1);

        let insertIndex;
        if (dropPosition === 'before') {
          insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        } else {
          insertIndex = draggedIndex < targetIndex ? targetIndex : targetIndex + 1;
        }

        newItems.splice(insertIndex, 0, draggedElement);
        return newItems;
      }

      return items.map(item => ({
        ...item,
        dzieci: item.dzieci ? reorderItemsInTree(item.dzieci) : undefined
      }));
    };

    const newWarstwy = reorderItemsInTree(warstwy);

    if (JSON.stringify(warstwy) !== JSON.stringify(newWarstwy)) {
      setWarstwy(newWarstwy);
    }

    setDraggedItem(null);
    setDropTarget(null);
    setDropPosition('before');
  };

  const handleDropAtEnd = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem) return;

    const moveItemToEndOfGroup = (items: Warstwa[]): Warstwa[] => {
      const newItems = [...items];

      const removeDraggedItem = (arr: Warstwa[]): Warstwa[] => {
        return arr.reduce((acc: Warstwa[], item) => {
          if (item.id === draggedItem) {
            return acc;
          }

          const newItem = {
            ...item,
            dzieci: item.dzieci ? removeDraggedItem(item.dzieci) : undefined
          };
          acc.push(newItem);
          return acc;
        }, []);
      };

      let draggedElement: Warstwa | null = null;
      const findDraggedElement = (arr: Warstwa[]): void => {
        arr.forEach(item => {
          if (item.id === draggedItem) {
            draggedElement = { ...item };
          }
          if (item.dzieci) {
            findDraggedElement(item.dzieci);
          }
        });
      };

      findDraggedElement(newItems);

      if (!draggedElement) return items;

      const itemsWithoutDragged = removeDraggedItem(newItems);

      const addToEndOfGroup = (arr: Warstwa[]): Warstwa[] => {
        return arr.map(item => {
          if (item.id === groupId) {
            const newChildren = item.dzieci ? [...item.dzieci] : [];
            newChildren.push(draggedElement!);
            return {
              ...item,
              dzieci: newChildren
            };
          }

          if (item.dzieci) {
            return {
              ...item,
              dzieci: addToEndOfGroup(item.dzieci)
            };
          }

          return item;
        });
      };

      return addToEndOfGroup(itemsWithoutDragged);
    };

    const newWarstwy = moveItemToEndOfGroup(warstwy);

    if (JSON.stringify(warstwy) !== JSON.stringify(newWarstwy)) {
      setWarstwy(newWarstwy);
    }

    setDraggedItem(null);
    setDropTarget(null);
    setDropPosition('before');
  };

  const renderWarstwaItem = (warstwa: Warstwa, level: number = 0): React.ReactNode => {
    const isDragged = draggedItem === warstwa.id;
    const isDropTarget = dropTarget === warstwa.id;

    return (
      <Box key={warstwa.id} sx={{ mb: 0, position: 'relative' }}>
        {isDropTarget && draggedItem && (
          <Box
            sx={{
              position: 'absolute',
              top: dropPosition === 'before' ? -2 : 'auto',
              bottom: dropPosition === 'after' ? -2 : 'auto',
              left: level * 1.5 * 8,
              right: 8,
              height: 3,
              bgcolor: theme.palette.primary.main,
              borderRadius: 1.5,
              zIndex: 1000,
              pointerEvents: 'none',
              boxShadow: `0 0 8px ${theme.palette.primary.main}`,
              animation: 'preciseDropIndicator 1.2s infinite',
              '@keyframes preciseDropIndicator': {
                '0%': { opacity: 0.7, transform: 'scaleX(0.8)' },
                '50%': { opacity: 1, transform: 'scaleX(1)' },
                '100%': { opacity: 0.7, transform: 'scaleX(0.8)' }
              },
            }}
          />
        )}

        <Box
          className="layer-item"
          draggable
          onDragStart={(e) => handleDragStart(e, warstwa.id)}
          onDragEnd={handleDragEnd}
          onDragEnter={(e) => handleDragEnter(e, warstwa.id)}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => handleDragOver(e, warstwa.id)}
          onDrop={(e) => handleDrop(e, warstwa.id)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            py: 0.5,
            px: 1,
            ml: level * 1.5,
            borderRadius: 4,
            cursor: isDragged ? 'grabbing' : 'grab',
            transition: 'all 0.2s ease',
            bgcolor: isDragged ? theme.palette.action.selected :
                     isDropTarget ? theme.palette.action.hover : 'transparent',
            borderLeft: level > 0 ? `2px solid ${theme.palette.divider}` : 'none',
            border: isDragged ? `2px dashed ${theme.palette.primary.main}` :
                    isDropTarget ? `2px solid ${theme.palette.success.main}` : 'none',
            opacity: isDragged ? 0.6 : 1,
            transform: isDragged ? 'scale(1.02) rotate(2deg)' : 'none',
            '&:hover': {
              bgcolor: theme.palette.action.hover,
              borderLeft: level > 0 ? `2px solid ${theme.palette.primary.main}` : 'none',
              transform: isDragged ? 'scale(1.02) rotate(2deg)' : 'translateX(4px)',
            }
          }}
        >
        {warstwa.typ === 'grupa' && (
          <Box
            onClick={() => toggleWarstwaExpansion(warstwa.id)}
            sx={{
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              mr: 0.5,
              '&:hover': { color: theme.palette.primary.main }
            }}
          >
            <Box
              sx={{
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: warstwa.rozwinięta ? '6px 4px 0 4px' : '4px 0 4px 6px',
                borderColor: warstwa.rozwinięta
                  ? `${theme.palette.text.primary} transparent transparent transparent`
                  : `transparent transparent transparent ${theme.palette.text.primary}`,
                transition: 'all 0.2s ease'
              }}
            />
          </Box>
        )}

        <Box
          component="input"
          type="checkbox"
          checked={warstwa.widoczna}
          onChange={() => toggleWarstwaVisibility(warstwa.id)}
          sx={{
            mr: 1,
            cursor: 'pointer',
            accentColor: theme.palette.primary.main,
            width: 16,
            height: 16,
          }}
        />

        <Box sx={{
          mr: 1,
          display: 'flex',
          alignItems: 'center',
          minWidth: 20,
          justifyContent: 'center'
        }}>
          {getWarstwaIcon(warstwa.typ)}
        </Box>

        <Tooltip title={warstwa.nazwa} arrow placement="top">
          <Typography
            sx={{
              fontSize: '13px',
              color: warstwa.widoczna ? theme.palette.text.primary : theme.palette.text.disabled,
              flex: 1,
              fontWeight: warstwa.typ === 'grupa' ? 500 : 400,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'pointer'
            }}
          >
            {warstwa.nazwa}
          </Typography>
        </Tooltip>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Przybliż do warstwy" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
              }}
              sx={{
                color: theme.palette.text.secondary,
                p: 0.25,
                '&:hover': { color: theme.palette.primary.main }
              }}
            >
              <ZoomInMapIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {warstwa.typ !== 'grupa' && (
            <Tooltip title="Pokaż tabele atrybutów" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                sx={{
                  color: theme.palette.text.secondary,
                  p: 0.25,
                  '&:hover': { color: theme.palette.primary.main }
                }}
              >
                <CalendarTodayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {warstwa.dzieci && warstwa.rozwinięta && (
        <Box sx={{ ml: 1 }}>
          {warstwa.dzieci.map(dziecko => renderWarstwaItem(dziecko, level + 1))}

          <Box
            onDragEnter={(e) => handleDragEnter(e, `${warstwa.id}-end`)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropAtEnd(e, warstwa.id)}
            sx={{
              height: 20,
              position: 'relative',
              cursor: draggedItem ? 'copy' : 'default',
            }}
          />
        </Box>
      )}
    </Box>
  );
  };

  const filteredWarstwy = filterWarstwy(warstwy, searchFilter);

  return (
    <>
      <IconButton
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        sx={{
          position: 'fixed',
          top: 20,
          left: sidebarCollapsed ? 20 : PANEL_WIDTH + 20,
          zIndex: 1300,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          },
          transition: 'left 0.3s ease',
          boxShadow: 2
        }}
      >
        {sidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
      </IconButton>

      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: sidebarCollapsed ? -PANEL_WIDTH : 0,
          height: '100vh',
          width: PANEL_WIDTH,
          bgcolor: theme.palette.background.paper,
          boxShadow: sidebarCollapsed ? 'none' : 2,
          transition: 'left 0.3s ease',
          zIndex: 1200,
          borderRight: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.default,
          textAlign: 'center'
        }}>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.primary,
              mb: 2,
              fontSize: '16px',
              fontWeight: 400,
              letterSpacing: '2px',
              textTransform: 'lowercase'
            }}
          >
            MapMaker
          </Typography>

          <Box sx={{
            display: 'flex',
            gap: 0.5,
            mb: 2,
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            px: 1
          }}>
            <Tooltip title="Dodaj zbiór danych - INSPIRE" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5, '&:hover': { color: theme.palette.primary.main } }}>
                <PublicIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Dodaj zbór danych - PRAWO KRAJOWE" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5, '&:hover': { color: theme.palette.primary.main } }}>
                <MapIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Dodaj warstwe" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5, '&:hover': { color: theme.palette.primary.main } }}>
                <AddBoxIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Importuj warstwe" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5, '&:hover': { color: theme.palette.primary.main } }}>
                <ArrowUpwardIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Dodaj grupę" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5, '&:hover': { color: theme.palette.primary.main } }}>
                <AddIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Usuń grupę lub warstwę" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5, '&:hover': { color: theme.palette.error.main } }}>
                <ClearIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Utwórz konsultacje społeczne" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5, '&:hover': { color: theme.palette.primary.main } }}>
                <ChatIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Menedżer warstw" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5, '&:hover': { color: theme.palette.primary.main } }}>
                <StarIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Konfiguracja wyrysu i wypisu" arrow>
              <IconButton size="small" sx={{ color: theme.palette.text.secondary, p: 0.5, '&:hover': { color: theme.palette.primary.main } }}>
                <EditIcon sx={{ fontSize: '18px' }} />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
              <Box sx={{ position: 'relative' }}>
                <Tooltip title="Widoczność warstw" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                    sx={{
                      color: filterMenuOpen ? theme.palette.primary.main : theme.palette.text.secondary,
                      bgcolor: filterMenuOpen ? theme.palette.action.selected : theme.palette.action.hover,
                      borderRadius: '4px',
                      p: 0.75,
                      '&:hover': {
                        color: theme.palette.primary.main,
                        bgcolor: theme.palette.action.selected
                      }
                    }}
                  >
                    <FilterListIcon sx={{ fontSize: '16px' }} />
                  </IconButton>
                </Tooltip>

                {filterMenuOpen && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      mt: 0.5,
                      bgcolor: theme.palette.background.paper,
                      borderRadius: '8px',
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: 3,
                      zIndex: 1000,
                      minWidth: 140,
                      py: 1
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
                          setSelectedFilter(option.key as any);
                          setFilterMenuOpen(false);
                        }}
                        sx={{
                          px: 2,
                          py: 1.2,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: selectedFilter === option.key ? theme.palette.primary.main : theme.palette.text.primary,
                          fontSize: '13px',
                          fontWeight: selectedFilter === option.key ? 500 : 400,
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

              <Box
                component="input"
                type="text"
                placeholder="Znajdź warstwę lub grupę"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                sx={{
                  flex: 1,
                  p: '8px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.default,
                  color: theme.palette.text.primary,
                  fontSize: '13px',
                  '&::placeholder': {
                    color: theme.palette.text.disabled
                  },
                  '&:focus': {
                    outline: 'none',
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 2px ${theme.palette.primary.main}33`
                  }
                }}
              />

              <Tooltip title="Rozwiń wszystkie" arrow>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    bgcolor: theme.palette.action.hover,
                    borderRadius: '4px',
                    p: 0.75,
                    '&:hover': {
                      color: theme.palette.primary.main,
                      bgcolor: theme.palette.action.selected
                    }
                  }}
                >
                  <ExpandMoreIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Zwiń wszystkie" arrow>
                <IconButton
                  size="small"
                  sx={{
                    color: theme.palette.text.secondary,
                    bgcolor: theme.palette.action.hover,
                    borderRadius: '4px',
                    p: 0.75,
                    '&:hover': {
                      color: theme.palette.primary.main,
                      bgcolor: theme.palette.action.selected
                    }
                  }}
                >
                  <ExpandLessIcon sx={{ fontSize: '16px' }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Box
          className="layer-tree"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 1,
            '&::-webkit-scrollbar': {
              width: '6px'
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: theme.palette.action.hover
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: theme.palette.action.selected,
              borderRadius: '3px'
            }
          }}
        >
          {filteredWarstwy.map(warstwa => renderWarstwaItem(warstwa))}
        </Box>
      </Box>
    </>
  );
};

export default LeftPanel;