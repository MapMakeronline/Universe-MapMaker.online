'use client';

import React, { useState, ReactNode } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Menu as MenuIcon,
  Home,
  Public,
  Person,
  Settings,
  Payments,
  ContactMail,
  AccountCircle,
  Logout,
  ChevronLeft,
  Dashboard as DashboardIcon,
  Login,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '@/redux/hooks';
import { clearAuth } from '@/redux/slices/authSlice';

const drawerWidth = 280;

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'own', label: 'Własne', icon: <Home /> },
  { id: 'public', label: 'Publiczne', icon: <Public /> },
  { id: 'profile', label: 'Profil', icon: <Person /> },
  { id: 'settings', label: 'Ustawienia', icon: <Settings /> },
  { id: 'payments', label: 'Płatności', icon: <Payments /> },
  { id: 'contact', label: 'Kontakt', icon: <ContactMail /> },
];

export default function DashboardLayout({ children, currentPage, onPageChange }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Get auth state from Redux
  const { user, isAuthenticated } = useAppSelector(state => state.auth);

  // Check if user is admin
  const isAdmin = user?.email?.includes('@universemapmaker.online') || user?.username === 'admin';

  const open = isMobile ? mobileOpen : desktopOpen;

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDesktopOpen(!desktopOpen);
    }
  };

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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { md: desktopOpen ? `${drawerWidth}px` : 0 },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            {open && !isMobile ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>

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
              }}
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
            <Typography variant="h6" component="div" fontWeight="600" sx={{ display: { xs: 'none', sm: 'block' } }}>
              MapMaker
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Footer links in header - hidden on mobile */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, mr: 2 }}>
              <Typography
                component="a"
                href="#"
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  fontSize: '14px',
                  opacity: 0.8,
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
                href="#"
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  fontSize: '14px',
                  opacity: 0.8,
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
                href="#"
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  fontSize: '14px',
                  opacity: 0.8,
                  '&:hover': {
                    opacity: 1,
                    textDecoration: 'underline',
                  },
                }}
              >
                FAQ
              </Typography>
            </Box>

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
                  <MenuItem key="profile" onClick={() => { handleCloseMenu(); onPageChange('profile'); }}>
                    <ListItemIcon>
                      <Person fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Profil</ListItemText>
                  </MenuItem>,
                  <MenuItem key="settings" onClick={() => { handleCloseMenu(); onPageChange('settings'); }}>
                    <ListItemIcon>
                      <Settings fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Ustawienia</ListItemText>
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
                  <Divider key="divider-2" />,
                  <MenuItem key="public" onClick={() => { handleCloseMenu(); onPageChange('public'); }}>
                    <ListItemIcon>
                      <Public fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Projekty publiczne</ListItemText>
                  </MenuItem>,
                  <MenuItem key="contact" onClick={() => { handleCloseMenu(); onPageChange('contact'); }}>
                    <ListItemIcon>
                      <ContactMail fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Kontakt</ListItemText>
                  </MenuItem>
              ]}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
        onClose={isMobile ? handleDrawerToggle : undefined}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            ...(!isMobile && {
              transform: open ? 'translateX(0)' : `translateX(-${drawerWidth}px)`,
              transition: theme.transitions.create('transform', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            }),
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <Typography
            variant="overline"
            sx={{
              px: 3,
              py: 1,
              color: 'text.secondary',
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            PROJEKTY
          </Typography>
          <List sx={{ px: 2 }}>
            {menuItems.slice(0, 2).map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onPageChange(item.id)}
                  selected={currentPage === item.id}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          {isAdmin && (
            <>
              <Typography
                variant="overline"
                sx={{
                  px: 3,
                  py: 1,
                  mt: 2,
                  color: 'text.secondary',
                  fontWeight: 600,
                  letterSpacing: 1,
                }}
              >
                ADMINISTRACJA
              </Typography>
              <List sx={{ px: 2 }}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => onPageChange('admin')}
                    selected={currentPage === 'admin'}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'white',
                        },
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <ListItemIcon>
                      <AdminPanelSettings />
                    </ListItemIcon>
                    <ListItemText
                      primary="Panel Admina"
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                </ListItem>
              </List>
            </>
          )}

          <Typography
            variant="overline"
            sx={{
              px: 3,
              py: 1,
              mt: 2,
              color: 'text.secondary',
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            KONTO
          </Typography>
          <List sx={{ px: 2 }}>
            {menuItems.slice(2, 4).map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onPageChange(item.id)}
                  selected={currentPage === item.id}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Typography
            variant="overline"
            sx={{
              px: 3,
              py: 1,
              mt: 2,
              color: 'text.secondary',
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            MAPMAKER.ONLINE
          </Typography>
          <List sx={{ px: 2 }}>
            {menuItems.slice(4).map((item) => (
              <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onPageChange(item.id)}
                  selected={currentPage === item.id}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 4, px: 2 }}>
            {isAuthenticated ? (
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    color: 'error.main',
                    '& .MuiListItemIcon-root': {
                      color: 'error.main',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText
                  primary="Wyloguj"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItemButton>
            ) : (
              <ListItemButton
                onClick={handleLogin}
                sx={{
                  borderRadius: 2,
                  color: 'text.secondary',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <Logout sx={{ transform: 'scaleX(-1)' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Zaloguj się"
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItemButton>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}