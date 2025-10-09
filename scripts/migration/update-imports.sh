#!/bin/bash

# 🔄 Skrypt Aktualizacji Importów
# Automatycznie aktualizuje wszystkie importy do nowej struktury folderów

set -e

echo "🔄 Rozpoczynam aktualizację importów..."

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Funkcja do aktualizacji importów w plikach
update_imports() {
  local file=$1
  echo -e "${BLUE}  Aktualizuję: $file${NC}"

  # Mapa: stary import → nowy import

  # Komponenty mapy
  sed -i "s|@/components/map/MapContainer|@/features/mapa/komponenty/MapContainer|g" "$file"
  sed -i "s|@/components/map/Buildings3D|@/features/mapa/komponenty/Buildings3D|g" "$file"
  sed -i "s|@/components/map/IdentifyTool|@/features/mapa/komponenty/IdentifyTool|g" "$file"
  sed -i "s|@/components/map/TapTest|@/features/mapa/komponenty/TapTest|g" "$file"
  sed -i "s|@/components/map/MobileFAB|@/features/mapa/komponenty/MobileFAB|g" "$file"

  # Interakcje mapy
  sed -i "s|@/components/map/Building3DInteraction|@/features/mapa/interakcje/Building3DInteraction|g" "$file"
  sed -i "s|@/components/map/Geocoder|@/features/mapa/interakcje/Geocoder|g" "$file"
  sed -i "s|@/components/map/SearchModal|@/features/mapa/interakcje/SearchModal|g" "$file"

  # Narzędzia mapy
  sed -i "s|@/components/map/DrawTools|@/features/mapa/narzedzia/DrawTools|g" "$file"
  sed -i "s|@/components/map/MeasurementTools|@/features/mapa/narzedzia/MeasurementTools|g" "$file"
  sed -i "s|@/components/drawing/SimpleDrawingToolbar|@/features/mapa/narzedzia/SimpleDrawingToolbar|g" "$file"
  sed -i "s|@/components/measurement/SimpleMeasurementToolbar|@/features/mapa/narzedzia/SimpleMeasurementToolbar|g" "$file"

  # Export
  sed -i "s|@/components/map/ExportPDFTool|@/features/mapa/eksport/ExportPDFTool|g" "$file"

  # Dashboard komponenty
  sed -i "s|@/components/dashboard/Dashboard|@/features/dashboard/komponenty/Dashboard|g" "$file"
  sed -i "s|@/components/dashboard/DashboardLayout|@/features/dashboard/komponenty/DashboardLayout|g" "$file"
  sed -i "s|@/components/dashboard/OwnProjects|@/features/dashboard/komponenty/OwnProjects|g" "$file"
  sed -i "s|@/components/dashboard/PublicProjects|@/features/dashboard/komponenty/PublicProjects|g" "$file"
  sed -i "s|@/components/dashboard/ProjectCard|@/features/dashboard/komponenty/ProjectCard|g" "$file"
  sed -i "s|@/components/dashboard/ProjectCardSkeleton|@/features/dashboard/komponenty/ProjectCardSkeleton|g" "$file"
  sed -i "s|@/components/dashboard/UserProfile|@/features/dashboard/komponenty/UserProfile|g" "$file"
  sed -i "s|@/components/dashboard/UserSettings|@/features/dashboard/komponenty/UserSettings|g" "$file"
  sed -i "s|@/components/dashboard/AdminPanel|@/features/dashboard/komponenty/AdminPanel|g" "$file"
  sed -i "s|@/components/dashboard/Contact|@/features/dashboard/komponenty/Contact|g" "$file"

  # Dashboard dialogi
  sed -i "s|@/components/dashboard/dialogs/CreateProjectDialog|@/features/dashboard/dialogi/CreateProjectDialog|g" "$file"
  sed -i "s|@/components/dashboard/dialogs/DeleteProjectDialog|@/features/dashboard/dialogi/DeleteProjectDialog|g" "$file"

  # Warstwy komponenty
  sed -i "s|@/components/panels/LeftPanel|@/features/warstwy/komponenty/LeftPanel|g" "$file"
  sed -i "s|@/components/panels/RightToolbar|@/features/narzedzia/RightToolbar|g" "$file"
  sed -i "s|@/components/panels/components/LayerTree|@/features/warstwy/komponenty/LayerTree|g" "$file"
  sed -i "s|@/components/panels/components/PropertiesPanel|@/features/warstwy/komponenty/PropertiesPanel|g" "$file"
  sed -i "s|@/components/panels/components/BasemapSelector|@/features/warstwy/komponenty/BasemapSelector|g" "$file"
  sed -i "s|@/components/panels/components/BuildingsPanel|@/features/warstwy/komponenty/BuildingsPanel|g" "$file"
  sed -i "s|@/components/panels/components/SearchBar|@/features/warstwy/komponenty/SearchBar|g" "$file"
  sed -i "s|@/components/panels/components/Toolbar|@/features/warstwy/komponenty/Toolbar|g" "$file"

  # Warstwy modale
  sed -i "s|@/components/panels/AddDatasetModal|@/features/warstwy/modale/AddDatasetModal|g" "$file"
  sed -i "s|@/components/panels/AddGroupModal|@/features/warstwy/modale/AddGroupModal|g" "$file"
  sed -i "s|@/components/panels/AddLayerModal|@/features/warstwy/modale/AddLayerModal|g" "$file"
  sed -i "s|@/components/panels/AddNationalLawModal|@/features/warstwy/modale/AddNationalLawModal|g" "$file"
  sed -i "s|@/components/panels/CreateConsultationModal|@/features/warstwy/modale/CreateConsultationModal|g" "$file"
  sed -i "s|@/components/panels/ExportPDFModal|@/features/warstwy/modale/ExportPDFModal|g" "$file"
  sed -i "s|@/components/panels/IdentifyModal|@/features/warstwy/modale/IdentifyModal|g" "$file"
  sed -i "s|@/components/panels/ImportLayerModal|@/features/warstwy/modale/ImportLayerModal|g" "$file"
  sed -i "s|@/components/panels/LayerManagerModal|@/features/warstwy/modale/LayerManagerModal|g" "$file"
  sed -i "s|@/components/panels/MeasurementModal|@/features/warstwy/modale/MeasurementModal|g" "$file"
  sed -i "s|@/components/panels/PrintConfigModal|@/features/warstwy/modale/PrintConfigModal|g" "$file"
  sed -i "s|@/components/map/BuildingAttributesModal|@/features/warstwy/modale/BuildingAttributesModal|g" "$file"
  sed -i "s|@/components/map/FeatureAttributesModal|@/features/warstwy/modale/FeatureAttributesModal|g" "$file"

  # Autoryzacja
  sed -i "s|@/components/auth/AuthProvider|@/features/autoryzacja/AuthProvider|g" "$file"
  sed -i "s|@/components/dashboard/LoginRequiredGuard|@/features/autoryzacja/LoginRequiredGuard|g" "$file"

  # Współdzielone
  sed -i "s|@/components/ErrorBoundary|@/wspolne/ErrorBoundary|g" "$file"
  sed -i "s|@/components/GoogleAnalytics|@/wspolne/GoogleAnalytics|g" "$file"
  sed -i "s|@/components/providers/Providers|@/wspolne/Providers|g" "$file"

  # API
  sed -i "s|@/lib/api/client|@/api/klient/client|g" "$file"
  sed -i "s|@/lib/api/auth|@/api/endpointy/auth|g" "$file"
  sed -i "s|@/lib/api/layers|@/api/endpointy/layers|g" "$file"
  sed -i "s|@/lib/api/unified-projects|@/api/endpointy/unified-projects|g" "$file"
  sed -i "s|@/lib/api/unified-user|@/api/endpointy/unified-user|g" "$file"
  sed -i "s|@/lib/api/types|@/api/typy/types|g" "$file"

  # Redux (store → redux)
  sed -i "s|@/store/slices/authSlice|@/redux/slices/authSlice|g" "$file"
  sed -i "s|@/store/slices/buildingsSlice|@/redux/slices/buildingsSlice|g" "$file"
  sed -i "s|@/store/slices/drawSlice|@/redux/slices/drawSlice|g" "$file"
  sed -i "s|@/store/slices/featuresSlice|@/redux/slices/featuresSlice|g" "$file"
  sed -i "s|@/store/slices/layersSlice|@/redux/slices/layersSlice|g" "$file"
  sed -i "s|@/store/slices/mapSlice|@/redux/slices/mapSlice|g" "$file"
  sed -i "s|@/store/slices/projectsSlice|@/redux/slices/projectsSlice|g" "$file"
  sed -i "s|@/store/api/projectsApi|@/redux/api/projectsApi|g" "$file"
  sed -i "s|@/store/hooks|@/redux/hooks|g" "$file"
  sed -i "s|@/store/store|@/redux/store|g" "$file"

  # Style
  sed -i "s|@/lib/theme|@/style/theme|g" "$file"
  sed -i "s|@/lib/theme-utils|@/style/theme-utils|g" "$file"

  # Mapbox
  sed -i "s|@/lib/mapbox/config|@/mapbox/config|g" "$file"
  sed -i "s|@/lib/mapbox/search|@/mapbox/search|g" "$file"
  sed -i "s|@/lib/mapbox/map3d|@/mapbox/map3d|g" "$file"
  sed -i "s|@/lib/mapbox/draw-styles|@/mapbox/draw-styles|g" "$file"
  sed -i "s|@/lib/mapbox/pdfExport|@/mapbox/pdfExport|g" "$file"

  # Narzędzia
  sed -i "s|@/lib/logger|@/narzedzia/logger|g" "$file"
  sed -i "s|@/lib/turf/measurements|@/narzedzia/turf/measurements|g" "$file"
  sed -i "s|@/lib/auth/mockUser|@/narzedzia/auth/mockUser|g" "$file"
  sed -i "s|@/lib/auth-init|@/narzedzia/auth/auth-init|g" "$file"

  # Typy
  sed -i "s|@/types/dashboard|@/typy/dashboard|g" "$file"
  sed -i "s|@/types/geometry|@/typy/geometry|g" "$file"
  sed -i "s|@/types/layers|@/typy/layers|g" "$file"
  sed -i "s|@/types/map|@/typy/map|g" "$file"

  # Hooki - bez zmian, ale dla kompletności
  # sed -i "s|@/hooks/|@/hooks/|g" "$file"
}

# Znajdź wszystkie pliki TypeScript/TSX/JS/JSX
echo -e "${BLUE}📂 Szukam plików do aktualizacji...${NC}"

files=$(find src app -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null)
total=$(echo "$files" | wc -l)

echo -e "${GREEN}Znaleziono $total plików${NC}"
echo ""

# Licznik
count=0

# Aktualizuj każdy plik
for file in $files; do
  count=$((count + 1))
  echo -e "${YELLOW}[$count/$total]${NC} $file"
  update_imports "$file"
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Importy zaktualizowane w $count plikach!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  NASTĘPNE KROKI:${NC}"
echo "1. Zaktualizuj tsconfig.json (dodaj nowe aliasy)"
echo "2. Uruchom 'npm run build' aby zweryfikować"
echo "3. Sprawdź logi buildu pod kątem błędów importów"
echo ""
