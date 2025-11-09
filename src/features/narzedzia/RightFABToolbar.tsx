"use client"

import type React from "react"
import { useState } from "react"
import { MapRef } from 'react-map-gl'
import Fab from '@mui/material/Fab';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import UserAvatar from '@/common/components/UserAvatar';

// Coral/Red Icons (Primary Color)
import HomeIcon from '@mui/icons-material/Home';
import PlaceIcon from '@mui/icons-material/Place';
import EditIcon from '@mui/icons-material/Edit';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import StraightenIcon from '@mui/icons-material/Straighten';
import SearchIcon from '@mui/icons-material/Search';

// White Icons (Always visible)
import InfoIcon from '@mui/icons-material/Info';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import PrintIcon from '@mui/icons-material/Print';
import MapIcon from '@mui/icons-material/Map';
import CropIcon from '@mui/icons-material/Crop';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';

// User menu icons
import AccountCircle from '@mui/icons-material/AccountCircle';
import Logout from '@mui/icons-material/Logout';
import Person from '@mui/icons-material/Person';

import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setMeasurementMode, clearAllMeasurements, setIdentifyMode } from "@/redux/slices/drawSlice"
import SearchModal from "@/features/mapa/interakcje/SearchModal"
import MeasurementModal from "@/features/layers/modals/MeasurementModal"
import ExportPDFModal, { type ExportConfig } from "@/features/layers/modals/ExportPDFModal"

const FAB_SIZE = 56; // Standard FAB size
const FAB_SIZE_MOBILE = 44; // Smaller on mobile (was 48, now 44)
const FAB_SPACING = 8; // Gap between FABs
const FAB_SPACING_MOBILE = 6; // Smaller gap on mobile
const RIGHT_MARGIN = 16; // Distance from right edge
const TOP_START = 16; // Starting Y position
const AVATAR_SIZE_DESKTOP = 56;
const AVATAR_SIZE_MOBILE = 44;

interface FABTool {
  id: string;
  icon: any;
  tooltip: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  color?: 'primary' | 'default' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  authRequired?: boolean;
}

interface RightFABToolbarProps {
  mapRef: React.RefObject<MapRef>;
}

