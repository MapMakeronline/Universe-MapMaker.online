"use client"

import type React from "react"
import { useState } from "react"
import { useMap } from 'react-map-gl'
import { Paper, IconButton, Tooltip, Box, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Typography, Avatar } from "@mui/material"
import {
  LocationSearching,
  Edit,
  Category,
  Straighten,
  Search,
  Info,
  PictureAsPdf,
  Description,
  MyLocation,
  Crop,
  Keyboard,
  Email,
  Settings,
  Map,
  AccountCircle,
  Logout,
  Home,
  Person,
  Public,
  ContactMail,
  Apartment,
} from "@mui/icons-material"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setMeasurementMode, clearAllMeasurements, setIdentifyMode } from "@/store/slices/drawSlice"
import SearchModal from "@/components/map/SearchModal"
import MeasurementModal from "@/components/panels/MeasurementModal"
import ExportPDFModal, { type ExportConfig } from "@/components/panels/ExportPDFModal"

const TOOLBAR_WIDTH = 56

const RightToolbar: React.FC = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { current: map } = useMap()
  const { measurement, identify } = useAppSelector((state) => state.draw)
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

  const handleDistanceMeasure = () => {
    dispatch(
      setMeasurementMode({
        distance: !measurement.isDistanceMode,
        area: false,
      }),
    )
  }

  const handleAreaMeasure = () => {
    dispatch(
      setMeasurementMode({
        distance: false,
        area: !measurement.isAreaMode,
      }),
    )
  }

  const handleClearMeasurements = () => {
    dispatch(clearAllMeasurements())
  }

  const handlePDFExport = () => {
    setPdfModalOpen(true)
  }

  const handleExportPDF = async (config: ExportConfig) => {
    // TODO: Implement PDF export - needs access to map instance
    console.log('PDF Export requested with config:', config)
    alert('Funkcja eksportu PDF będzie dostępna wkrótce!')
  }

  const handleAddMarker = () => {
    // TODO: Implement marker adding
    console.log("Add marker feature coming soon...")
  }

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
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
    // TODO: Implement actual logout logic
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
    dispatch(setIdentifyMode(!identify.isActive))
  }

  const handleGeolocation = () => {
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

  interface Tool {
    id: string;
    icon?: any;
    tooltip?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => void;
    active?: boolean;
    disabled?: boolean;
  }

  // Tools requiring authentication
  const authRequiredTools = ["parcel-search", "edit", "geometry-tools", "document", "crop-mask"];

  const allTools: Tool[] = [
    { id: "divider-1" },
    {
      id: "parcel-search",
      icon: LocationSearching,
      tooltip: "Wyszukiwanie działek",
      onClick: handleAddMarker,
      active: false,
    },
    {
      id: "edit",
      icon: Edit,
      tooltip: "Edycja",
      onClick: () => console.log("Edit"),
      active: false,
    },
    {
      id: "geometry-tools",
      icon: Category,
      tooltip: "Narzędzia geometrii",
      onClick: () => console.log("Walking route"),
      active: false,
    },
    {
      id: "measure-distance",
      icon: Straighten,
      tooltip: "Mierzenie",
      onClick: () => setMeasurementModalOpen(true),
      active: measurement.isDistanceMode || measurement.isAreaMode,
    },
    {
      id: "search",
      icon: Search,
      tooltip: "Wyszukiwanie",
      onClick: () => setSearchModalOpen(true),
      active: false,
    },
    {
      id: "identify",
      icon: Info,
      tooltip: "Identyfikacja obiektu (także budynki 3D)",
      onClick: handleIdentify,
      active: identify.isActive,
    },
    {
      id: "export-pdf",
      icon: PictureAsPdf,
      tooltip: "Eksportuj mapę do PDF",
      onClick: handlePDFExport,
      active: false,
    },
    {
      id: "document",
      icon: Description,
      tooltip: "Wypis i wyrys",
      onClick: () => console.log("Document"),
      active: false,
    },
    {
      id: "geolocation",
      icon: MyLocation,
      tooltip: "Moja lokalizacja",
      onClick: handleGeolocation,
      active: false,
    },
    {
      id: "crop-mask",
      icon: Crop,
      tooltip: "Przycinanie do maski",
      onClick: handleAreaMeasure,
      active: measurement.isAreaMode,
    },
    {
      id: "keyboard-shortcuts",
      icon: Keyboard,
      tooltip: "Skróty klawiszowe",
      onClick: () => console.log("Keyboard shortcuts"),
      active: false,
    },
    { id: "divider-2" },
    {
      id: "contact",
      icon: Email,
      tooltip: "Kontakt",
      onClick: () => console.log("Contact"),
      active: false,
    },
    {
      id: "settings",
      icon: Settings,
      tooltip: "Ustawienia",
      onClick: () => console.log("Settings"),
      active: false,
    },
  ]

  // Filter tools based on authentication
  const tools = allTools.filter(tool => {
    if (tool.id?.startsWith('divider')) return true;
    if (!isAuthenticated && authRequiredTools.includes(tool.id!)) {
      return false;
    }
    return true;
  });

  return (
    <>
      <Paper
        elevation={2}
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          width: TOOLBAR_WIDTH,
          maxHeight: "calc(100vh - 32px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 1,
          zIndex: 1200,
          borderRadius: 1,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "action.hover",
            borderRadius: "4px",
            "&:hover": {
              background: "action.selected",
            },
          },
        }}
      >
        {/* User Avatar */}
        <Tooltip title="Konto użytkownika" placement="left">
          <IconButton
            onClick={handleUserMenuOpen}
            size="small"
            sx={{
              width: 40,
              height: 40,
              my: 0.5,
              p: 0,
            }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: isAuthenticated ? '#10b981' : '#f97316',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
            >
              <AccountCircle sx={{ fontSize: 24 }} />
            </Avatar>
          </IconButton>
        </Tooltip>

        {tools.map((tool, index) => {
          if (tool.id.startsWith("divider")) {
            return (
              <Divider
                key={tool.id}
                sx={{
                  width: "100%",
                  my: 0.5,
                }}
              />
            )
          }

          const IconComponent = tool.icon!

          return (
            <Tooltip key={tool.id} title={tool.tooltip} placement="left">
              <span>
                <IconButton
                  onClick={event => tool.onClick?.(event)}
                  disabled={tool.disabled}
                  size="small"
                  sx={{
                    width: 40,
                    height: 40,
                    my: 0.5,
                    borderRadius: 1,
                    backgroundColor: tool.active ? 'primary.main' : 'transparent',
                    color: tool.active ? 'primary.contrastText' : 'text.secondary',
                    '&:hover': {
                      backgroundColor: tool.active ? 'primary.dark' : 'action.hover',
                    },
                  }}
                >
                  <IconComponent sx={{ fontSize: 20 }} />
                </IconButton>
              </span>
            </Tooltip>
          )
        })}

        {/* Measurement info */}
        {(measurement.isDistanceMode || measurement.isAreaMode) && (
          <Box
            sx={{
              position: "absolute",
              right: "100%",
              top: 0,
              mr: 1,
              bgcolor: "background.paper",
              color: "text.primary",
              p: 1.5,
              borderRadius: 1,
              boxShadow: 2,
              minWidth: 140,
              fontSize: "0.75rem",
              border: 1,
              borderColor: 'divider',
            }}
          >
            {measurement.isDistanceMode && "Kliknij punkty na mapie"}
            {measurement.isAreaMode && "Kliknij punkty obszaru"}
          </Box>
        )}
      </Paper>

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
                <AccountCircle sx={{ fontSize: 40, color: '#10b981' }} />
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
                <Home fontSize="small" />
              </ListItemIcon>
              <ListItemText>Dashboard</ListItemText>
            </MenuItem>,

            <MenuItem key="settings" onClick={handleUserMenuClose}>
              <ListItemIcon>
                <Settings fontSize="small" />
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
                <AccountCircle sx={{ fontSize: 40, color: '#f97316' }} />
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
                <Home fontSize="small" />
              </ListItemIcon>
              <ListItemText>Dashboard</ListItemText>
            </MenuItem>
        ]}
      </Menu>

      {/* Search Modal */}
      <SearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
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

export default RightToolbar