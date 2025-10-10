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
  Chip,
  MenuItem,
  Alert,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: string;
  slug: string;
}

// Initial blog posts data
const initialPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Jak stworzyć pierwszą mapę w Universe MapMaker',
    excerpt: 'Przewodnik krok po kroku do stworzenia Twojej pierwszej interaktywnej mapy za pomocą naszej platformy.',
    content: '# Wprowadzenie\n\nTworzenie interaktywnych map nigdy nie było prostsze!...',
    date: '2024-03-15',
    author: 'Jan Kowalski',
    category: 'Tutorial',
    slug: 'jak-stworzyc-pierwsza-mape',
  },
  {
    id: 2,
    title: 'Nowości w Universe MapMaker - wersja 2.0',
    excerpt: 'Poznaj najnowsze funkcje dodane do platformy, w tym ulepszone narzędzia rysowania i 3D.',
    content: '# Universe MapMaker 2.0 - Co nowego?\n\nZ przyjemnością ogłaszamy...',
    date: '2024-03-10',
    author: 'Anna Nowak',
    category: 'Aktualności',
    slug: 'nowosci-wersja-2-0',
  },
];

const categories = ['Tutorial', 'Aktualności', 'Poradnik', 'Case Study', 'Technologia'];

export default function BlogEditor() {
  const theme = useTheme();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<Partial<BlogPost>>({});

  const handleOpenDialog = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData(post);
    } else {
      setEditingPost(null);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        author: '',
        category: 'Tutorial',
        slug: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPost(null);
    setFormData({});
  };

  const handleSave = () => {
    if (editingPost) {
      // Update existing post
      setPosts(posts.map(p => p.id === editingPost.id ? { ...formData as BlogPost } : p));
    } else {
      // Create new post
      const newPost: BlogPost = {
        id: Math.max(...posts.map(p => p.id), 0) + 1,
        ...formData as BlogPost,
      };
      setPosts([...posts, newPost]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: number) => {
    if (confirm('Czy na pewno chcesz usunąć ten artykuł?')) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Artykuły Bloga ({posts.length})</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: theme.palette.primary.main,
            '&:hover': { bgcolor: theme.palette.primary.dark }
          }}
        >
          Nowy Artykuł
        </Button>
      </Box>

      <List>
        {posts.map((post) => (
          <ListItem
            key={post.id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              mb: 2,
              bgcolor: 'background.paper'
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h6" component="span">
                    {post.title}
                  </Typography>
                  <Chip
                    label={post.category}
                    size="small"
                    sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {post.excerpt}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Autor: {post.author} | Data: {post.date} | Slug: /{post.slug}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handleOpenDialog(post)} sx={{ mr: 1 }}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" onClick={() => handleDelete(post.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      {/* Edit/Create Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            maxWidth: '900px',
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#4a5568', color: 'white', fontWeight: 600 }}>
          {editingPost ? 'Edytuj Artykuł' : 'Nowy Artykuł'}
        </DialogTitle>

        <DialogContent sx={{ bgcolor: '#f7f9fc', pt: 3 }}>
          <TextField
            fullWidth
            label="Tytuł artykułu"
            value={formData.title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="URL Slug (automatyczny)"
            value={formData.slug || ''}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            helperText="Zostanie wygenerowany automatycznie z tytułu"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Krótki opis (excerpt)"
            value={formData.excerpt || ''}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Treść artykułu (Markdown)"
            value={formData.content || ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            multiline
            rows={12}
            sx={{ mb: 2, fontFamily: 'monospace' }}
            helperText="Użyj składni Markdown: # Nagłówek, ## Podtytuł, **pogrubienie**, - lista"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Autor"
              value={formData.author || ''}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />

            <TextField
              fullWidth
              label="Data publikacji"
              type="date"
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            fullWidth
            select
            label="Kategoria"
            value={formData.category || 'Tutorial'}
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