const RightFABToolbar: React.FC<RightFABToolbarProps> = ({ mapRef }) => {
  const theme = useTheme();
  const router = useRouter()
  const dispatch = useAppDispatch()
  // ✅ Use mapRef.current instead of useMap() hook (RightFABToolbar is rendered outside <Map> component)
  const map = mapRef.current?.getMap();
  const { measurement, identify } = useAppSelector((state) => state.draw)
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Zoom to Selected Feature
  const selectedFeatureId = useAppSelector((state) => state.features.selectedFeatureId);
  const features = useAppSelector((state) => state.features.features);
  const selectedFeature = selectedFeatureId ? features[selectedFeatureId] : null;

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

  // Haptic feedback for mobile
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDistanceMeasure = () => {
    triggerHapticFeedback();
    dispatch(
      setMeasurementMode({
        distance: !measurement.isDistanceMode,
        area: false,
      }),
    )
  }

  const handleAreaMeasure = () => {
    triggerHapticFeedback();
    dispatch(
      setMeasurementMode({
        distance: false,
        area: !measurement.isAreaMode,
      }),
    )
  }

  const handlePDFExport = () => {
    triggerHapticFeedback();
    setPdfModalOpen(true)
  }

  const handleExportPDF = async (config: ExportConfig) => {
    console.log('PDF Export requested with config:', config)
    alert('Funkcja eksportu PDF będzie dostępna wkrótce!')
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    triggerHapticFeedback();
    setUserMenuAnchor(event.currentTarget)
  }

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null)
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
    handleUserMenuClose()
  }

  const handleLogout = () => {
    console.log("Logout")
    router.push('/auth?tab=0')
    handleUserMenuClose()
  }

  const handleLogin = () => {
    router.push('/auth?tab=0')
    handleUserMenuClose()
  }

  const handleRegister = () => {
    router.push('/auth?tab=1')
    handleUserMenuClose()
  }

  const handleIdentify = () => {
    triggerHapticFeedback();
    dispatch(setIdentifyMode(!identify.isActive))
  }

  const handleZoomToSelected = () => {
    if (!map || !selectedFeature) {
      console.warn('[ZoomToSelected] No map or no selected feature');
      return;
    }

    triggerHapticFeedback();
    console.log('[ZoomToSelected] Zooming to feature:', selectedFeature);

    // If feature has geometry (GeoJSON), calculate bounds
    if (selectedFeature.geometry) {
      try {
        const coords = extractCoordinatesFromGeometry(selectedFeature.geometry);
        if (coords.length === 0) {
          throw new Error('No coordinates found in geometry');
        }

        const bounds = calculateBounds(coords);

        // Zoom to bounding box with padding
        map.fitBounds(
          [
            [bounds.minX, bounds.minY], // SW corner
            [bounds.maxX, bounds.maxY], // NE corner
          ],
          {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            duration: 1000,
            maxZoom: 18,
          }
        );
      } catch (error) {
        console.error('[ZoomToSelected] Error calculating bounds:', error);
        // Fallback to center point
        zoomToCenter();
      }
    } else {
      // Fallback: Use center point
      zoomToCenter();
    }

    function zoomToCenter() {
      if (selectedFeature!.coordinates) {
        map!.flyTo({
          center: selectedFeature!.coordinates,
          zoom: 16,
          duration: 1000,
        });
      }
    }
  }

  const handleGeolocation = () => {
    triggerHapticFeedback();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          map?.flyTo({
            center: [longitude, latitude],
            zoom: 16,
            duration: 1500,
            essential: true,
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Nie można pobrać lokalizacji. Sprawdź uprawnienia przeglądarki.')
        }
      )
    } else {
      alert('Geolokalizacja nie jest wspierana przez Twoją przeglądarkę.')
    }
  }

  // Define all FAB tools - in exact order from screenshot
  const allTools: FABTool[] = [
    // RED/CORAL ICONS (Primary Color)
    {
      id: "parcel-search",
      icon: PlaceIcon,
      tooltip: "Wyszukiwanie działek",
      onClick: () => console.log("Parcel search"),
      color: 'primary',
      authRequired: true, // Hidden for guests
    },
    {
      id: "edit",
      icon: EditIcon,
      tooltip: "Edycja",
      onClick: () => console.log("Edit"),
      color: 'primary',
      authRequired: true, // Hidden for guests
    },
    {
      id: "geometry-tools",
      icon: ArchitectureIcon,
      tooltip: "Narzędzia geometrii",
      onClick: () => console.log("Geometry tools"),
      color: 'primary',
      authRequired: true, // Hidden for guests
    },
    {
      id: "measure",
      icon: StraightenIcon,
      tooltip: "Mierzenie",
      onClick: () => setMeasurementModalOpen(true),
      active: measurement.isDistanceMode || measurement.isAreaMode,
      color: 'primary',
      authRequired: true, // Hidden for guests
    },
    {
      id: "search",
      icon: SearchIcon,
      tooltip: "Wyszukiwanie",
      onClick: () => setSearchModalOpen(true),
      color: 'primary',
      // authRequired: false - Visible for guests
    },

    // WHITE ICONS (Default Color)
    {
      id: "identify",
      icon: InfoIcon,
      tooltip: "Identyfikacja obiektu",
      onClick: handleIdentify,
      active: identify.isActive,
      color: 'default',
      // authRequired: false - Visible for guests
    },
    // Zoom to Selected Feature (only shown when feature is selected)
    ...(selectedFeature ? [{
      id: "zoom-to-selected",
      icon: CenterFocusStrongIcon,
      tooltip: `Przybliż do zaznaczonego: ${selectedFeature.name}`,
      onClick: handleZoomToSelected,
      color: 'success' as const,
      // authRequired: false - Visible for guests
    }] : []),
    {
      id: "print",
      icon: PrintIcon,
      tooltip: "Drukuj / Eksportuj PDF",
      onClick: handlePDFExport,
      color: 'default',
      authRequired: true, // Hidden for guests
    },
    {
      id: "map-layers",
      icon: MapIcon,
      tooltip: "Warstwy mapy",
      onClick: () => console.log("Map layers"),
      color: 'default',
      authRequired: true, // Hidden for guests
    },
    {
      id: "crop-mask",
      icon: CropIcon,
      tooltip: "Przycinanie do maski",
      onClick: handleAreaMeasure,
      active: measurement.isAreaMode,
      color: 'default',
      authRequired: true, // Hidden for guests
    },
    {
      id: "keyboard",
      icon: KeyboardIcon,
      tooltip: "Skróty klawiszowe",
      onClick: () => console.log("Keyboard shortcuts"),
      color: 'default',
      authRequired: true, // Hidden for guests
    },
    {
      id: "contact",
      icon: EmailIcon,
      tooltip: "Kontakt",
      onClick: () => console.log("Contact"),
      color: 'default',
      authRequired: true, // Hidden for guests
    },

    // RED/CORAL ICON (Settings at the end)
    {
      id: "settings",
      icon: SettingsIcon,
      tooltip: "Ustawienia",
      onClick: () => console.log("Settings"),
      color: 'primary',
      authRequired: true, // Hidden for guests
    },
  ];

  // Filter tools based on authentication
  const tools = allTools.filter(tool => {
    if (!isAuthenticated && tool.authRequired) {
      return false;
    }
    return true;
  });

  const fabSize = isMobile ? FAB_SIZE_MOBILE : FAB_SIZE;
  const fabSpacing = isMobile ? FAB_SPACING_MOBILE : FAB_SPACING;
  const avatarSize = isMobile ? AVATAR_SIZE_MOBILE : AVATAR_SIZE_DESKTOP;

  return (
    <>
      {/* User Avatar FAB - Always at top */}
      <Tooltip title="Konto użytkownika" placement="left">
        <Fab
          onClick={handleUserMenuOpen}
          size={isMobile ? "medium" : "large"}
          sx={{
            position: 'fixed',
            top: TOP_START,
            right: RIGHT_MARGIN,
            zIndex: 1200,
            bgcolor: 'transparent',
            boxShadow: 2,
            width: avatarSize,
            height: avatarSize,
            minWidth: avatarSize,
            minHeight: avatarSize,
            padding: 0,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: 4,
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          <UserAvatar
            user={user}
            isAuthenticated={isAuthenticated}
            size={avatarSize}
            showIcon={true}
          />
        </Fab>
      </Tooltip>

      {/* Tool FABs - Vertically stacked with scroll */}
      <Box
        sx={{
          position: 'fixed',
          top: TOP_START + avatarSize + fabSpacing * 4, // Extra spacing after User Avatar
          right: RIGHT_MARGIN,
          bottom: 16, // Leave space at bottom
          maxHeight: `calc(100vh - ${TOP_START + avatarSize + fabSpacing * 4 + 16}px)`,
          display: 'flex',
          flexDirection: 'column',
          gap: `${fabSpacing}px`,
          zIndex: 1200,
          overflowY: 'auto', // Enable vertical scroll
          overflowX: 'visible', // Changed from 'hidden' to 'visible' to allow FAB scaling
          paddingLeft: '4px', // Add padding to prevent left clipping
          paddingRight: '4px', // Add padding to prevent right clipping
          marginLeft: '-4px', // Compensate for padding
          marginRight: '-4px', // Compensate for padding
          // Hide scrollbar completely but keep scroll functionality
          scrollbarWidth: 'none', // Firefox
          '&::-webkit-scrollbar': {
            display: 'none', // Chrome, Safari, Edge
          },
          msOverflowStyle: 'none', // IE and Edge legacy
        }}
      >
        {tools.map((tool, index) => {
          const IconComponent = tool.icon;
          const isActive = tool.active;
          const isPrimary = tool.color === 'primary';
          const isSuccess = tool.color === 'success';

          // Add larger spacing after "crop-mask" icon (before keyboard section)
          const isCropIcon = tool.id === 'crop-mask';
          const marginBottom = isCropIcon ? `${fabSpacing * 3}px` : 0;

          return (
            <Tooltip key={tool.id} title={tool.tooltip} placement="left">
              <span>
                <Fab
                  onClick={tool.onClick}
                  disabled={tool.disabled}
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    width: fabSize,
                    height: fabSize,
                    minHeight: fabSize,
                    marginBottom: marginBottom, // Extra spacing after Search
                    bgcolor: isActive
                      ? theme.palette.primary.main
                      : isPrimary
                        ? theme.palette.primary.main
                        : isSuccess
                          ? theme.palette.success.main
                          : 'background.paper',
                    color: isActive
                      ? 'white'
                      : isPrimary
                        ? 'white'
                        : isSuccess
                          ? 'white'
                          : 'text.secondary',
                    boxShadow: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isActive
                        ? theme.palette.primary.dark
                        : isPrimary
                          ? theme.palette.primary.dark
                          : isSuccess
                            ? theme.palette.success.dark
                            : 'action.hover',
                      transform: 'scale(1.05)',
                      boxShadow: 4,
                    },
                    '&:active': {
                      transform: 'scale(0.95)',
                      boxShadow: 1,
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'action.disabledBackground',
                      color: 'action.disabled',
                    },
                  }}
                >
                  <IconComponent sx={{ fontSize: isMobile ? 18 : 24 }} />
                </Fab>
              </span>
            </Tooltip>
          );
        })}
      </Box>

      {/* Measurement info tooltip */}
      {(measurement.isDistanceMode || measurement.isAreaMode) && (
        <Box
          sx={{
            position: "fixed",
            top: TOP_START + fabSize * 6 + FAB_SPACING * 7, // Approximate position near measurement FAB
            right: RIGHT_MARGIN + fabSize + 12,
            bgcolor: "background.paper",
            color: "text.primary",
            p: 1.5,
            borderRadius: 1,
            boxShadow: 3,
            minWidth: 140,
            fontSize: "0.75rem",
            border: 1,
            borderColor: 'divider',
            zIndex: 1300,
          }}
        >
          {measurement.isDistanceMode && "Kliknij punkty na mapie"}
          {measurement.isAreaMode && "Kliknij punkty obszaru"}
        </Box>
      )}

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 240,
              mt: 1,
            }
          }
        }}
      >
        {isAuthenticated && user ? [
            <Box key="header" sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <UserAvatar
                  user={user}
                  isAuthenticated={true}
                  size={40}
                  showIcon={true}
                />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </Box>,

            <Divider key="divider-1" />,

            <MenuItem key="dashboard" onClick={handleGoToDashboard}>
              <ListItemIcon>
                <HomeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Dashboard</ListItemText>
            </MenuItem>,

            <MenuItem key="settings" onClick={handleUserMenuClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Ustawienia konta</ListItemText>
            </MenuItem>,

            <Divider key="divider-2" />,

            <MenuItem key="logout" onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>Wyloguj się</ListItemText>
            </MenuItem>
        ] : [
            <Box key="header" sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <UserAvatar
                  user={null}
                  isAuthenticated={false}
                  size={40}
                  showIcon={true}
                />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    Gość
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Niezalogowany
                  </Typography>
                </Box>
              </Box>
            </Box>,

            <Divider key="divider-1" />,

            <MenuItem key="login" onClick={handleLogin}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ transform: 'scaleX(-1)' }} />
              </ListItemIcon>
              <ListItemText>Zaloguj się</ListItemText>
            </MenuItem>,
            <MenuItem key="register" onClick={handleRegister}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              <ListItemText>Zarejestruj się</ListItemText>
            </MenuItem>,
            <Divider key="divider-2" />,
            <MenuItem key="dashboard" onClick={handleGoToDashboard}>
              <ListItemIcon>
                <HomeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Dashboard</ListItemText>
            </MenuItem>
        ]}
      </Menu>

      {/* Search Modal */}
      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        mapRef={mapRef}
      />

      {/* Measurement Modal */}
      <MeasurementModal
        open={measurementModalOpen}
        onClose={() => setMeasurementModalOpen(false)}
      />

      {/* PDF Export Modal */}
      <ExportPDFModal
        open={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        onExport={handleExportPDF}
      />
    </>
  )
}

export default RightFABToolbar

// Helper functions for geometry bbox calculation

/**
 * Extract all coordinates from GeoJSON geometry (recursive)
 */
function extractCoordinatesFromGeometry(geometry: any): number[][] {
  const coords: number[][] = []

  function extractRecursive(geo: any) {
    if (!geo || !geo.type) return

    switch (geo.type) {
      case 'Point':
        coords.push(geo.coordinates)
        break
      case 'LineString':
      case 'MultiPoint':
        coords.push(...geo.coordinates)
        break
      case 'Polygon':
        // First ring (outer boundary)
        coords.push(...geo.coordinates[0])
        break
      case 'MultiLineString':
        geo.coordinates.forEach((line: number[][]) => coords.push(...line))
        break
      case 'MultiPolygon':
        geo.coordinates.forEach((polygon: number[][][]) => {
          coords.push(...polygon[0]) // Outer ring of each polygon
        })
        break
      case 'GeometryCollection':
        geo.geometries.forEach(extractRecursive)
        break
    }
  }

  extractRecursive(geometry)
  return coords
}

/**
 * Calculate bounding box from coordinates
 */
function calculateBounds(coords: number[][]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  coords.forEach(([x, y]) => {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  })

  return { minX, minY, maxX, maxY }
}
