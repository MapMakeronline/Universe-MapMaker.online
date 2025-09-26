"use client"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
} from "@mui/material"
import { KEYBOARD_SHORTCUTS } from "@/src/lib/accessibility"

interface HelpDialogProps {
  open: boolean
  onClose: () => void
}

const shortcuts = [
  {
    key: KEYBOARD_SHORTCUTS.HELP,
    description: "Pokaż tę pomoc",
  },
  {
    key: KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR,
    description: "Przełącz panel warstw",
  },
  {
    key: KEYBOARD_SHORTCUTS.FOCUS_SEARCH,
    description: "Fokus na wyszukiwanie",
  },
  {
    key: KEYBOARD_SHORTCUTS.ESCAPE,
    description: "Zamknij dialog/anuluj",
  },
]

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="help-dialog-title">
      <DialogTitle id="help-dialog-title">Skróty klawiszowe</DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Użyj tych skrótów, aby szybciej poruszać się po aplikacji:
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {shortcuts.map(({ key, description }) => (
            <Box
              key={key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 0.5,
              }}
            >
              <Typography variant="body2">{description}</Typography>
              <Chip
                label={key}
                size="small"
                variant="outlined"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  minWidth: "32px",
                }}
              />
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary">
          <strong>Wskazówka:</strong> Skróty działają tylko gdy nie edytujesz tekstu.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Zamknij
        </Button>
      </DialogActions>
    </Dialog>
  )
}
