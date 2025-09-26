# Dokumentacja Universe MapMaker

## Przegląd dokumentów

### 📋 [state-contract.md](./state-contract.md)
Szczegółowy opis architektury stanu aplikacji:
- Co przechowujemy w Redux vs RTK Query vs Runtime
- Zasady serializacji danych
- Wzorce selektorów z Reselect
- Strategia persistence

### 🚀 [DEPLOY.md](./DEPLOY.md)
Kompletny przewodnik wdrażania na Google Cloud Run:
- Wymagane zmienne środowiskowe
- Proces build & deploy
- Monitoring i troubleshooting
- Optymalizacja performance

### 📊 [google-sheets.md](./google-sheets.md)
Integracja z Google Sheets API:
- Setup Service Account
- Struktura arkuszy kalkulacyjnych
- API endpoints i walidacja danych
- Przykłady użycia

### 🗺️ [geoserver.md](./geoserver.md)
Integracja z GeoServer:
- Obsługiwane serwisy (WMS/WFS/MVT)
- Konfiguracja środowiska
- Integracja z Mapbox GL JS
- Przykłady implementacji

## Architektura Decision Records (ADR)

Planowane dokumenty dla kluczowych decyzji architektonicznych:
- `adr/001-state-management.md` - Wybór Redux Toolkit
- `adr/002-mapping-solution.md` - Wybór Mapbox GL JS
- `adr/003-deployment-strategy.md` - Google Cloud Run
- `adr/004-ui-framework.md` - Material UI vs alternatives
