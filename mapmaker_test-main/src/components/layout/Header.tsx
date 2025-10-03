/**
 * KOMPONENT HEADER - NAGŁÓWEK APLIKACJI
 * 
 * Odpowiada za:
 * - Górny pasek nawigacyjny aplikacji
 * - Logo i tytuł aplikacji MapMaker
 * - Menu nawigacyjne (jeśli aplikacja ma więcej stron)
 * - Przycisk logowania/profilu użytkownika
 * - Responsywny header dla mobile i desktop
 * - Breadcrumbs i akcje kontekstowe
 */
'use client';

import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'MapMaker Test' }: HeaderProps) {
  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <HomeIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit">Home</Button>
          <Button color="inherit">About</Button>
          <Button color="inherit">Contact</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}