'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const categories = [
  'Podstawy',
  'Projekty',
  'Warstwy i Mapy',
  'Narzędzia',
  'Problemy techniczne',
  'Bezpieczeństwo'
];

const initialFAQ: FAQItem[] = [
  {
    id: '1',
    question: 'Czym jest Universe MapMaker?',
    answer: 'Universe MapMaker to zaawansowana platforma do tworzenia interaktywnych map GIS.',
    category: 'Podstawy'
  },
  {
    id: '2',
    question: 'Jak utworzyć nowy projekt?',
    answer: 'W panelu Dashboard kliknij przycisk "+ Nowy Projekt".',
    category: 'Projekty'
  },
];

export default function FAQEditor() {
  const theme = useTheme();
  const [faqItems, setFaqItems] = useState<FAQItem[]>(initialFAQ);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
  const [formData, setFormData] = useState<Partial<FAQItem>>({});

  const handleOpenDialog = (item?: FAQItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        question: '',
        answer: '',
        category: 'Podstawy',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = () => {
    if (editingItem) {
      // Update existing item
      setFaqItems(faqItems.map(item =>
        item.id === editingItem.id ? { ...formData as FAQItem } : item
      ));
    } else {
      // Create new item
      const newItem: FAQItem = {
        id: Date.now().toString(),
        ...formData as FAQItem,
      };
      setFaqItems([...faqItems, newItem]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć to pytanie?')) {
      setFaqItems(faqItems.filter(item => item.id !== id));
    }
  };

  // Group FAQ by category
  const groupedFAQ = categories.map(category => ({
    category,
    items: faqItems.filter(item => item.category === category)
  })).filter(group => group.items.length > 0);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Pytania FAQ ({faqItems.length})</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark }
          }}
        >
          Dodaj Pytanie
        </Button>
      </Box>

      {/* FAQ List grouped by category */}
      {groupedFAQ.map((group) => (
        <Accordion key={group.category} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {group.category} ({group.items.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {group.items.map((item) => (
                <ListItem
                  key={item.id}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {item.question}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {item.answer.substring(0, 150)}
                        {item.answer.length > 150 ? '...' : ''}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleOpenDialog(item)} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(item.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {faqItems.length === 0 && (
        <Alert severity="info">
          Brak pytań FAQ. Kliknij "Dodaj Pytanie" aby utworzyć pierwsze pytanie.
        </Alert>
      )}

      {/* Edit/Create Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            maxWidth: '800px',
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#4a5568', color: 'white', fontWeight: 600 }}>
          {editingItem ? 'Edytuj Pytanie' : 'Nowe Pytanie'}
        </DialogTitle>

        <DialogContent sx={{ bgcolor: '#f7f9fc', pt: 3 }}>
          <TextField
            fullWidth
            label="Pytanie"
            value={formData.question || ''}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Odpowiedź"
            value={formData.answer || ''}
            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
            multiline
            rows={6}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            select
            label="Kategoria"
            value={formData.category || 'Podstawy'}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ bgcolor: '#f7f9fc', p: 2 }}>
          <Button onClick={handleCloseDialog}>Anuluj</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark }
            }}
          >
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>

      <Alert severity="warning" sx={{ mt: 3 }}>
        <strong>Uwaga:</strong> Zmiany są obecnie tylko lokalne (w pamięci przeglądarki).
        Aby zapisać trwale, potrzebna jest integracja z API lub plikami JSON.
      </Alert>
    </Box>
  );
}
