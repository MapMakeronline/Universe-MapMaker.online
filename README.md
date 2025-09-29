# 🗺️ Universe MapMaker

Profesjonalne narzędzie do tworzenia i analizy map oparte na Mapbox GL JS i Next.js 14+.

## 🚀 Quick Start (5 kroków)

### 1. Sklonuj i zainstaluj zależności
```bash
git clone [your-repo-url]
cd universe-mapmaker
npm install
```

### 2. Uzyskaj token Mapbox
- Zarejestruj się na [mapbox.com](https://account.mapbox.com/auth/signup/)
- Przejdź do [Access Tokens](https://account.mapbox.com/access-tokens/)
- Skopiuj swój **Default Public Token**

### 3. Skonfiguruj zmienne środowiskowe
```bash
cp .env.local.example .env.local
```
Otwórz `.env.local` i wklej swój token:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cl91c2VybmFtZSIsImEiOiJjbGZxZXF3MjAwMDExM29zN3...
```

### 4. Uruchom aplikację
```bash
npm run dev
```

### 5. Otwórz w przeglądarce
Przejdź do [http://localhost:3000](http://localhost:3000)

## 📁 Struktura Projektu

```
src/
├── components/map/
│   ├── MapView.tsx          # Główny komponent mapy
│   ├── MapLoader.tsx        # Smart loader z dynamic import
│   └── map.module.css       # Style CSS Modules
├── config/
│   └── mapbox.ts           # Centralna konfiguracja Mapbox
├── types/
│   └── map.types.ts        # TypeScript definicje
└── app/
    ├── layout.tsx          # Layout aplikacji
    ├── page.tsx            # Strona główna z przykładem
    └── globals.css         # Globalne style
```

## 🛠️ Główne Komponenty

### MapLoader
Smart komponent z automatycznym ładowaniem:
```tsx
import MapLoader from '../src/components/map/MapLoader'

<MapLoader
  width="100%"
  height="600px"
  showControls={true}
  showCoordinates={true}
  onMove={(viewState) => console.log(viewState)}
  initialConfig={{
    center: { lat: 52.2297, lng: 21.0122 }, // Warszawa
    zoom: 11
  }}
/>
```

### MapView (komponent wewnętrzny)
Bezpośredni dostęp do mapy Mapbox GL JS:
```tsx
import MapView from '../src/components/map/MapView'

<MapView
  onLoad={(map) => {
    // Dostęp do instancji mapboxgl.Map
    map.addControl(new CustomControl())
  }}
/>
```

## ⚙️ Konfiguracja

### Zmiana domyślnego centrum mapy
Edytuj `src/config/mapbox.ts`:
```typescript
export const DEFAULT_CENTER: Coordinates = {
  lat: 50.0647,  // Kraków
  lng: 19.9450
}
```

### Dostępne style map
```typescript
const styles = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11'
}
```

### Custom style mapy
```tsx
<MapLoader
  initialConfig={{
    style: 'mapbox://styles/mapbox/dark-v11'
  }}
/>
```

## 🎯 Przykłady Użycia

### Podstawowa mapa pełnoekranowa
```tsx
<MapLoader
  width="100vw"
  height="100vh"
  showControls={true}
/>
```

### Mapa w kontenerze z callbackami
```tsx
const [viewState, setViewState] = useState(null)

<MapLoader
  width="800px"
  height="600px"
  onMove={setViewState}
  onLoad={(map) => console.log('Mapa załadowana!')}
  onError={(error) => console.error('Błąd:', error)}
/>
```

### Ukrywanie elementów UI
```tsx
<MapLoader
  showControls={false}      // Bez kontrolek nawigacji
  showCoordinates={false}   // Bez panelu współrzędnych
/>
```

## 🐛 Rozwiązywanie Problemów

### Mapa nie ładuje się
1. **Sprawdź token**: Musi zaczynać się od `pk.`
2. **Sprawdź console**: Otwórz DevTools (F12) i sprawdź błędy
3. **Zrestartuj serwer**: Po zmianie `.env.local` uruchom ponownie `npm run dev`

### Błąd "Cannot read properties of undefined"
- Upewnij się, że wszystkie pakiety są zainstalowane: `npm install`
- Sprawdź czy używasz Node.js 18+

### Problemy z TypeScript
```bash
npm run build  # Sprawdź błędy kompilacji
```

### Problemy na mobile
- Mapa automatycznie obsługuje gestyy dotykowe
- Dla lepszej wydajności ustaw mniejszy rozmiar na mobile

## 📚 API Reference

### MapLoaderProps
```typescript
interface MapLoaderProps {
  width?: string | number           // Szerokość (domyślnie: 100%)
  height?: string | number          // Wysokość (domyślnie: 600px)
  showControls?: boolean           // Kontrolki nawigacji (domyślnie: true)
  showCoordinates?: boolean        // Panel współrzędnych (domyślnie: true)
  onMove?: (viewState: ViewState) => void     // Callback ruchu mapy
  onLoad?: (map: mapboxgl.Map) => void        // Callback załadowania
  onError?: (error: Error) => void            // Callback błędów
  initialConfig?: Partial<MapConfig>          // Początkowa konfiguracja
  className?: string               // CSS classes
}
```

### ViewState
```typescript
interface ViewState {
  center: { lat: number; lng: number }
  zoom: number
  pitch?: number    // Nachylenie (0-60°)
  bearing?: number  // Obrót (0-360°)
}
```

## 🔧 Development

### Uruchomienie w trybie deweloperskim
```bash
npm run dev        # Serwer deweloperski
npm run build      # Build produkcyjny
npm run start      # Uruchomienie po build
npm run lint       # Sprawdzenie kodu
```

### Dodawanie nowych funkcji
1. **Nowe typy**: Dodaj do `src/types/map.types.ts`
2. **Konfiguracja**: Modyfikuj `src/config/mapbox.ts`
3. **Komponenty**: Utwórz w `src/components/map/`
4. **Style**: Używaj CSS Modules w `map.module.css`

### Debug Mode
W `app/page.tsx` jest debug panel pokazujący aktualne współrzędne:
```tsx
// Usuń to w produkcji
{isMapLoaded && currentView && (
  <div>Debug info...</div>
)}
```

## 📦 Zależności

### Główne
- **Next.js 14+** - Framework React
- **React 18+** - UI Library
- **mapbox-gl** - Mapbox GL JS
- **TypeScript** - Type safety

### Development
- **ESLint** - Linting
- **Prettier** - Code formatting
- **CSS Modules** - Scoped styles

## 🚀 Deploy

### Vercel (zalecane)
```bash
# Deploy automatyczny po push do main
vercel
```

### Netlify
```bash
npm run build
# Upload folder .next
```

### Docker
```dockerfile
# Przykładowy Dockerfile w repozytorium
docker build -t universe-mapmaker .
docker run -p 3000:3000 universe-mapmaker
```

## 📄 License

MIT License - patrz [LICENSE](LICENSE) file.

## 🤝 Contributing

1. Fork repo
2. Stwórz branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Otwórz Pull Request

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Dokumentacja Mapbox**: [docs.mapbox.com](https://docs.mapbox.com/)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

---

Made with ❤️ using Mapbox GL JS + Next.js