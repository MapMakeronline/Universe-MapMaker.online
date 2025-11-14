# Implementacja Publikowania Usług WMS/WFS

## Przegląd

Zaimplementowano funkcjonalność publikowania warstw jako usługi WMS/WFS do GeoServer, podobnie jak w starej aplikacji.

## Zmiany w Kodzie

### 1. Modal: `PublishServicesModal.tsx`

**Lokalizacja:** `src/features/layers/modals/PublishServicesModal.tsx`

**Zmiany:**
- ✅ Dodano hierarchiczne renderowanie drzewa warstw z wcięciami
- ✅ Dodano rozwijanie/zwijanie grup warstw
- ✅ Zmieniono `selectedLayers` z `string[]` na `Set<string>` dla lepszej wydajności
- ✅ Dodano wskaźnik indeterminate dla checkboxów grup
- ✅ Dodano ikony rozwijania/zwijania dla grup (ExpandMore/ChevronRight)
- ✅ Dodano automatyczne rozwijanie wszystkich grup przy otwarciu modala
- ✅ Poprawiono licznik zaznaczonych warstw (uwzględnia całe drzewo)

**Kluczowe funkcje:**

```typescript
// Renderowanie hierarchiczne z wcięciami
const renderLayerTree = (nodes: LayerNode[], level: number = 0): React.ReactNode => {
  // Renderuje drzewo warstw z checkboxami, ikonami i wcięciami
  // - Grupy mają folder icon i expand/collapse
  // - Warstwy mają layer icon
  // - Checkbox indeterminate dla grup z częściowo zaznaczonymi children
}

// Liczenie wszystkich warstw w drzewie
const countAllLayers = (nodes: LayerNode[]): number => {
  // Rekurencyjnie liczy wszystkie warstwy (włącznie z zagnieżdżonymi)
}
```

### 2. Hook: `usePropertyOperations.ts`

**Lokalizacja:** `src/features/layers/hooks/usePropertyOperations.ts`

**Już zaimplementowane:**
- ✅ Hook `handlePublish` - publikuje warstwy do GeoServer
- ✅ Budowanie drzewa warstw zgodnie z wymaganiami backend
- ✅ Mapowanie typów warstw (wektor → VectorLayer, raster → RasterLayer)
- ✅ Obsługa błędów i powiadomień
- ✅ Automatyczne odświeżanie cache RTK Query po publikacji

**Przykład użycia:**

```typescript
const { handlePublish, isPublishing } = usePropertyOperations(projectName, warstwy);

// Publikuj wybrane warstwy
const success = await handlePublish(['layer-id-1', 'layer-id-2']);
```

### 3. API: `projects.api.ts`

**Lokalizacja:** `src/backend/projects/projects.api.ts`

**Już zaimplementowane:**
- ✅ Endpoint `publishWMSWFS` (RTK Query mutation)
- ✅ Endpoint `unpublishWMSWFS` (RTK Query mutation)
- ✅ Automatyczne invalidowanie cache po publikacji
- ✅ Hook `usePublishWMSWFSMutation`

**Endpoint:**

```typescript
POST /api/projects/services/publish

Request:
{
  "project_name": "nazwa-projektu",
  "children": [
    {
      "type": "VectorLayer",
      "id": "layer-1",
      "name": "Działki",
      "visible": true,
      "geometry": "MultiPolygon"
    }
  ]
}

Response:
{
  "success": true,
  "message": "Usługi opublikowane pomyślnie",
  "data": {
    "wms_url": "https://geoserver.universemapmaker.online/projekt/wms",
    "wfs_url": "https://geoserver.universemapmaker.online/projekt/wfs"
  }
}
```

## Backend (Django)

**Endpoint:** `POST /api/projects/services/publish`

**Lokalizacja:** `Universe-Mapmaker-Backend/geocraft_api/projects/views.py:786`

**Funkcja:** `publish_services` w `geocraft_api/projects/service.py:4103`

**Co robi backend:**
1. Waliduje uprawnienia użytkownika do projektu
2. Pobiera listę warstw do publikacji z parametru `children`
3. Usuwa stary workspace z GeoServer (jeśli istnieje)
4. Tworzy nowy workspace
5. Publikuje warstwy wektorowe i rastrowe do GeoServer
6. Aktualizuje URLs (WMS/WFS) w bazie danych projektu
7. Zwraca URLs do usług

## Jak Używać

### W Komponencie (PropertiesPanel)

Modal jest już zintegrowany w `PropertiesPanel.tsx`:

