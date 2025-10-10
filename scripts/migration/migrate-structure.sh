#!/bin/bash

# 📁 Skrypt Migracji Struktury Projektu
# Przenosi pliki ze starej struktury do nowej, bardziej intuicyjnej

set -e  # Exit on error

echo "🚀 Rozpoczynam migrację struktury projektu..."

# Kolory dla lepszej czytelności
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Krok 1: Utworzenie nowej struktury folderów
echo -e "${BLUE}📂 Krok 1: Tworzenie nowej struktury folderów...${NC}"

mkdir -p src/features/mapa/{komponenty,narzedzia,interakcje,eksport}
mkdir -p src/features/dashboard/{komponenty,dialogi}
mkdir -p src/features/warstwy/{komponenty,modale}
mkdir -p src/features/narzedzia
mkdir -p src/features/autoryzacja
mkdir -p src/wspolne
mkdir -p src/api/{klient,endpointy,typy}
mkdir -p src/redux/{slices,api}
mkdir -p src/style
mkdir -p src/mapbox
mkdir -p src/narzedzia/{turf,auth}
mkdir -p src/typy

echo -e "${GREEN}✓ Struktura folderów utworzona${NC}"

# Krok 2: Migracja komponentów mapy
echo -e "${BLUE}📂 Krok 2: Migracja komponentów mapy...${NC}"

# Komponenty główne mapy
mv src/components/map/MapContainer.tsx src/features/mapa/komponenty/
mv src/components/map/Buildings3D.tsx src/features/mapa/komponenty/
mv src/components/map/IdentifyTool.tsx src/features/mapa/komponenty/
mv src/components/map/TapTest.tsx src/features/mapa/komponenty/
mv src/components/map/MobileFAB.tsx src/features/mapa/komponenty/

# Interakcje mapy
mv src/components/map/Building3DInteraction.tsx src/features/mapa/interakcje/
mv src/components/map/Geocoder.tsx src/features/mapa/interakcje/
mv src/components/map/SearchModal.tsx src/features/mapa/interakcje/

# Narzędzia rysowania i pomiaru
mv src/components/map/DrawTools.tsx src/features/mapa/narzedzia/
mv src/components/map/MeasurementTools.tsx src/features/mapa/narzedzia/
mv src/components/drawing/SimpleDrawingToolbar.tsx src/features/mapa/narzedzia/
mv src/components/measurement/SimpleMeasurementToolbar.tsx src/features/mapa/narzedzia/

# Export
mv src/components/map/ExportPDFTool.tsx src/features/mapa/eksport/

echo -e "${GREEN}✓ Komponenty mapy przeniesione${NC}"

# Krok 3: Migracja dashboardu
echo -e "${BLUE}📂 Krok 3: Migracja dashboardu...${NC}"

# Komponenty dashboardu
mv src/components/dashboard/Dashboard.tsx src/features/dashboard/komponenty/
mv src/components/dashboard/DashboardLayout.tsx src/features/dashboard/komponenty/
mv src/components/dashboard/OwnProjects.tsx src/features/dashboard/komponenty/
mv src/components/dashboard/PublicProjects.tsx src/features/dashboard/komponenty/
mv src/components/dashboard/ProjectCard.tsx src/features/dashboard/komponenty/
mv src/components/dashboard/ProjectCardSkeleton.tsx src/features/dashboard/komponenty/
mv src/components/dashboard/UserProfile.tsx src/features/dashboard/komponenty/
mv src/components/dashboard/UserSettings.tsx src/features/dashboard/komponenty/
mv src/components/dashboard/AdminPanel.tsx src/features/dashboard/komponenty/
mv src/components/dashboard/Contact.tsx src/features/dashboard/komponenty/

# Dialogi
mv src/components/dashboard/dialogs/CreateProjectDialog.tsx src/features/dashboard/dialogi/
mv src/components/dashboard/dialogs/DeleteProjectDialog.tsx src/features/dashboard/dialogi/

echo -e "${GREEN}✓ Dashboard przeniesiony${NC}"

# Krok 4: Migracja zarządzania warstwami (panels → warstwy)
echo -e "${BLUE}📂 Krok 4: Migracja zarządzania warstwami...${NC}"

