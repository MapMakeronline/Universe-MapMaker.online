'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItemButton, ListItemText, Paper, Fab, Zoom } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface Section {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  sections: Section[];
}

export default function TableOfContents({ sections }: TableOfContentsProps) {
  const theme = useTheme();
  const [activeSection, setActiveSection] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show back-to-top button after scrolling 300px
      setShowBackToTop(window.scrollY > 300);

      // Determine active section
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id),
      }));

      const scrollPosition = window.scrollY + 100;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const { id, element } = sectionElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for navbar height
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Table of Contents - Sticky sidebar */}
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          top: 100,
          p: 2,
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
          display: { xs: 'none', md: 'block' },
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'grey.100',
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'grey.400',
            borderRadius: '3px',
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Spis treści
        </Typography>
        <List dense>
          {sections.map((section) => (
            <ListItemButton
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              selected={activeSection === section.id}
              sx={{
                pl: section.level * 2,
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  },
                },
              }}
            >
              <ListItemText
                primary={section.title}
                primaryTypographyProps={{
                  fontSize: section.level === 1 ? '0.875rem' : '0.8125rem',
                  fontWeight: activeSection === section.id ? 600 : 400,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      {/* Back to top button */}
      <Zoom in={showBackToTop}>
        <Fab
          size="medium"
          color="primary"
          onClick={scrollToTop}
          sx={{
            position: 'fixed',
            bottom: { xs: 16, md: 32 },
            right: { xs: 16, md: 32 },
            zIndex: 1000,
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </>
  );
}
