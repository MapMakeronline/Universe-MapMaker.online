'use client';

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircle from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Person from '@mui/icons-material/Person';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import Login from '@mui/icons-material/Login';
import Public from '@mui/icons-material/Public';
import ContactMail from '@mui/icons-material/ContactMail';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { clearAuth } from '@/redux/slices/authSlice';

interface PublicNavbarProps {
  title?: string;
  showBackButton?: boolean;
}

export default function PublicNavbar({ title, showBackButton = true }: PublicNavbarProps) {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get auth state from Redux
  const { user, isAuthenticated } = useAppSelector(state => state.auth);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    dispatch(clearAuth());
    router.push('/auth?tab=0');
  };

  const handleLogin = () => {
    handleCloseMenu();
    router.push('/auth?tab=0');
  };

  const handleRegister = () => {
    handleCloseMenu();
    router.push('/auth?tab=1');
  };

  const handleGoToDashboard = () => {
    handleCloseMenu();
    router.push('/dashboard?tab=1');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        {showBackButton && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              position: 'relative',
              bgcolor: 'white',
              p: 0.5,
              cursor: 'pointer'
            }}
            onClick={() => router.push('/')}
          >
            <Image
              src="/logo2.svg"
              alt="MapMaker Logo"
              width={32}
              height={32}
              style={{ objectFit: 'contain' }}
              priority
            />
          </Box>
          <Typography
            variant="h6"
            component="div"
            fontWeight="600"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {title || 'MapMaker'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Navigation links - hidden on mobile */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, mr: 2 }}>
            <Typography
              component="a"
              href="/blog"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                fontSize: '14px',
                opacity: 0.8,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 1,
                  textDecoration: 'underline',
                },
              }}
            >
              Blog
            </Typography>
            <Typography
              component="a"
              href="/regulamin"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                fontSize: '14px',
                opacity: 0.8,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 1,
                  textDecoration: 'underline',
                },
              }}
            >
              Regulamin
            </Typography>
            <Typography
              component="a"
              href="/faq"
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                fontSize: '14px',
                opacity: 0.8,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 1,
                  textDecoration: 'underline',
                },
              }}
            >
              FAQ
            </Typography>
          </Box>

          {/* Dashboard button - only when authenticated */}
          {isAuthenticated && (
            <Button
              variant="contained"
              onClick={() => router.push('/dashboard')}
              sx={{
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              Dashboard
            </Button>
          )}

          {/* User menu */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: isAuthenticated ? '#10b981' : '#f97316',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
            >
              <AccountCircle />
            </Avatar>
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
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
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Dashboard</ListItemText>
              </MenuItem>,

              <Divider key="divider-2" />,

              <MenuItem key="logout" onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText>Wyloguj</ListItemText>
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
                  <Login fontSize="small" />
                </ListItemIcon>
                <ListItemText>Zaloguj się</ListItemText>
              </MenuItem>,
              <MenuItem key="register" onClick={handleRegister}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                <ListItemText>Zarejestruj się</ListItemText>
              </MenuItem>,
            ]}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
