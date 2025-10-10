'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Alert,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SaveIcon from '@mui/icons-material/Save';
import PreviewIcon from '@mui/icons-material/Preview';

interface RegulaminSection {
  id: number;
  title: string;
  content: string;
}

const initialSections: RegulaminSection[] = [
  {
    id: 1,
    title: 'Postanowienia ogólne',
    content: 'Niniejszy regulamin określa zasady korzystania z platformy Universe MapMaker...'
  },
  {
    id: 2,
    title: 'Definicje',
    content: 'Użytkownik - osoba fizyczna lub prawna korzystająca z Platformy...'
  },
  {
    id: 3,
    title: 'Rejestracja i konto użytkownika',
    content: 'Aby korzystać z pełnej funkcjonalności Platformy, Użytkownik musi utworzyć konto...'
  },
];

export default function RegulaminEditor() {
  const theme = useTheme();
  const [sections, setSections] = useState<RegulaminSection[]>(initialSections);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [contactEmail, setContactEmail] = useState<string>('kontakt@universemapmaker.online');
  const [previewMode, setPreviewMode] = useState(false);

  const handleSectionChange = (id: number, field: 'title' | 'content', value: string) => {
    setSections(sections.map(section =>
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const handleAddSection = () => {
    const newId = Math.max(...sections.map(s => s.id), 0) + 1;
    setSections([...sections, {
      id: newId,
      title: `Sekcja ${newId}`,
      content: 'Treść nowej sekcji...'
    }]);
  };

  const handleRemoveSection = (id: number) => {
    if (confirm('Czy na pewno chcesz usunąć tę sekcję?')) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const handleSave = () => {
    // TODO: Save to database or JSON file
    alert('Regulamin zapisany! (obecnie tylko lokalnie)');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">
          {previewMode ? 'Podgląd Regulaminu' : 'Edycja Regulaminu'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Tryb Edycji' : 'Podgląd'}
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            Zapisz Regulamin
          </Button>
        </Box>
      </Box>

      {/* Metadata */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#f7f9fc' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Metadane Regulaminu
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            fullWidth
            label="Data ostatniej aktualizacji"
            type="date"
            value={lastUpdate}
            onChange={(e) => setLastUpdate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={previewMode}
          />
          <TextField
            fullWidth
            label="Email kontaktowy"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            disabled={previewMode}
          />
        </Box>
      </Paper>

      {/* Sections */}
      {previewMode ? (
        // Preview Mode
        <Paper sx={{ p: 5 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mb: 2 }}>
            Regulamin Universe MapMaker
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary', mb: 4 }}>
            Ostatnia aktualizacja: {new Date(lastUpdate).toLocaleDateString('pl-PL')}
          </Typography>
          <Divider sx={{ mb: 4 }} />

          {sections.map((section) => (
            <Box key={section.id} sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                {section.id}. {section.title}
              </Typography>
              <Typography
                variant="body1"
                paragraph
                sx={{ color: 'text.secondary', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
              >
                {section.content}
              </Typography>
            </Box>
          ))}

          <Divider sx={{ my: 4 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Kontakt
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              W razie pytań dotyczących regulaminu prosimy o kontakt:
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.primary.main, mt: 1 }}>
              {contactEmail}
            </Typography>
          </Box>
        </Paper>
      ) : (
        // Edit Mode
        <>
          {sections.map((section, index) => (
            <Paper key={section.id} sx={{ p: 3, mb: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Sekcja {section.id}
                </Typography>
                {sections.length > 1 && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => handleRemoveSection(section.id)}
                  >
                    Usuń
                  </Button>
                )}
              </Box>

              <TextField
                fullWidth
                label="Tytuł sekcji"
                value={section.title}
                onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Treść sekcji"
                value={section.content}
                onChange={(e) => handleSectionChange(section.id, 'content', e.target.value)}
                multiline
                rows={6}
                helperText="Możesz używać prostego formatowania. Nowe linie będą zachowane."
              />
            </Paper>
          ))}

          <Button
            variant="outlined"
            onClick={handleAddSection}
            fullWidth
            sx={{ mt: 2, py: 1.5 }}
          >
            + Dodaj Nową Sekcję
          </Button>
        </>
      )}

      <Alert severity="warning" sx={{ mt: 3 }}>
        <strong>Uwaga:</strong> Zmiany są obecnie tylko lokalne (w pamięci przeglądarki).
        Aby zapisać trwale, potrzebna jest integracja z API lub plikami JSON.
      </Alert>

      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>Wskazówka:</strong> Po zapisaniu, regulamin będzie dostępny pod adresem{' '}
        <code>/regulamin</code>
      </Alert>
    </Box>
  );
}
