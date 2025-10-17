# Universe MapMaker - Dokumentacja Techniczna

## 📚 Spis Treści

Ta dokumentacja zawiera kompletne informacje techniczne o projekcie Universe MapMaker.

---

## 📖 Dostępne Dokumenty

### 1. [API Endpoints](API_ENDPOINTS.md) 🌐
**Rozmiar:** 27 KB | **Data:** 2025-10-17 | **Status:** ✅ Aktualny

Kompletna lista wszystkich 120 API endpoints z którymi łączy się aplikacja.

**Zawartość:**
- ✅ **Projects API** - 52 endpointy (projekty, import/export QGS, publikacja)
- ✅ **Layers API** - 44 endpointy (warstwy, features, styling, atrybuty)
- ✅ **Styles API** - 10 endpointów (renderery, symbole, klasyfikacja)
- ✅ **Admin API** - 3 endpointy (statystyki, zarządzanie użytkownikami)
- ✅ **Auth API** - 4 endpointy (rejestracja, logowanie, profil)
- ✅ **External APIs** - 7 endpointów Mapbox (geocoding, search, directions)

**Przydatne dla:**
- Integracji z backendem
- Tworzenia nowych funkcji
- Debugowania błędów API
- Rozumienia dostępnych operacji

**Sekcje:**
- Request/Response examples dla każdego endpointu
- RTK Query hooks - lista wszystkich auto-generowanych hooków
- Authentication patterns - jak używać tokenów
- File upload patterns - 3 różne wzorce
- Cache invalidation - system tagów RTK Query
- Error handling - standardowy format błędów
- Best practices - 5 najważniejszych zasad
- Troubleshooting - częste problemy i rozwiązania

---

### 2. [Authentication System](AUTHENTICATION_SYSTEM.md) 🔐
**Rozmiar:** 20 KB | **Data:** 2025-10-17 | **Status:** ✅ Aktualny

Kompleksowa dokumentacja systemu autentykacji i persystencji stanu logowania.

**Zawartość:**
- ✅ **Architektura Systemu** - Hierarchia Providerów (Redux → Auth → Theme)
- ✅ **Przepływ Logowania** - Od formularza do localStorage
- ✅ **Persystencja Stanu** - Jak stan logowania przetrwa przeładowanie strony
- ✅ **Wykorzystanie w Komponentach** - Patterns dla wszystkich komponentów
- ✅ **Rozwiązane Problemy** - Naprawa localStorage keys, CORS errors

**Przydatne dla:**
- Zrozumienia jak działa logowanie
- Dodawania auth-protected features
- Debugowania problemów z sesją
- Implementacji nowych auth patterns

**Kluczowe Koncepty:**
- `AuthProvider` - Przywraca auth z localStorage przed pierwszym renderem
- `authSlice` - Redux state management (setAuth, clearAuth, updateUser)
- Token Storage - `localStorage.authToken`, `localStorage.user`
- Cache Invalidation - RTK Query patterns dla auth-dependent data
- FAB Filtering - Ukrywanie funkcji dla niezalogowanych użytkowników

**Diagramy:**
- Initial App Load Flow
- Login Flow (form → API → Redux → localStorage)
- Logout Flow (clear Redux + localStorage)
- FAB Filtering Logic

---

### 3. [Right FAB Toolbar System](RIGHT_FAB_TOOLBAR_SYSTEM.md) 🎨
**Rozmiar:** 7 KB | **Data:** 2025-10-17 | **Status:** ✅ Aktualny

Dokumentacja zunifikowanego systemu Floating Action Buttons (FAB) na prawym pasku mapy.

**Zawartość:**
- ✅ **Lista wszystkich 12 FABs** - Ikony, kolory, funkcje, wymagania auth
- ✅ **Architektura komponentu** - Struktura kodu, responsywność
- ✅ **Authentication Filtering** - Ukrywanie FABs dla gości
- ✅ **User Avatar States** - Zielony (zalogowany), pomarańczowy (gość)
- ✅ **Integration Guide** - Jak dodać nowy FAB

**Przydatne dla:**
- Dodawania nowych narzędzi do mapy
- Zrozumienia layoutu prawego paska
- Debugowania problemów z FABami
- Modyfikacji istniejących funkcji

