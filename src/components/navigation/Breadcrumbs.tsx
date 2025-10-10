'use client';

import React from 'react';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 3 }}>
      <MuiBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
        aria-label="breadcrumb"
      >
        <Link
          href="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            textDecoration: 'none',
            fontSize: '0.875rem',
            '&:hover': {
              color: theme.palette.primary.main,
            },
          }}
        >
          <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
          Strona główna
        </Link>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return isLast ? (
            <Typography
              key={item.label}
              sx={{
                color: 'text.primary',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {item.label}
            </Typography>
          ) : (
            <Link
              key={item.label}
              href={item.href || '#'}
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: theme.palette.primary.main,
                },
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}
