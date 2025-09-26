import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { createSelector } from "reselect"
import type { RootState } from "../store"
import type { Geometry } from "geojson"

export interface Parcel {
  id: string
  name: string
  area?: number
  perimeter?: number
  owner?: string
  address?: string
  cadastralNumber?: string
  landUse?: string
  geometry?: Geometry
  properties?: Record<string, any>
  lastModified?: string
  syncStatus?: "synced" | "pending" | "error"
}

export interface ParcelsState {
  list: Parcel[]
  selectedParcelId: string | null
  editingParcelId: string | null
  filter: {
    search: string
    landUse: string[]
    owner: string
  }
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  loading: boolean
  error: string | null
}

const initialState: ParcelsState = {
  list: [
    {
      id: "1",
      name: "Działka 1",
      area: 1200,
      perimeter: 140,
      owner: "Jan Kowalski",
      address: "ul. Przykładowa 1, Warszawa",
      cadastralNumber: "123456/1",
      landUse: "residential",
      lastModified: new Date().toISOString(),
      syncStatus: "synced",
      properties: {
        buildingRights: true,
        utilities: ["water", "electricity", "gas"],
      },
    },
    {
      id: "2",
      name: "Działka 2",
      area: 800,
      perimeter: 120,
      owner: "Anna Nowak",
      address: "ul. Testowa 2, Warszawa",
      cadastralNumber: "123456/2",
      landUse: "commercial",
      lastModified: new Date().toISOString(),
      syncStatus: "pending",
      properties: {
        buildingRights: false,
        utilities: ["water", "electricity"],
      },
    },
  ],
  selectedParcelId: null,
  editingParcelId: null,
  filter: {
    search: "",
    landUse: [],
    owner: "",
  },
  pagination: {
    page: 0,
    pageSize: 25,
    total: 2,
  },
  loading: false,
  error: null,
}

export const parcelsSlice = createSlice({
  name: "parcels",
  initialState,
  reducers: {
    setParcels: (state, action: PayloadAction<Parcel[]>) => {
      state.list = action.payload
      state.pagination.total = action.payload.length
    },
    addParcel: (state, action: PayloadAction<Parcel>) => {
      state.list.push(action.payload)
      state.pagination.total = state.list.length
    },
    removeParcel: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((parcel) => parcel.id !== action.payload)
      state.pagination.total = state.list.length
      if (state.selectedParcelId === action.payload) {
        state.selectedParcelId = null
      }
      if (state.editingParcelId === action.payload) {
        state.editingParcelId = null
      }
    },
    updateParcel: (state, action: PayloadAction<{ id: string; updates: Partial<Parcel> }>) => {
      const { id, updates } = action.payload
      const parcelIndex = state.list.findIndex((parcel) => parcel.id === id)
      if (parcelIndex !== -1) {
        state.list[parcelIndex] = {
          ...state.list[parcelIndex],
          ...updates,
          lastModified: new Date().toISOString(),
          syncStatus: "pending",
        }
      }
    },
    setSelectedParcel: (state, action: PayloadAction<string | null>) => {
      state.selectedParcelId = action.payload
    },
    setEditingParcel: (state, action: PayloadAction<string | null>) => {
      state.editingParcelId = action.payload
    },
    setFilter: (state, action: PayloadAction<Partial<ParcelsState["filter"]>>) => {
      state.filter = { ...state.filter, ...action.payload }
      state.pagination.page = 0 // Reset to first page when filtering
    },
    clearFilter: (state) => {
      state.filter = initialState.filter
      state.pagination.page = 0
    },
    setPagination: (state, action: PayloadAction<Partial<ParcelsState["pagination"]>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSyncStatus: (state, action: PayloadAction<{ id: string; status: Parcel["syncStatus"] }>) => {
      const parcel = state.list.find((p) => p.id === action.payload.id)
      if (parcel) {
        parcel.syncStatus = action.payload.status
      }
    },
  },
})

export const {
  setParcels,
  addParcel,
  removeParcel,
  updateParcel,
  setSelectedParcel,
  setEditingParcel,
  setFilter,
  clearFilter,
  setPagination,
  setLoading,
  setError,
  setSyncStatus,
} = parcelsSlice.actions

// Memoized selectors
export const selectParcels = (state: RootState) => state.parcels.list
export const selectSelectedParcelId = (state: RootState) => state.parcels.selectedParcelId
export const selectEditingParcelId = (state: RootState) => state.parcels.editingParcelId
export const selectParcelsFilter = (state: RootState) => state.parcels.filter
export const selectParcelsPagination = (state: RootState) => state.parcels.pagination
export const selectParcelsLoading = (state: RootState) => state.parcels.loading
export const selectParcelsError = (state: RootState) => state.parcels.error

export const selectFilteredParcels = createSelector([selectParcels, selectParcelsFilter], (parcels, filter) => {
  return parcels.filter((parcel) => {
    const matchesSearch =
      !filter.search ||
      parcel.name.toLowerCase().includes(filter.search.toLowerCase()) ||
      parcel.owner?.toLowerCase().includes(filter.search.toLowerCase()) ||
      parcel.cadastralNumber?.toLowerCase().includes(filter.search.toLowerCase())

    const matchesLandUse = filter.landUse.length === 0 || (parcel.landUse && filter.landUse.includes(parcel.landUse))

    const matchesOwner = !filter.owner || parcel.owner?.toLowerCase().includes(filter.owner.toLowerCase())

    return matchesSearch && matchesLandUse && matchesOwner
  })
})

export const selectPaginatedParcels = createSelector(
  [selectFilteredParcels, selectParcelsPagination],
  (filteredParcels, pagination) => {
    const start = pagination.page * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredParcels.slice(start, end)
  },
)

export const selectSelectedParcel = createSelector([selectParcels, selectSelectedParcelId], (parcels, selectedId) =>
  selectedId ? parcels.find((parcel) => parcel.id === selectedId) : null,
)

export const selectEditingParcel = createSelector([selectParcels, selectEditingParcelId], (parcels, editingId) =>
  editingId ? parcels.find((parcel) => parcel.id === editingId) : null,
)

export const selectParcelById = createSelector(
  [selectParcels, (state: RootState, parcelId: string) => parcelId],
  (parcels, parcelId) => parcels.find((parcel) => parcel.id === parcelId),
)

export const selectPendingSyncParcels = createSelector(selectParcels, (parcels) =>
  parcels.filter((parcel) => parcel.syncStatus === "pending"),
)