**12 FABs:**
1. 👤 **User Avatar** (Top) - Status logowania, menu użytkownika
2. 📍 **Place** (Red) - Wyszukiwanie działek [Auth Required]
3. ✏️ **Edit** (Red) - Edycja [Auth Required]
4. 🏗️ **Architecture** (Red) - Narzędzia geometrii [Auth Required]
5. 📏 **Straighten** (Red) - Pomiary
6. 🔍 **Search** (Red) - Wyszukiwanie
7. ℹ️ **Info** (White) - Identyfikacja obiektów
8. 🖨️ **Print** (White) - Drukowanie
9. 🗺️ **Map** (White) - Warstwy
10. ✂️ **Crop** (White) - Przycinanie [Auth Required]
11. ⌨️ **Keyboard** (White) - Skróty klawiszowe
12. 📧 **Email** (White) - Kontakt

**Features:**
- Scrollable container - Wszystkie FABy dostępne przez scroll
- Responsive sizing - 44px (mobile) vs 56px (desktop)
- Haptic feedback - Wibracja na mobile przy kliknięciu
- Hover animations - Scale effect bez clippingu
- Separations - Dwie sekcje: główne narzędzia + dodatkowe

---

## 🚀 Quick Start

### Dla Nowych Developerów

1. **Zacznij od API Endpoints**
   - Dowiedz się jakie endpointy są dostępne
   - Zobacz przykłady request/response
   - Naucz się używać RTK Query hooks

2. **Zrozum Authentication System**
   - Jak działa logowanie i persystencja
   - Jak chronić komponenty wymagające auth
   - Jak filtrować funkcje dla gości

3. **Poznaj FAB Toolbar**
   - Jakie narzędzia są dostępne
   - Jak dodać nowy FAB
   - Jak działa authentication filtering

---

## 🔧 Gdzie Szukać Informacji

| Szukasz... | Sprawdź dokument... |
|------------|---------------------|
| **Endpoint nie działa** | [API_ENDPOINTS.md](API_ENDPOINTS.md) → Troubleshooting |
| **Logowanie nie działa** | [AUTHENTICATION_SYSTEM.md](AUTHENTICATION_SYSTEM.md) → Resolved Problems |
| **Dodać nowy przycisk** | [RIGHT_FAB_TOOLBAR_SYSTEM.md](RIGHT_FAB_TOOLBAR_SYSTEM.md) → Integration Guide |
| **Request format** | [API_ENDPOINTS.md](API_ENDPOINTS.md) → Request/Response Examples |
| **localStorage keys** | [AUTHENTICATION_SYSTEM.md](AUTHENTICATION_SYSTEM.md) → Persistence |
| **RTK Query hook** | [API_ENDPOINTS.md](API_ENDPOINTS.md) → RTK Query Hooks |
| **Auth-protected feature** | [AUTHENTICATION_SYSTEM.md](AUTHENTICATION_SYSTEM.md) → Component Usage |
| **FAB nie jest widoczny** | [RIGHT_FAB_TOOLBAR_SYSTEM.md](RIGHT_FAB_TOOLBAR_SYSTEM.md) → Authentication Filtering |

---

## 📊 Statystyki Projektu

| Metryka | Wartość |
|---------|---------|
| **Total API Endpoints** | 120 |
| **RTK Query APIs** | 4 (projectsApi, layersApi, stylesApi, adminApi) |
| **Auto-generated Hooks** | 67 |
| **Authenticated Endpoints** | 108 (90%) |
| **Public Endpoints** | 12 (10%) |
| **FAB Components** | 12 |
| **Auth-Required FABs** | 4 (Place, Edit, Architecture, Crop) |
| **Redux Slices** | 8 (map, layers, draw, auth, features, projects, notification, + 4 RTK Query) |

---

## 🎯 Best Practices

### 1. API Calls
✅ **Zawsze używaj RTK Query hooks zamiast bezpośrednich fetch calls**
```typescript
// ✅ CORRECT
const { data, isLoading, error } = useGetProjectsQuery();

// ❌ WRONG
fetch('/api/projects/...')
```

### 2. Authentication
✅ **Zawsze sprawdzaj isAuthenticated przed operacjami wymagającymi auth**
```typescript
const { isAuthenticated } = useAppSelector(state => state.auth);

if (!isAuthenticated) {
  alert('Musisz być zalogowany');
  return;
}
```

### 3. Project Operations
✅ **Zawsze używaj db_name z response create endpoint**
```typescript
// ✅ CORRECT
const result = await createProject({ project: 'MyProject' });
const projectName = result.data.db_name; // "MyProject_1"

// ❌ WRONG
const projectName = 'MyProject'; // May fail if duplicate!
```

### 4. Error Handling
✅ **Zawsze obsługuj błędy z RTK Query mutations**
```typescript
try {
  await createProject(data).unwrap();
  // Success
} catch (err) {
  console.error('Error:', err.data?.message || 'Unknown error');
}
```

