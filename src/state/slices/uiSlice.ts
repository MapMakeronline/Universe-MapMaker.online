import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { createSelector } from "reselect"
import type { RootState } from "../store"

export interface UiState {
  leftPanelOpen: boolean
  themeMode: "light" | "dark"
  sidebarWidth: number
  mapLoading: boolean
  activeTab: "layers" | "attributes" | "tools"
  notifications: Array<{
    id: string
    type: "success" | "error" | "warning" | "info"
    message: string
    timestamp: number
  }>
}

const initialState: UiState = {
  leftPanelOpen: true,
  themeMode: "light",
  sidebarWidth: 320,
  mapLoading: false,
  activeTab: "layers",
  notifications: [],
}

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleLeftPanel: (state) => {
      state.leftPanelOpen = !state.leftPanelOpen
    },
    setLeftPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.leftPanelOpen = action.payload
    },
    setThemeMode: (state, action: PayloadAction<"light" | "dark">) => {
      state.themeMode = action.payload
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = Math.max(280, Math.min(500, action.payload))
    },
    setMapLoading: (state, action: PayloadAction<boolean>) => {
      state.mapLoading = action.payload
    },
    setActiveTab: (state, action: PayloadAction<UiState["activeTab"]>) => {
      state.activeTab = action.payload
    },
    addNotification: (state, action: PayloadAction<Omit<UiState["notifications"][0], "id" | "timestamp">>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: Date.now(),
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
  },
})

export const {
  toggleLeftPanel,
  setLeftPanelOpen,
  setThemeMode,
  setSidebarWidth,
  setMapLoading,
  setActiveTab,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions

// Memoized selectors
export const selectUi = (state: RootState) => state.ui
export const selectLeftPanelOpen = createSelector(selectUi, (ui) => ui.leftPanelOpen)
export const selectThemeMode = createSelector(selectUi, (ui) => ui.themeMode)
export const selectSidebarWidth = createSelector(selectUi, (ui) => ui.sidebarWidth)
export const selectMapLoading = createSelector(selectUi, (ui) => ui.mapLoading)
export const selectActiveTab = createSelector(selectUi, (ui) => ui.activeTab)
export const selectNotifications = createSelector(selectUi, (ui) => ui.notifications)
export const selectRecentNotifications = createSelector(
  selectNotifications,
  (notifications) => notifications.slice(-5), // Last 5 notifications
)