```typescript
import { PublishServicesModal } from '../modals/PublishServicesModal';
import { usePropertyOperations } from '../hooks/usePropertyOperations';

const PropertiesPanel = ({ projectName, warstwy, ... }) => {
  const { modals, openModal, closeModal } = usePropertyModals();
  const { handlePublish, isPublishing } = usePropertyOperations(projectName, warstwy);

  const handlePublishWithModal = async (selectedLayerIds: string[]) => {
    const success = await handlePublish(selectedLayerIds);
    if (success) {
      closeModal('publish');
    }
  };

  return (
    <>
      {/* Przycisk otwierający modal */}
      <Button onClick={() => openModal('publish')}>
        Publikuj usługi
      </Button>

      {/* Modal */}
      <PublishServicesModal
        open={modals.publish}
        projectName={projectName}
        layers={warstwy}
        onClose={() => closeModal('publish')}
        onPublish={handlePublishWithModal}
        isLoading={isPublishing}
      />
    </>
  );
};
```

### Przykład Niezależny

```typescript
import { PublishServicesModal } from '@/features/layers/modals/PublishServicesModal';
import { usePublishWMSWFSMutation } from '@/backend/projects';

const MyComponent = () => {
  const [open, setOpen] = useState(false);
  const [publishWMSWFS, { isLoading }] = usePublishWMSWFSMutation();

  const handlePublish = async (selectedLayerIds: string[]) => {
    // Buduj drzewo warstw
    const children = selectedLayerIds.map(id => {
      const layer = findLayer(id);
      return {
        type: 'VectorLayer',
        id: layer.id,
        name: layer.name,
        visible: true,
      };
    });

    try {
      const result = await publishWMSWFS({
        project_name: 'moj-projekt',
        children: children
      }).unwrap();

      console.log('WMS URL:', result.data.wms_url);
      console.log('WFS URL:', result.data.wfs_url);
      setOpen(false);
    } catch (error) {
      console.error('Błąd:', error);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Publikuj</Button>

      <PublishServicesModal
        open={open}
        projectName="moj-projekt"
        layers={myLayers}
        onClose={() => setOpen(false)}
        onPublish={handlePublish}
        isLoading={isLoading}
      />
    </>
  );
};
```

## Struktura Danych

### LayerNode (Frontend)

```typescript
interface LayerNode {
  id: string;
  name: string;
  type: 'group' | 'VectorLayer' | 'RasterLayer' | 'wms';
  visible?: boolean;
  children?: LayerNode[];
  // Dodatkowe pola opcjonalne
  geometry_type?: string;
  source_table_name?: string;
}
```

### Mapowanie Typów Frontend → Backend

| Frontend Type | Backend Type  |
|---------------|---------------|
| `'wektor'`    | `'VectorLayer'` |
| `'raster'`    | `'RasterLayer'` |
| `'grupa'`     | `'group'`       |
| `'wms'`       | `'wms'`         |

## Flow Publikacji

1. **Użytkownik otwiera modal** → `openModal('publish')`
2. **Wybiera warstwy** → Klikanie checkboxów w hierarchicznym drzewie
3. **Klika "Publikuj"** → `onPublish(selectedLayerIds: string[])`
4. **Hook buduje request** → `handlePublish()` w `usePropertyOperations`
   - Znajduje warstwy po ID
   - Buduje drzewo children z odpowiednimi typami
   - Mapuje typy warstw
5. **Wywołuje API** → `publishWMSWFS({ project_name, children })`
6. **Backend przetwarza** → Django publikuje do GeoServer
7. **Response** → URLs WMS/WFS
8. **Cache invalidation** → RTK Query odświeża dane projektu
9. **Powiadomienie** → Success/Error notification
10. **Modal się zamyka**

## Testy

Aby przetestować:

1. Otwórz aplikację i zaloguj się
2. Otwórz projekt z warstwami
3. W panelu właściwości kliknij przycisk publikacji
4. Zaznacz warstwy do publikacji
5. Kliknij "Publikuj"
6. Sprawdź powiadomienia i console.log
7. Sprawdź czy URLs WMS/WFS są dostępne w danych projektu

## Troubleshooting

### Problem: "Brak tokenu autoryzacji"

**Rozwiązanie:** Upewnij się, że token jest zapisany w localStorage:

```javascript
console.log('Token:', localStorage.getItem('authToken'));
```

### Problem: Błąd 403/401

**Rozwiązanie:** Sprawdź czy użytkownik jest właścicielem projektu:

```javascript
// Backend sprawdza: check_project_owner2(user, project_name)
```

### Problem: Błąd 400 "Błąd podczas publikacji usług"

**Możliwe przyczyny:**

1. **Brak pola `geometry` dla warstw wektorowych**
   - Backend wymaga: `geometry !== 'NoGeometry'` dla VectorLayer
   - Rozwiązanie: Upewnij się że warstwy wektorowe mają pole `geometry` (np. "MultiPolygon", "Point", "LineString")

