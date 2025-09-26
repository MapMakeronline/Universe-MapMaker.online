"use client"

import type React from "react"

import { useState } from "react"
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Pagination,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material"
import { Search, FilterList, MoreVert, LocationOn, Info, CloudSync, Edit } from "@mui/icons-material"
import { Panel } from "@/components/ui/Panel"
import { useAppSelector, useAppDispatch } from "@/state/hooks"
import {
  selectFilteredParcels,
  selectParcelsFilter,
  selectParcelsPage,
  selectParcelsPerPage,
  selectTotalParcels,
  setFilter,
  setPage,
} from "@/state/slices/parcelsSlice"

export function ParcelsPanel() {
  const dispatch = useAppDispatch()
  const parcels = useAppSelector(selectFilteredParcels)
  const filter = useAppSelector(selectParcelsFilter)
  const currentPage = useAppSelector(selectParcelsPage)
  const parcelsPerPage = useAppSelector(selectParcelsPerPage)
  const totalParcels = useAppSelector(selectTotalParcels)

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedParcel, setSelectedParcel] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const totalPages = Math.ceil(totalParcels / parcelsPerPage)

  const handleEditInSheets = async (parcel: any) => {
    setIsSyncing(true)
    try {
      // Ensure spreadsheet exists
      const ensureResponse = await fetch("/api/sheets/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetName: "Działki - Universe MapMaker" }),
      })

      if (!ensureResponse.ok) {
        throw new Error("Failed to ensure spreadsheet")
      }

      const { spreadsheetId } = await ensureResponse.json()

      // Sync parcel data
      const syncResponse = await fetch("/api/sheets/sync-row", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId,
          sheetTitle: "Działki",
          keyColumn: "id",
          keyValue: parcel.id,
          row: {
            id: parcel.id,
            number: parcel.number,
            area: parcel.area,
            owner: parcel.owner,
            status: parcel.status,
            updated: new Date().toISOString(),
          },
        }),
      })

      if (!syncResponse.ok) {
        throw new Error("Failed to sync row")
      }

      const { spreadsheetUrl } = await syncResponse.json()

      // Open spreadsheet in new tab
      window.open(spreadsheetUrl, "_blank")
      setSyncMessage({ type: "success", text: "Działka zsynchronizowana z Arkuszami Google" })
    } catch (error) {
      console.error("Failed to sync with Google Sheets:", error)
      setSyncMessage({ type: "error", text: "Błąd synchronizacji z Arkuszami Google" })
    } finally {
      setIsSyncing(false)
      handleMenuClose()
    }
  }

  const handleSyncFromSheets = async () => {
    setIsSyncing(true)
    try {
      // Get spreadsheet data
      const ensureResponse = await fetch("/api/sheets/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetName: "Działki - Universe MapMaker" }),
      })

      if (!ensureResponse.ok) {
        throw new Error("Failed to ensure spreadsheet")
      }

      const { spreadsheetId } = await ensureResponse.json()

      const pullResponse = await fetch("/api/sheets/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId,
          sheetTitle: "Działki",
        }),
      })

      if (!pullResponse.ok) {
        throw new Error("Failed to pull data")
      }

      const { rows } = await pullResponse.json()

      // TODO: Merge data with Redux store
      console.log("Pulled data from sheets:", rows)
      setSyncMessage({ type: "success", text: `Zsynchronizowano ${rows.length} działek z Arkuszy Google` })
    } catch (error) {
      console.error("Failed to sync from Google Sheets:", error)
      setSyncMessage({ type: "error", text: "Błąd pobierania danych z Arkuszy Google" })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, parcelId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedParcel(parcelId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedParcel(null)
  }

  return (
    <Panel title="Działki" onClose={() => {}}>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Search and Filter */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            placeholder="Szukaj działek..."
            value={filter.search}
            onChange={(e) => dispatch(setFilter({ search: e.target.value }))}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <IconButton size="small">
            <FilterList />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label={`Łącznie: ${totalParcels}`} size="small" variant="outlined" />
            <Chip label={`Widoczne: ${parcels.length}`} size="small" color="primary" variant="outlined" />
          </Box>

          <Button
            size="small"
            startIcon={isSyncing ? <CircularProgress size={16} /> : <CloudSync />}
            onClick={handleSyncFromSheets}
            disabled={isSyncing}
            variant="outlined"
          >
            Synchronizuj z Arkuszy
          </Button>
        </Box>

        {/* Parcels List */}
        <List sx={{ flex: 1, overflow: "auto" }}>
          {parcels.map((parcel) => (
            <ListItem key={parcel.id} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {parcel.number}
                    </Typography>
                    <Chip
                      label={parcel.status}
                      size="small"
                      color={parcel.status === "active" ? "success" : "default"}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      Powierzchnia: {parcel.area} m²
                    </Typography>
                    <Typography variant="caption" display="block">
                      Właściciel: {parcel.owner}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => {
                    // TODO: Center map on parcel
                  }}
                >
                  <LocationOn fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={(e) => handleMenuOpen(e, parcel.id)}>
                  <MoreVert fontSize="small" />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => dispatch(setPage(page))}
              size="small"
            />
          </Box>
        )}

        {/* Context Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleMenuClose}>
            <Info fontSize="small" sx={{ mr: 1 }} />
            Szczegóły
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <LocationOn fontSize="small" sx={{ mr: 1 }} />
            Pokaż na mapie
          </MenuItem>
          <MenuItem
            onClick={() => {
              const parcel = parcels.find((p) => p.id === selectedParcel)
              if (parcel) handleEditInSheets(parcel)
            }}
            disabled={isSyncing}
          >
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edytuj w Arkuszach
          </MenuItem>
        </Menu>

        <Snackbar open={!!syncMessage} autoHideDuration={6000} onClose={() => setSyncMessage(null)}>
          <Alert onClose={() => setSyncMessage(null)} severity={syncMessage?.type} sx={{ width: "100%" }}>
            {syncMessage?.text}
          </Alert>
        </Snackbar>
      </Box>
    </Panel>
  )
}