# Komponenty paneli
mv src/components/panels/LeftPanel.tsx src/features/warstwy/komponenty/
mv src/components/panels/RightToolbar.tsx src/features/narzedzia/
mv src/components/panels/components/LayerTree.tsx src/features/warstwy/komponenty/
mv src/components/panels/components/PropertiesPanel.tsx src/features/warstwy/komponenty/
mv src/components/panels/components/BasemapSelector.tsx src/features/warstwy/komponenty/
mv src/components/panels/components/BuildingsPanel.tsx src/features/warstwy/komponenty/
mv src/components/panels/components/SearchBar.tsx src/features/warstwy/komponenty/
mv src/components/panels/components/Toolbar.tsx src/features/warstwy/komponenty/

# Modale
mv src/components/panels/AddDatasetModal.tsx src/features/warstwy/modale/
mv src/components/panels/AddGroupModal.tsx src/features/warstwy/modale/
mv src/components/panels/AddLayerModal.tsx src/features/warstwy/modale/
mv src/components/panels/AddNationalLawModal.tsx src/features/warstwy/modale/
mv src/components/panels/CreateConsultationModal.tsx src/features/warstwy/modale/
mv src/components/panels/ExportPDFModal.tsx src/features/warstwy/modale/
mv src/components/panels/IdentifyModal.tsx src/features/warstwy/modale/
mv src/components/panels/ImportLayerModal.tsx src/features/warstwy/modale/
mv src/components/panels/LayerManagerModal.tsx src/features/warstwy/modale/
mv src/components/panels/MeasurementModal.tsx src/features/warstwy/modale/
mv src/components/panels/PrintConfigModal.tsx src/features/warstwy/modale/

# Modale z map/ (atrybuty budynków i featur)
mv src/components/map/BuildingAttributesModal.tsx src/features/warstwy/modale/
mv src/components/map/FeatureAttributesModal.tsx src/features/warstwy/modale/

echo -e "${GREEN}✓ Warstwy przeniesione${NC}"

# Krok 5: Migracja autoryzacji
echo -e "${BLUE}📂 Krok 5: Migracja autoryzacji...${NC}"

mv src/components/auth/AuthProvider.tsx src/features/autoryzacja/
mv src/components/dashboard/LoginRequiredGuard.tsx src/features/autoryzacja/

echo -e "${GREEN}✓ Autoryzacja przeniesiona${NC}"

# Krok 6: Migracja komponentów współdzielonych
echo -e "${BLUE}📂 Krok 6: Migracja komponentów współdzielonych...${NC}"

mv src/components/ErrorBoundary.tsx src/wspolne/
mv src/components/GoogleAnalytics.tsx src/wspolne/
mv src/components/providers/Providers.tsx src/wspolne/

echo -e "${GREEN}✓ Komponenty współdzielone przeniesione${NC}"

# Krok 7: Migracja API
echo -e "${BLUE}📂 Krok 7: Migracja API...${NC}"

mv src/lib/api/client.ts src/api/klient/
mv src/lib/api/auth.ts src/api/endpointy/
mv src/lib/api/layers.ts src/api/endpointy/
mv src/lib/api/unified-projects.ts src/api/endpointy/
mv src/lib/api/unified-user.ts src/api/endpointy/
mv src/lib/api/types.ts src/api/typy/

echo -e "${GREEN}✓ API przeniesione${NC}"

# Krok 8: Migracja Redux (store → redux)
echo -e "${BLUE}📂 Krok 8: Migracja Redux...${NC}"

