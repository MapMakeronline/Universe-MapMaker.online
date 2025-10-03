/**
 * KOMPONENT ERROR STATE - STAN BŁĘDU
 * 
 * Odpowiada za:
 * - Wyświetlanie komunikatów o błędach w przyjazny sposób
 * - Przycisk "Spróbuj ponownie" do retry operacji
 * - Różne typy błędów (network, API, validation)
 * - Responsywny design komunikatów błędów
 * - Ikony i kolory sygnalizujące typ błędu
 * - Fallback UI gdy coś pójdzie nie tak
 */

import { Box, Typography, IconButton } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

// ===================================================================
// INTERFACE PROPS - Właściwości komponentu
// ===================================================================
interface ErrorStateProps {
  error: string;           // Wiadomość błędu do wyświetlenia
  onRetry?: () => void;    // Opcjonalna funkcja do ponownej próby
}

// ===================================================================
// KOMPONENT STANU BŁĘDU
// ===================================================================
// Wyświetla sformatowany komunikat błędu z ikoną i opcjonalnym przyciskiem retry
export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',                    // Elementy jeden pod drugim
        alignItems: 'center',                       // Wycentrowanie poziome
        justifyContent: 'center',                   // Wycentrowanie pionowe
        p: 3,                                       // Padding
        gap: 2,                                     // Odstęp między elementami
        bgcolor: 'rgba(244, 67, 54, 0.1)',        // Jasne czerwone tło (10% opacity)
        border: '1px solid rgba(244, 67, 54, 0.3)', // Czerwona ramka (30% opacity)
        borderRadius: '4px',                        // Zaokrąglone rogi
        mx: 1,                                      // Margines poziomy
        my: 2                                       // Margines pionowy
      }}
    >
      {/* Ikona błędu */}
      <ErrorIcon sx={{ color: '#f44336', fontSize: '24px' }} />
      
      {/* Tekst błędu */}
      <Typography
        sx={{
          color: '#f44336',        // Czerwony kolor tekstu
          fontSize: '11px',        // Mały rozmiar czcionki
          textAlign: 'center',     // Wycentrowany tekst
          wordBreak: 'break-word'  // Łamanie długich słów
        }}
      >
        {error}
      </Typography>
      
      {/* Przycisk ponownej próby (jeśli funkcja onRetry jest podana) */}
      {onRetry && (
        <IconButton
          size="small"
          onClick={onRetry}
          sx={{
            color: '#4fc3f7',                          // Jasnoniebieski kolor
            fontSize: '12px',
            '&:hover': {                               // Efekt hover
              bgcolor: 'rgba(79, 195, 247, 0.1)'     // Jasne niebieskie tło
            }
          }}
        >
          <RefreshIcon sx={{ fontSize: '16px' }} />
        </IconButton>
      )}
    </Box>
  );
};