### 5. Cache Invalidation
✅ **Zawsze invaliduj odpowiednie tagi po mutacjach**
```typescript
// Automatically handled by RTK Query endpoints
// Manual invalidation only when needed:
dispatch(projectsApi.util.invalidateTags([{ type: 'Projects', id: 'LIST' }]));
```

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Przyczyna:** Brak tokenu lub wygasły token
**Rozwiązanie:**
1. Sprawdź `localStorage.getItem('authToken')`
2. Zweryfikuj token z `/auth/profile`
3. Ponownie zaloguj się jeśli token wygasł

### Issue: CORS Error
**Przyczyna:** Nieprawidłowy port lub URL
**Rozwiązanie:**
1. Local dev MUSI używać `http://localhost:3000` (nie 3001, 3002, etc.)
2. Sprawdź `NEXT_PUBLIC_API_URL` w `.env.local`

### Issue: Cache Not Updating
**Przyczyna:** Brak invalidacji tagów
**Rozwiązanie:**
1. Sprawdź czy endpoint invaliduje odpowiednie tagi
2. Użyj `refetch()` do wymuszenia odświeżenia
3. Manualnie invaliduj tagi jeśli potrzeba

### Issue: localStorage Keys Mismatch
**Przyczyna:** Różne klucze w różnych plikach
**Rozwiązanie:**
- Zawsze używaj: `authToken` i `user` (nie `auth_token`, `auth_user`)
- Zobacz: [AUTHENTICATION_SYSTEM.md](AUTHENTICATION_SYSTEM.md) → Resolved Problems

---

## 📞 Support & Resources

### Documentation Files
- **[API_ENDPOINTS.md](API_ENDPOINTS.md)** - 120 endpoints, RTK Query hooks, examples
- **[AUTHENTICATION_SYSTEM.md](AUTHENTICATION_SYSTEM.md)** - Auth flow, persistence, patterns
- **[RIGHT_FAB_TOOLBAR_SYSTEM.md](RIGHT_FAB_TOOLBAR_SYSTEM.md)** - FAB system, integration guide

### External Resources
- [Redux Toolkit Docs](https://redux-toolkit.js.org/)
- [RTK Query Docs](https://redux-toolkit.js.org/rtk-query/overview)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Material-UI v7 Docs](https://mui.com/)
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/api/)

### Debug Tools
- **Redux DevTools** - Inspect state, actions, time-travel debugging
- **Network Tab** - Monitor API requests/responses
- **React DevTools** - Component tree, props, hooks
- **Console Logs** - RTK Query automatic logging

---

## 📝 Document History

| Dokument | Data Utworzenia | Ostatnia Aktualizacja | Rozmiar | Status |
|----------|-----------------|------------------------|---------|--------|
| API_ENDPOINTS.md | 2025-10-17 | 2025-10-17 19:58 | 27 KB | ✅ Aktualny |
| AUTHENTICATION_SYSTEM.md | 2025-10-17 | 2025-10-17 19:39 | 20 KB | ✅ Aktualny |
| RIGHT_FAB_TOOLBAR_SYSTEM.md | 2025-10-17 | 2025-10-17 18:32 | 7 KB | ✅ Aktualny |

**Total Documentation Size:** 54 KB (3 files)

**Poprzednio:** 54 dokumenty (51 przestarzałych usuniętych)

---

## ✨ Contributing

Kiedy dodajesz nową funkcjonalność:

1. **Aktualizuj odpowiedni dokument:**
   - Nowy endpoint → `API_ENDPOINTS.md`
   - Auth zmiana → `AUTHENTICATION_SYSTEM.md`
   - Nowy FAB → `RIGHT_FAB_TOOLBAR_SYSTEM.md`

2. **Dodaj przykłady użycia:**
   - Request/Response examples
   - Code snippets
   - Common pitfalls

3. **Aktualizuj statystyki:**
   - Total endpoints count
   - New hooks list
   - FAB components count

4. **Commit message format:**
   ```
   docs: update [DOCUMENT_NAME] - [brief description]

   - Added new endpoint: POST /api/...
   - Updated example for ...
   - Fixed typo in ...
   ```

---

**Last Updated:** 2025-10-17
**Maintained By:** Development Team
**Version:** 1.0.0
**Status:** ✅ Active, Up-to-Date

---

## 📧 Contact

Masz pytania dotyczące dokumentacji?
- Sprawdź [Common Issues](#-common-issues--solutions)
- Zobacz [Best Practices](#-best-practices)
- Przeczytaj odpowiedni dokument szczegółowy

**Happy Coding! 🚀**
