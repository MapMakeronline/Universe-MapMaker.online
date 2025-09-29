/**
 * LayerManager - Główny komponent zarządzania warstwami
 * Łączy LayerSidebar z wszystkimi panelami (Settings, Attributes)
 */

'use client'

import React from 'react'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'

import { store } from '../../state/store'
import { darkTheme } from '../../lib/theme'
import LayerSidebar from './LayerSidebar'
import LayerSettingsPanel from './LayerSettingsPanel'
import AttributesPanel from './AttributesPanel'
import SidebarToggle from './SidebarToggle'
import { useLayerTree, useLayerActions } from '../../state/layers/hooks'

// Import MSW for development
import { useEffect } from 'react'

const useMSW = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      import('../../mocks/browser').then(({ worker }) => {
        if (worker) {
          console.log('🔄 MSW worker initialized for Layer Panel')
        }
      }).catch((error) => {
        console.warn('MSW failed to initialize:', error)
      })
    }
  }, [])
}

interface LayerManagerCoreProps {
  sidebarVariant?: 'permanent' | 'temporary'
  sidebarWidth?: number
  sidebarMiniWidth?: number
}

// Internal component that uses Redux hooks
const LayerManagerCore: React.FC<LayerManagerCoreProps> = ({
  sidebarVariant = 'permanent',
  sidebarWidth = 320,
  sidebarMiniWidth = 72
}) => {
  // Initialize MSW for development
  useMSW()

  const { sidebarOpen, settingsPanel, attributesPanel } = useLayerTree()
  const { onCloseSettings, onCloseAttributes, onSetSidebarOpen } = useLayerActions()

  return (
    <>
      {/* Main Layer Sidebar */}
      <LayerSidebar
        open={sidebarOpen}
        variant={sidebarVariant}
        width={sidebarWidth}
        miniWidth={sidebarMiniWidth}
        onClose={() => onSetSidebarOpen(false)}
      />

      {/* Layer Settings Panel */}
      <LayerSettingsPanel
        open={settingsPanel.isOpen}
        layerId={settingsPanel.layerId}
        onClose={onCloseSettings}
      />

      {/* Attributes Panel */}
      <AttributesPanel
        open={attributesPanel.isOpen}
        layerId={attributesPanel.layerId}
        layerName={attributesPanel.layerId ? `Warstwa ${attributesPanel.layerId}` : undefined}
        onClose={onCloseAttributes}
      />

      {/* Sidebar Toggle Button */}
      <SidebarToggle
        sidebarWidth={sidebarWidth}
        sidebarOffset={20}
        top={20}
        leftClosed={20}
      />
    </>
  )
}

// Main component with providers
interface LayerManagerProps extends LayerManagerCoreProps {
  /**
   * Whether to provide Redux store (set to false if store is provided higher up)
   * @default true
   */
  provideStore?: boolean
  /**
   * Whether to provide Material-UI theme (set to false if theme is provided higher up)
   * @default true
   */
  provideTheme?: boolean
}

const LayerManager: React.FC<LayerManagerProps> = ({
  provideStore = true,
  provideTheme = true,
  ...coreProps
}) => {
  const CoreComponent = <LayerManagerCore {...coreProps} />

  // Wrap with store provider if needed
  const WithStore = provideStore ? (
    <Provider store={store}>
      {CoreComponent}
    </Provider>
  ) : (
    CoreComponent
  )

  // Wrap with theme provider if needed
  const WithTheme = provideTheme ? (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {WithStore}
    </ThemeProvider>
  ) : (
    WithStore
  )

  return WithTheme
}

export default LayerManager
export { LayerManagerCore }