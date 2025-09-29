/**
 * useDrawer - Hook do zarządzania stanem drawera
 * Obsługuje otwieranie/zamykanie, pozycję i zapamiętywanie preferencji
 */

import { useState, useCallback, useEffect } from 'react'
import { DrawerAnchor, UseDrawerReturn } from '../types/layers.types'

// Klucze dla localStorage
const STORAGE_KEYS = {
  isOpen: 'drawer_is_open',
  anchor: 'drawer_anchor',
  width: 'drawer_width'
} as const

// Domyślna konfiguracja
const DEFAULT_CONFIG = {
  anchor: 'left' as DrawerAnchor,
  width: 320,
  mobileWidth: 280
}

// Hook do zarządzania drawerem
const useDrawer = (): UseDrawerReturn => {
  // Stan drawera z wartościami z localStorage lub domyślnymi
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem(STORAGE_KEYS.isOpen)
    return saved ? JSON.parse(saved) : false
  })

  const [anchor, setAnchorState] = useState<DrawerAnchor>(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG.anchor
    const saved = localStorage.getItem(STORAGE_KEYS.anchor)
    return (saved as DrawerAnchor) || DEFAULT_CONFIG.anchor
  })

  const [width, setWidthState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CONFIG.width
    const saved = localStorage.getItem(STORAGE_KEYS.width)
    return saved ? parseInt(saved, 10) : DEFAULT_CONFIG.width
  })

  // Funkcja do przełączania stanu drawer (otwarte/zamknięte)
  const toggle = useCallback(() => {
    console.log('[DRAWER] Przełączanie stanu drawera')
    setIsOpen(prev => {
      const newState = !prev
      console.log('[DRAWER] Nowy stan:', newState ? 'otwarty' : 'zamknięty')
      return newState
    })
  }, [])

  // Funkcja do otwierania drawera
  const open = useCallback(() => {
    console.log('[DRAWER] Otwieranie drawera')
    setIsOpen(true)
  }, [])

  // Funkcja do zamykania drawera
  const close = useCallback(() => {
    console.log('[DRAWER] Zamykanie drawera')
    setIsOpen(false)
  }, [])

  // Funkcja do zmiany pozycji drawera
  const setAnchor = useCallback((newAnchor: DrawerAnchor) => {
    console.log('[DRAWER] Zmiana pozycji drawera na:', newAnchor)
    setAnchorState(newAnchor)
  }, [])

  // Funkcja do zmiany szerokości drawera
  const setWidth = useCallback((newWidth: number) => {
    console.log('[DRAWER] Zmiana szerokości drawera na:', newWidth)

    // Walidacja szerokości (min 200px, max 500px)
    const validatedWidth = Math.max(200, Math.min(500, newWidth))
    if (validatedWidth !== newWidth) {
      console.warn('[DRAWER] Szerokość została skorygowana:', validatedWidth)
    }

    setWidthState(validatedWidth)
  }, [])

  // Efekt do zapisywania stanu w localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEYS.isOpen, JSON.stringify(isOpen))
      console.log('[DRAWER] Stan zapisany w localStorage:', isOpen)
    } catch (error) {
      console.warn('[DRAWER] Nie można zapisać stanu w localStorage:', error)
    }
  }, [isOpen])

  // Efekt do zapisywania pozycji w localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEYS.anchor, anchor)
      console.log('[DRAWER] Pozycja zapisana w localStorage:', anchor)
    } catch (error) {
      console.warn('[DRAWER] Nie można zapisać pozycji w localStorage:', error)
    }
  }, [anchor])

  // Efekt do zapisywania szerokości w localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEYS.width, width.toString())
      console.log('[DRAWER] Szerokość zapisana w localStorage:', width)
    } catch (error) {
      console.warn('[DRAWER] Nie można zapisać szerokości w localStorage:', error)
    }
  }, [width])

  // Obsługa zmiany rozmiaru okna - dostosowanie szerokości na mobile
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      const optimalWidth = isMobile ? DEFAULT_CONFIG.mobileWidth : DEFAULT_CONFIG.width

      // Jeśli jesteśmy na mobile i szerokość jest za duża, dostosuj
      if (isMobile && width > DEFAULT_CONFIG.mobileWidth) {
        console.log('[DRAWER] Dostosowanie szerokości dla mobile:', optimalWidth)
        setWidthState(optimalWidth)
      }
    }

    // Sprawdź od razu
    handleResize()

    // Dodaj listener
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [width])

  // Efekt do obsługi klawisza ESC
  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('[DRAWER] Zamykanie drawera przez klawisz ESC')
        close()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => document.removeEventListener('keydown', handleEscapeKey)
  }, [isOpen, close])

  // Log inicjalizacji (tylko na początku)
  useEffect(() => {
    console.log('[DRAWER] Hook zainicjalizowany:', {
      isOpen,
      anchor,
      width,
      isMobile: typeof window !== 'undefined' && window.innerWidth < 768
    })
  }, []) // Pusty array dependency - uruchomi się tylko raz

  return {
    isOpen,
    anchor,
    width,
    toggle,
    open,
    close,
    setAnchor,
    setWidth
  }
}

export default useDrawer

// Funkcje pomocnicze exportowane oddzielnie

/**
 * Resetuje wszystkie ustawienia drawera do wartości domyślnych
 */
export const resetDrawerSettings = (): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEYS.isOpen)
    localStorage.removeItem(STORAGE_KEYS.anchor)
    localStorage.removeItem(STORAGE_KEYS.width)
    console.log('[DRAWER] Ustawienia zresetowane do wartości domyślnych')
  } catch (error) {
    console.warn('[DRAWER] Nie można zresetować ustawień:', error)
  }
}

/**
 * Sprawdza czy urządzenie jest mobilne na podstawie szerokości ekranu
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

/**
 * Zwraca optymalną szerokość drawera dla aktualnego urządzenia
 */
export const getOptimalDrawerWidth = (): number => {
  return isMobileDevice() ? DEFAULT_CONFIG.mobileWidth : DEFAULT_CONFIG.width
}