mv src/store/slices/*.ts src/redux/slices/
mv src/store/api/*.ts src/redux/api/
mv src/store/hooks.ts src/redux/
mv src/store/store.ts src/redux/

echo -e "${GREEN}✓ Redux przeniesiony${NC}"

# Krok 9: Migracja stylów
echo -e "${BLUE}📂 Krok 9: Migracja stylów...${NC}"

mv src/lib/theme.ts src/style/
mv src/lib/theme-utils.tsx src/style/

echo -e "${GREEN}✓ Style przeniesione${NC}"

# Krok 10: Migracja Mapbox
echo -e "${BLUE}📂 Krok 10: Migracja Mapbox...${NC}"

mv src/lib/mapbox/*.ts src/mapbox/
mv src/lib/mapbox/*.tsx src/mapbox/ 2>/dev/null || true

echo -e "${GREEN}✓ Mapbox przeniesiony${NC}"

# Krok 11: Migracja narzędzi
echo -e "${BLUE}📂 Krok 11: Migracja narzędzi...${NC}"

mv src/lib/logger.ts src/narzedzia/
mv src/lib/turf/measurements.ts src/narzedzia/turf/
mv src/lib/auth/mockUser.ts src/narzedzia/auth/
mv src/lib/auth-init.ts src/narzedzia/auth/

echo -e "${GREEN}✓ Narzędzia przeniesione${NC}"

# Krok 12: Migracja typów
echo -e "${BLUE}📂 Krok 12: Migracja typów...${NC}"

mv src/types/*.ts src/typy/

echo -e "${GREEN}✓ Typy przeniesione${NC}"

# Krok 13: Usunięcie pustych folderów
echo -e "${BLUE}📂 Krok 13: Usuwanie pustych folderów...${NC}"

# Sprawdzenie czy foldery są puste przed usunięciem
if [ -d "src/components/map" ] && [ -z "$(ls -A src/components/map)" ]; then
  rm -rf src/components/map
fi

if [ -d "src/components/drawing" ] && [ -z "$(ls -A src/components/drawing)" ]; then
  rm -rf src/components/drawing
fi

if [ -d "src/components/measurement" ] && [ -z "$(ls -A src/components/measurement)" ]; then
  rm -rf src/components/measurement
fi

if [ -d "src/components/dashboard/dialogs" ] && [ -z "$(ls -A src/components/dashboard/dialogs)" ]; then
  rm -rf src/components/dashboard/dialogs
fi

if [ -d "src/components/dashboard" ] && [ -z "$(ls -A src/components/dashboard)" ]; then
  rm -rf src/components/dashboard
fi

if [ -d "src/components/panels/components" ] && [ -z "$(ls -A src/components/panels/components)" ]; then
  rm -rf src/components/panels/components
fi

if [ -d "src/components/panels" ] && [ -z "$(ls -A src/components/panels)" ]; then
  rm -rf src/components/panels
fi

if [ -d "src/components/auth" ] && [ -z "$(ls -A src/components/auth)" ]; then
  rm -rf src/components/auth
fi

if [ -d "src/components/providers" ] && [ -z "$(ls -A src/components/providers)" ]; then
  rm -rf src/components/providers
fi

if [ -d "src/components" ] && [ -z "$(ls -A src/components)" ]; then
  rm -rf src/components
fi

if [ -d "src/lib/api" ] && [ -z "$(ls -A src/lib/api)" ]; then
  rm -rf src/lib/api
fi

if [ -d "src/lib/mapbox" ] && [ -z "$(ls -A src/lib/mapbox)" ]; then
  rm -rf src/lib/mapbox
fi

if [ -d "src/lib/turf" ] && [ -z "$(ls -A src/lib/turf)" ]; then
  rm -rf src/lib/turf
fi

if [ -d "src/lib/auth" ] && [ -z "$(ls -A src/lib/auth)" ]; then
  rm -rf src/lib/auth
fi

if [ -d "src/lib" ] && [ -z "$(ls -A src/lib)" ]; then
  rm -rf src/lib
fi

if [ -d "src/store/slices" ] && [ -z "$(ls -A src/store/slices)" ]; then
  rm -rf src/store/slices
fi

if [ -d "src/store/api" ] && [ -z "$(ls -A src/store/api)" ]; then
  rm -rf src/store/api
fi

if [ -d "src/store" ] && [ -z "$(ls -A src/store)" ]; then
  rm -rf src/store
fi

if [ -d "src/types" ] && [ -z "$(ls -A src/types)" ]; then
  rm -rf src/types
fi

echo -e "${GREEN}✓ Puste foldery usunięte${NC}"

# Podsumowanie
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Migracja struktury zakończona pomyślnie!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  NASTĘPNE KROKI:${NC}"
echo "1. Zaktualizuj importy w plikach (uruchom update-imports.sh)"
echo "2. Zaktualizuj tsconfig.json (dodaj nowe aliasy path)"
echo "3. Uruchom 'npm run build' aby zweryfikować"
echo "4. Uruchom 'npm run dev' aby przetestować"
echo ""
echo -e "${BLUE}📚 Dokumentacja: Dokumentacja/REORGANIZACJA-STRUKTURY.md${NC}"
