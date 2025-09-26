import type React from "react"
/**
 * Accessibility utilities and keyboard shortcuts
 */

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = {
  HELP: "?",
  FOCUS_SEARCH: "f",
  TOGGLE_SIDEBAR: "m",
  ESCAPE: "Escape",
  ENTER: "Enter",
  SPACE: " ",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
} as const

// ARIA labels in Polish
export const ARIA_LABELS = {
  CLOSE: "Zamknij",
  OPEN: "Otwórz",
  EXPAND: "Rozwiń",
  COLLAPSE: "Zwiń",
  MENU: "Menu",
  SEARCH: "Szukaj",
  FILTER: "Filtruj",
  SORT: "Sortuj",
  EDIT: "Edytuj",
  DELETE: "Usuń",
  ADD: "Dodaj",
  SAVE: "Zapisz",
  CANCEL: "Anuluj",
  LOADING: "Ładowanie...",
  ERROR: "Błąd",
  SUCCESS: "Sukces",
  WARNING: "Ostrzeżenie",
  INFO: "Informacja",
} as const

/**
 * Creates accessible keyboard event handler
 */
export const createKeyboardHandler = (callback: () => void, keys: string[] = ["Enter", " "]) => {
  return (event: React.KeyboardEvent) => {
    if (keys.includes(event.key)) {
      event.preventDefault()
      callback()
    }
  }
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Focus the first focusable element within a container
   */
  focusFirst: (container: HTMLElement) => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as HTMLElement
    focusable?.focus()
  },

  /**
   * Focus the last focusable element within a container
   */
  focusLast: (container: HTMLElement) => {
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const lastElement = focusable[focusable.length - 1] as HTMLElement
    lastElement?.focus()
  },

  /**
   * Trap focus within a container
   */
  trapFocus: (container: HTMLElement) => {
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>

    const firstElement = focusable[0]
    const lastElement = focusable[focusable.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown)
    return () => container.removeEventListener("keydown", handleKeyDown)
  },
}

/**
 * Screen reader announcements
 */
export const announceToScreenReader = (message: string) => {
  const announcement = document.createElement("div")
  announcement.setAttribute("aria-live", "polite")
  announcement.setAttribute("aria-atomic", "true")
  announcement.className = "sr-only"
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Generate unique IDs for accessibility
 */
let idCounter = 0
export const generateId = (prefix = "id") => {
  idCounter += 1
  return `${prefix}-${idCounter}`
}
