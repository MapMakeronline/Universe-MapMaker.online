"use client"

import type React from "react"
import { useState } from "react"
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import Fab from '@mui/material/Fab'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import AccountCircle from '@mui/icons-material/AccountCircle'
import Home from '@mui/icons-material/Home'
import Settings from '@mui/icons-material/Settings'
import Logout from '@mui/icons-material/Logout'
import Person from '@mui/icons-material/Person'
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"

const UserFAB: React.FC = () => {
  const theme = useTheme()
  const router = useRouter()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)

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

  const fabRightPosition = isMobile ? '16px' : '24px'

  return (
    <>
      {/* User FAB */}
      <Fab
        onClick={handleUserMenuOpen}
        sx={{
          position: 'fixed',
          bottom: 220, // Najwyżej - nad QGIS Identify (150px) i MobileFAB
          right: fabRightPosition,
          zIndex: 1400,
          width: isMobile ? 64 : 56,
          height: isMobile ? 64 : 56,
          bgcolor: isAuthenticated ? '#10b981' : '#f97316',
          color: 'white',
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: isAuthenticated ? '#059669' : '#ea580c',
            transform: 'scale(1.05)',
          },
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <AccountCircle sx={{ fontSize: isMobile ? 36 : 28 }} />
      </Fab>

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
          vertical: "bottom",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 240,
              mb: 1,
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
    </>
  )
}

export default UserFAB
