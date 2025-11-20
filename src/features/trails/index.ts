/**
 * Trails Module - Moduł tras turystycznych
 *
 * Eksportuje komponenty i typy dla funkcjonalności tras:
 * - Import tras z plików (KML, GeoJSON)
 * - Ręczne rysowanie tras
 * - Animacja kamery wzdłuż trasy
 * - Timeline (pasek postępu)
 * - Sidebar (informacje o trasie)
 */

// Components
export { default as TrailsModal } from './components/TrailsModal';
export { default as TimelineButton } from './components/TimelineButton';
export { default as Timeline } from './components/Timeline';

// Types
export * from './types';
