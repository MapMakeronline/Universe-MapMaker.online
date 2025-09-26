"use client"

import { useEffect, useCallback } from "react"
import { KEYBOARD_SHORTCUTS } from "@/src/lib/accessibility"

interface HotkeyConfig {
  key: string
  callback: () => void
  preventDefault?: boolean
  enabled?: boolean
}

/**
 * Custom hook for managing keyboard shortcuts
 */
export function useHotkeys(hotkeys: HotkeyConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === "true"
      ) {
        return
      }

      // Skip if modifier keys are pressed (except for specific combinations)
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return
      }

      hotkeys.forEach(({ key, callback, preventDefault = true, enabled = true }) => {
        if (enabled && event.key === key) {
          if (preventDefault) {
            event.preventDefault()
          }
          callback()
        }
      })
    },
    [hotkeys],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}

/**
 * Hook for global application hotkeys
 */
export function useGlobalHotkeys(onToggleSidebar: () => void, onFocusSearch: () => void, onShowHelp: () => void) {
  const hotkeys: HotkeyConfig[] = [
    {
      key: KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR,
      callback: onToggleSidebar,
    },
    {
      key: KEYBOARD_SHORTCUTS.FOCUS_SEARCH,
      callback: onFocusSearch,
    },
    {
      key: KEYBOARD_SHORTCUTS.HELP,
      callback: onShowHelp,
    },
  ]

  useHotkeys(hotkeys)
}
