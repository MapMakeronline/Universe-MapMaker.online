/**
 * KOMPONENT LOADING CARD - KARTA Z ŁADOWANIEM
 * 
 * Odpowiada za:
 * - Wyświetlanie karty z spinnerem w stylu Material-UI
 * - Loading state dla poszczególnych sekcji aplikacji
 * - Customizowalne komunikaty ładowania
 * - Spójny design z resztą aplikacji
 * - Responsywna karta ładowania
 */
'use client';

import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';

interface LoadingCardProps {
  message?: string;
}

export default function LoadingCard({ message = 'Loading...' }: LoadingCardProps) {
  return (
    <Card>
      <CardContent>
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center"
          py={4}
        >
          <CircularProgress size={40} sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}