2. **Nieprawidłowa struktura drzewa `children`**
   - Backend oczekuje hierarchicznej struktury z grupami i warstwami
   - Rozwiązanie: Sprawdź czy grupy mają `children` array

3. **Brak warstw do publikacji**
   - Backend filtruje warstwy po `geometry != 'NoGeometry'`
   - Jeśli wszystkie warstwy są grupami lub rasterami bez geometry, może zwrócić błąd

**Debug:**

Sprawdź console.log w przeglądarce - hook `usePropertyOperations` wypisuje pełny request:

```javascript
console.log('🚀 WMS/WFS PUBLICATION REQUEST');
console.log('📦 Full request body:', JSON.stringify({
  project_name: projectName,
  children: children
}, null, 2));
```

Przykład prawidłowego request body:

```json
{
  "project_name": "test-projekt",
  "children": [
    {
      "type": "group",
      "id": "grupa-1",
      "name": "Moja Grupa",
      "visible": true,
      "children": [
        {
          "type": "VectorLayer",
          "id": "layer-1",
          "name": "Działki",
          "visible": true,
          "geometry": "MultiPolygon"
        }
      ]
    },
    {
      "type": "VectorLayer",
      "id": "layer-2",
      "name": "Drogi",
      "visible": true,
      "geometry": "LineString"
    },
    {
      "type": "RasterLayer",
      "id": "layer-3",
      "name": "Ortofotomapa",
      "visible": true
    }
  ]
}
```

**Uwaga:** Warstwy raster i grupy NIE powinny mieć pola `geometry`!

### Problem: Warstwy nie są publikowane

**Rozwiązanie:** Sprawdź console.log w hooku `usePropertyOperations`:

```javascript
console.log('🌳 Built layer tree for publication:', children);
```

Upewnij się, że:
- `children` nie jest puste
- Każda warstwa ma poprawny `type` (VectorLayer/RasterLayer/group)
- Warstwy wektorowe mają pole `geometry`
- `project_name` jest poprawne
- Grupy mają zagnieżdżone `children` array

### Problem: GeoServer nie zwraca warstw

**Rozwiązanie:**
1. Sprawdź czy GeoServer działa (ping endpoint)
2. Sprawdź logi Django: `docker logs django_container`
3. Sprawdź czy workspace został utworzony w GeoServer
4. Sprawdź URL: `https://geoserver.universemapmaker.online/{project_name}/wms?request=GetCapabilities`

## Różnice vs Stara Aplikacja

| Cecha | Stara Aplikacja | Nowa Aplikacja |
|-------|----------------|----------------|
| Framework | Angular/React (stary) | Next.js + RTK Query |
| API | Fetch API | RTK Query mutations |
| State | Component state | React hooks + Redux |
| Styling | Custom CSS | MUI (Material-UI) |
| Tree rendering | Flat list | Hierarchiczne drzewo |
| Checkbox logic | Array | Set (lepsze performance) |
| Type safety | JavaScript | TypeScript |

## Pliki Zmienione

✅ **Zaktualizowane:**
- `src/features/layers/modals/PublishServicesModal.tsx` - Modal z hierarchicznym drzewem

❌ **Bez zmian (już działają):**
- `src/features/layers/hooks/usePropertyOperations.ts` - Hook do publikacji
- `src/backend/projects/projects.api.ts` - API endpoints
- `src/features/layers/components/PropertiesPanel.tsx` - Integracja modala
- `Universe-Mapmaker-Backend/geocraft_api/projects/views.py` - Backend endpoint
- `Universe-Mapmaker-Backend/geocraft_api/projects/service.py` - Logika publikacji

## Następne Kroki

Opcjonalne ulepszenia:

1. **Dodaj podgląd warstw przed publikacją** - Mini mapa z warstwami
2. **Dodaj walidację geometrii** - Sprawdź czy warstwy mają dane
3. **Dodaj opcję publikacji z filtrami** - Publikuj tylko podzbiór danych
4. **Dodaj progress bar** - Dla długich operacji publikacji
5. **Dodaj historię publikacji** - Log kiedy i kto publikował
6. **Dodaj test connection** - Sprawdź GeoServer przed publikacją

## Dokumentacja Backend

Więcej informacji o backendie:
- Zobacz: `Universe-Mapmaker-Backend/geocraft_api/projects/service.py:4103`
- Funkcja: `publish_services(data, user)`
- Helper: `make_tree_geoserver()` - Buduje strukturę dla GeoServer
- GeoServer utils: `geocraft_api/projects/geoserver_utils.py`
