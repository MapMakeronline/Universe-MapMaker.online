/**
 * AttributesPanel - Panel tabeli atrybutów dla warstw WFS
 * Wyświetla dane tabelaryczne z możliwością filtrowania i eksportu
 */

'use client'

import React, { useState, useMemo } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  alpha
} from '@mui/material'
import {
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  TableChart as TableIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'

import { useGetLayerAttributesQuery } from '../../state/layers/layersApi'

interface AttributesPanelProps {
  open: boolean
  layerId: string | null
  layerName?: string
  onClose: () => void
}

interface AttributeRow {
  id: string | number
  [key: string]: any
}

const AttributesPanel: React.FC<AttributesPanelProps> = ({
  open,
  layerId,
  layerName = 'Warstwa',
  onClose
}) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMenu, setFilterMenu] = useState<null | HTMLElement>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  // Fetch attributes data
  const {
    data: rawData = [],
    isLoading,
    error,
    refetch
  } = useGetLayerAttributesQuery(layerId || '', {
    skip: !layerId || !open
  })

  // Mock data for development
  const mockData: AttributeRow[] = [
    {
      id: 1,
      name: 'Warszawa',
      population: 1793579,
      area: 517.24,
      country: 'Polska',
      type: 'Stolica',
      established: '1596'
    },
    {
      id: 2,
      name: 'Kraków',
      population: 779966,
      area: 326.85,
      country: 'Polska',
      type: 'Miasto',
      established: '1257'
    },
    {
      id: 3,
      name: 'Łódź',
      population: 679941,
      area: 293.25,
      country: 'Polska',
      type: 'Miasto',
      established: '1423'
    },
    {
      id: 4,
      name: 'Wrocław',
      population: 643782,
      area: 292.82,
      country: 'Polska',
      type: 'Miasto',
      established: '1000'
    },
    {
      id: 5,
      name: 'Poznań',
      population: 535000,
      area: 261.85,
      country: 'Polska',
      type: 'Miasto',
      established: '968'
    }
  ]

  // Use mock data if API data is not available
  const attributeData = rawData.length > 0 ? rawData : mockData

  // Get column names
  const columns = useMemo(() => {
    if (attributeData.length === 0) return []
    return Object.keys(attributeData[0]).filter(key => key !== 'id')
  }, [attributeData])

  // Filter data based on search and column filters
  const filteredData = useMemo(() => {
    let filtered = attributeData

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue.trim()) {
        filtered = filtered.filter(row =>
          String(row[column] || '').toLowerCase().includes(filterValue.toLowerCase())
        )
      }
    })

    return filtered
  }, [attributeData, searchQuery, columnFilters])

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage
    return filteredData.slice(startIndex, startIndex + rowsPerPage)
  }, [filteredData, page, rowsPerPage])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleExport = () => {
    // Convert data to CSV
    if (filteredData.length === 0) return

    const headers = Object.keys(filteredData[0])
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row =>
        headers.map(header => {
          const value = row[header]
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value).replace(/"/g, '""')
          return escaped.includes(',') ? `"${escaped}"` : escaped
        }).join(',')
      )
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${layerName.replace(/\s+/g, '_')}_attributes.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }))
    setPage(0)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setColumnFilters({})
    setPage(0)
  }

  if (!layerId) {
    return null
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          height: '60vh',
          bgcolor: (theme) => alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6)
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TableIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Tabela atrybutów
              </Typography>
              <Chip label={layerName} variant="outlined" size="small" />
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Controls */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <TextField
              size="small"
              placeholder="Szukaj w tabeli..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: 250 }}
            />

            {/* Filter button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterMenu(e.currentTarget)}
            >
              Filtry
            </Button>

            {/* Export button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              disabled={filteredData.length === 0}
            >
              Eksport CSV
            </Button>

            {/* Refresh button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Odśwież
            </Button>

            {/* Stats */}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Chip
                label={`${filteredData.length} wierszy`}
                size="small"
                color="primary"
                variant="outlined"
              />
              {columns.length > 0 && (
                <Chip
                  label={`${columns.length} kolumn`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>

          {/* Active filters */}
          {(searchQuery || Object.keys(columnFilters).length > 0) && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Aktywne filtry:
              </Typography>
              {searchQuery && (
                <Chip
                  label={`Szukaj: "${searchQuery}"`}
                  size="small"
                  onDelete={() => setSearchQuery('')}
                />
              )}
              {Object.entries(columnFilters).map(([column, value]) =>
                value ? (
                  <Chip
                    key={column}
                    label={`${column}: "${value}"`}
                    size="small"
                    onDelete={() => handleColumnFilter(column, '')}
                  />
                ) : null
              )}
              <Button size="small" onClick={clearFilters}>
                Wyczyść wszystkie
              </Button>
            </Box>
          )}
        </Box>

        {/* Table */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {isLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>Ładowanie danych...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error">
                Błąd podczas ładowania danych
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ height: '100%' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column}
                        sx={{
                          fontWeight: 600,
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1)
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2">
                            {column}
                          </Typography>
                          {columnFilters[column] && (
                            <Chip
                              size="small"
                              label={`"${columnFilters[column]}"`}
                              color="primary"
                              variant="outlined"
                              sx={{ mt: 0.5, height: 20 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((row, index) => (
                    <TableRow
                      key={row.id || index}
                      hover
                      sx={{
                        '&:nth-of-type(odd)': {
                          bgcolor: (theme) => alpha(theme.palette.action.hover, 0.3)
                        }
                      }}
                    >
                      {columns.map((column) => (
                        <TableCell key={column}>
                          <Typography variant="body2">
                            {String(row[column] || '')}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Wierszy na stronę:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} z ${count !== -1 ? count : `więcej niż ${to}`}`
          }
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.3)
          }}
        />
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenu}
        open={Boolean(filterMenu)}
        onClose={() => setFilterMenu(null)}
      >
        {columns.map((column) => (
          <MenuItem key={column} sx={{ minWidth: 200 }}>
            <TextField
              fullWidth
              size="small"
              label={`Filtruj ${column}`}
              value={columnFilters[column] || ''}
              onChange={(e) => handleColumnFilter(column, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </MenuItem>
        ))}
      </Menu>
    </Drawer>
  )
}

export default AttributesPanel