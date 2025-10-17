# System Autentykacji - Dokumentacja Techniczna

## 📚 Spis Treści
1. [Architektura Systemu](#architektura-systemu)
2. [Przepływ Logowania](#przepływ-logowania)
3. [Persystencja Stanu](#persystencja-stanu)
4. [Wykorzystanie w Komponentach](#wykorzystanie-w-komponentach)
5. [Kluczowe Pliki](#kluczowe-pliki)
6. [Rozwiązane Problemy](#rozwiązane-problemy)

---

## 🏗️ Architektura Systemu

### Hierarchia Providerów
```
app/layout.tsx (root)
  └─ Providers.tsx
      ├─ ErrorBoundary
      ├─ Redux Provider (store)
      │   └─ AuthProvider ← PRZYWRACA AUTH Z LOCALSTORAGE
      │       └─ ThemeProvider (MUI)
      │           └─ CssBaseline
      │           └─ {children}
      │           └─ NotificationProvider
```

**Kolejność ma znaczenie!**
- `Redux Provider` musi być na zewnątrz (zapewnia store)
- `AuthProvider` w środku (używa Redux hooks)
- `AuthProvider` wykonuje się **przed pierwszym renderem** aplikacji

---

## 🔐 Przepływ Logowania

### 1. Strona Logowania (`app/auth/page.tsx`)

**Lokalizacja:** [app/auth/page.tsx](../app/auth/page.tsx:67-88)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  if (activeTab === 0) {
    // Login
    const response = await authService.login({
      username: formData.email,
      password: formData.password,
    });

    // Zapisuje do Redux + localStorage
    dispatch(setAuth({
      user: response.user,
      token: response.token,
    }));

    router.push('/dashboard');
  }
};
```

**Co się dzieje:**
1. Użytkownik wpisuje email i hasło
2. Kliknięcie "Zaloguj się" wywołuje `authService.login()`
3. Backend zwraca `{ user: {...}, token: "..." }`
4. `dispatch(setAuth(...))` zapisuje do Redux **i localStorage**
5. Przekierowanie do `/dashboard`

---

### 2. Auth Service (`src/api/endpointy/auth.ts`)

**Lokalizacja:** [src/api/endpointy/auth.ts](../src/api/endpointy/auth.ts:27-36)

```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

  // Zapisuje token do localStorage (opcjonalnie, authSlice też to robi)
  if (response.token) {
    apiClient.setToken(response.token);
  }

  return response;
}
```

**Endpoint:** `POST https://api.universemapmaker.online/auth/login`

**Request:**
```json
{
  "username": "user@example.com",
  "password": "haslo123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski"
  },
  "token": "abc123xyz456..."
}
```

---

### 3. Redux State Management (`src/redux/slices/authSlice.ts`)

**Lokalizacja:** [src/redux/slices/authSlice.ts](../src/redux/slices/authSlice.ts:22-32)

```typescript
setAuth: (state, action: PayloadAction<{ user: User; token: string }>) => {
  state.user = action.payload.user;
  state.token = action.payload.token;
  state.isAuthenticated = true;

  // ✅ Zapisuje do localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', action.payload.token);
    localStorage.setItem('user', JSON.stringify(action.payload.user));
  }
}
```

**Stan Redux:**
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Akcje:**
- `setAuth({ user, token })` - Zapisuje użytkownika i token
- `clearAuth()` - Wylogowuje (czyści Redux + localStorage)
- `setLoading(bool)` - Ustawia stan ładowania
- `updateUser(user)` - Aktualizuje dane użytkownika

---

## 💾 Persystencja Stanu (localStorage)

### Zapis przy Logowaniu

**Kiedy:** Po udanym logowaniu przez `dispatch(setAuth(...))`

**Gdzie:** `authSlice.ts` reducer (linie 28-30)

**Klucze localStorage:**
- `authToken` - Token autoryzacyjny (string)
- `user` - Dane użytkownika (JSON)

**Przykład:**
```javascript
localStorage.authToken = "abc123xyz456..."
localStorage.user = '{"id":1,"username":"user","email":"user@example.com",...}'
```

---

### Przywracanie przy Starcie Aplikacji

**Komponent:** `AuthProvider` (`src/features/autoryzacja/AuthProvider.tsx`)

**Lokalizacja:** [src/features/autoryzacja/AuthProvider.tsx:40-62](../src/features/autoryzacja/AuthProvider.tsx:40-62)

```typescript
useEffect(() => {
  const initAuth = async () => {
    dispatch(setLoading(true));

    try {
      // ✅ Odczytuje z localStorage (poprawione klucze!)
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (token && user) {
        // Przywraca do Redux
        dispatch(setAuth({ token, user }));
        console.log('✅ Auth state restored:', user.username);
      } else {
        console.log('ℹ️ No stored auth state found');
      }
    } catch (error) {
      console.error('❌ Failed to restore auth state:', error);
    } finally {
      dispatch(setLoading(false));
      setIsInitialized(true);
    }
  };

  initAuth();
}, [dispatch]);
```

**Przepływ:**
1. Aplikacja się uruchamia
2. `Providers.tsx` renderuje `<AuthProvider>`
3. `AuthProvider` wykonuje `useEffect` **przed renderem dzieci**
4. Odczytuje `authToken` i `user` z localStorage
5. Jeśli znalezione → `dispatch(setAuth(...))` przywraca stan
6. Ustawia `isInitialized = true`
7. Dopiero teraz renderuje `{children}` (reszta aplikacji)

**Efekt:** Żadnego "migotania" UI - użytkownik od razu widzi się jako zalogowany!

---

### Wylogowanie

**Funkcja:** `clearAuth()` (authSlice.ts:33-42)

```typescript
clearAuth: (state) => {
  state.user = null;
  state.token = null;
  state.isAuthenticated = false;

  // Usuwa z localStorage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }
}
```

**Używane w:**
- `DashboardLayout.tsx:90-94` - Przycisk wylogowania
- `RightFABToolbar.tsx` - Menu użytkownika
- `app/auth/page.tsx` - Automatyczne wylogowanie przy błędach

---

## 🎯 Wykorzystanie w Komponentach

### Odczytywanie Stanu Autentykacji

**Pattern używany we wszystkich komponentach:**

```typescript
import { useAppSelector } from '@/redux/hooks';

const { user, isAuthenticated, isLoading } = useAppSelector(state => state.auth);
```

**Przykłady użycia:**

#### 1. DashboardLayout (`src/features/dashboard/komponenty/DashboardLayout.tsx:67`)
```typescript
const { user, isAuthenticated } = useAppSelector(state => state.auth);

// Sprawdzanie czy admin
const isAdmin = user?.email?.includes('@universemapmaker.online') || user?.username === 'admin';

// Warunkowe renderowanie menu
{isAuthenticated ? (
  <MenuItem onClick={handleLogout}>Wyloguj</MenuItem>
) : (
  <MenuItem onClick={handleLogin}>Zaloguj się</MenuItem>
)}
```

#### 2. RightFABToolbar (`src/features/narzedzia/RightFABToolbar.tsx:265-268`)
```typescript
const { user, isAuthenticated } = useAppSelector((state) => state.auth);

// Filtrowanie FABs wymagających autoryzacji
const tools = allTools.filter(tool => {
  if (!isAuthenticated && tool.authRequired) {
    return false; // Ukryj jeśli nie zalogowany
  }
  return true;
});

// Kolor avatara zależny od stanu logowania
<Avatar sx={{
  bgcolor: isAuthenticated ? '#10b981' : '#f97316', // Zielony/Pomarańczowy
}}>
  <AccountCircle />
</Avatar>
```

#### 3. OwnProjects (`src/features/dashboard/komponenty/OwnProjects.tsx`)
```typescript
const { isAuthenticated } = useAppSelector(state => state.auth);

// Blokada akcji dla gości
const handleCreateProject = () => {
  if (!isAuthenticated) {
    alert('Musisz być zalogowany, aby tworzyć projekty');
    return;
  }
  // ... logika tworzenia projektu
};
```

---

### FABs z Autoryzacją (`RightFABToolbar.tsx`)

**FABs wymagające logowania (`authRequired: true`):**

| FAB | Tooltip | Funkcja |
|-----|---------|---------|
| 📍 Place | Wyszukiwanie działek | Parcel search |
| ✏️ Edit | Edycja | Edit mode |
| 🏗️ Architecture | Narzędzia geometrii | Geometry tools |
| ✂️ Crop | Przycinanie do maski | Crop to mask |

**Logika filtrowania (linie 277-283):**
```typescript
const tools = allTools.filter(tool => {
  if (!isAuthenticated && tool.authRequired) {
    return false; // Ukryj jeśli gość i FAB wymaga autoryzacji
  }
  return true;
});
```

**Rezultat:**
- Zalogowany użytkownik: widzi wszystkie 12 FABs
- Gość: widzi 8 FABs (bez Place, Edit, Architecture, Crop)

---

## 📁 Kluczowe Pliki

### 1. Providers i Layout
| Plik | Rola | Linie kluczowe |
|------|------|----------------|
| `app/layout.tsx` | Root layout, renderuje Providers | 64-66 |
| `src/common/Providers.tsx` | Hierarchia providerów (Redux → Auth → Theme) | 26-35 |
| `src/features/autoryzacja/AuthProvider.tsx` | Przywraca auth z localStorage | 40-62 |

### 2. Redux State Management
| Plik | Rola | Linie kluczowe |
|------|------|----------------|
| `src/redux/store.ts` | Konfiguracja Redux store | 16-54 |
| `src/redux/slices/authSlice.ts` | Auth reducer (setAuth, clearAuth) | 22-55 |
| `src/redux/hooks.ts` | Typed Redux hooks (useAppSelector, useAppDispatch) | 1-15 |

### 3. API i Backend
| Plik | Rola | Endpoint |
|------|------|----------|
| `src/api/endpointy/auth.ts` | Auth service (login, logout, getProfile) | POST /auth/login |
| `src/api/klient/client.ts` | HTTP client z token management | - |
| `.env.local` | Konfiguracja API URL | NEXT_PUBLIC_API_URL |

### 4. UI Components
| Plik | Rola | Auth Usage |
|------|------|-----------|
| `app/auth/page.tsx` | Strona logowania/rejestracji | dispatch(setAuth) |
| `src/features/dashboard/komponenty/DashboardLayout.tsx` | Layout dashboard z menu użytkownika | useAppSelector(auth) |
| `src/features/narzedzia/RightFABToolbar.tsx` | Prawy pasek FABs | Filtrowanie authRequired |

---

## 🐛 Rozwiązane Problemy

### Problem #1: Niespójne klucze localStorage (NAPRAWIONY ✅)

**Opis błędu:**
- `authSlice.ts` zapisywał: `authToken`, `user`
- `AuthProvider.tsx` odczytywał: `auth_token`, `auth_user`

**Skutek:**
Stan autoryzacji nie był przywracany po przeładowaniu strony - użytkownik musiał logować się ponownie.

**Rozwiązanie:**
Poprawiono `AuthProvider.tsx` (linie 21-24), aby używał tych samych kluczy co `authSlice.ts`:

```typescript
// ❌ PRZED (błędne klucze)
const token = localStorage.getItem('auth_token');
const userStr = localStorage.getItem('auth_user');

// ✅ PO (poprawne klucze)
const token = localStorage.getItem('authToken');
const userStr = localStorage.getItem('user');
```

---

### Problem #2: CORS Error przy logowaniu (NAPRAWIONY ✅)

**Opis błędu:**
```
Access to fetch at 'http://34.0.251.33/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Przyczyna:**
Brak pliku `.env.local` → `NEXT_PUBLIC_API_URL` używał fallbacku (IP address zamiast HTTPS URL)

**Rozwiązanie:**
Utworzono `.env.local`:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ
NEXT_PUBLIC_API_URL=https://api.universemapmaker.online
```

---

## 🧪 Testowanie Systemu Autentykacji

### Test 1: Logowanie i Zapis do localStorage
```javascript
// 1. Zaloguj się przez /auth
// 2. Otwórz DevTools → Application → Local Storage
// 3. Sprawdź obecność kluczy:
localStorage.getItem('authToken');  // "abc123xyz..."
localStorage.getItem('user');       // '{"id":1,"username":"..."}'
```

### Test 2: Persystencja po Przeładowaniu
```javascript
// 1. Zaloguj się
// 2. Przeładuj stronę (F5)
// 3. Sprawdź console log:
// "✅ Auth state restored: username"
// 4. Sprawdź Redux state:
// state.auth.isAuthenticated === true
```

### Test 3: Wylogowanie i Czyszczenie
```javascript
// 1. Zaloguj się
// 2. Kliknij "Wyloguj" w menu
// 3. Sprawdź localStorage:
localStorage.getItem('authToken');  // null
localStorage.getItem('user');       // null
// 4. Sprawdź Redux state:
// state.auth.isAuthenticated === false
```

### Test 4: Filtrowanie FABs
```javascript
// 1. Otwórz /map jako gość
// 2. Policz FABs → powinno być 8 (bez Place, Edit, Architecture, Crop)
// 3. Zaloguj się
// 4. Policz FABs → powinno być 12 (wszystkie widoczne)
```

---

## 📊 Diagram Przepływu Danych

```
┌─────────────────────────────────────────────────────────────────────┐
│                       INITIAL APP LOAD                              │
│                                                                     │
│  1. app/layout.tsx                                                  │
│      └─ Providers.tsx                                               │
│          └─ Redux Provider                                          │
│              └─ AuthProvider ← CHECK LOCALSTORAGE                   │
│                  ├─ localStorage.getItem('authToken')               │
│                  ├─ localStorage.getItem('user')                    │
│                  └─ dispatch(setAuth({ token, user }))              │
│                                                                     │
│  2. Redux Store (state.auth)                                        │
│      ├─ user: { id, username, email, ... }                         │
│      ├─ token: "abc123xyz..."                                      │
│      ├─ isAuthenticated: true                                      │
│      └─ isLoading: false                                           │
│                                                                     │
│  3. Components (useAppSelector)                                     │
│      ├─ DashboardLayout → Menu użytkownika                         │
│      ├─ RightFABToolbar → Filtrowanie FABs                         │
│      └─ OwnProjects → Blokada akcji dla gości                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                                  │
│                                                                     │
│  1. User fills form (app/auth/page.tsx)                            │
│      ├─ Email: user@example.com                                    │
│      └─ Password: haslo123                                         │
│                                                                     │
│  2. Click "Zaloguj się"                                             │
│      └─ handleSubmit() → authService.login()                       │
│                                                                     │
│  3. API Call (src/api/endpointy/auth.ts)                           │
│      POST https://api.universemapmaker.online/auth/login           │
│      Request: { username, password }                               │
│      Response: { user: {...}, token: "..." }                       │
│                                                                     │
│  4. Update Redux (dispatch setAuth)                                │
│      ├─ state.auth.user = response.user                            │
│      ├─ state.auth.token = response.token                          │
│      ├─ state.auth.isAuthenticated = true                          │
│      └─ localStorage.setItem('authToken', token)                   │
│      └─ localStorage.setItem('user', JSON.stringify(user))         │
│                                                                     │
│  5. Redirect to /dashboard                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        LOGOUT FLOW                                  │
│                                                                     │
│  1. User clicks "Wyloguj" (DashboardLayout.tsx)                    │
│      └─ handleLogout() → dispatch(clearAuth())                     │
│                                                                     │
│  2. Clear Redux State (authSlice.ts)                               │
│      ├─ state.auth.user = null                                     │
│      ├─ state.auth.token = null                                    │
│      ├─ state.auth.isAuthenticated = false                         │
│      └─ localStorage.removeItem('authToken')                       │
│      └─ localStorage.removeItem('user')                            │
│                                                                     │
│  3. Redirect to /auth?tab=0                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Bezpieczeństwo

### Token Authorization
- Token przechowywany w `localStorage` (nie `sessionStorage` → persystencja)
- Token wysyłany w nagłówku `Authorization: Token abc123...`
- Backend waliduje token przy każdym request

### HTTPS Only
- Produkcja: `https://api.universemapmaker.online` (SSL)
- Lokalne: `http://localhost:3000` (CORS exception)

### XSS Protection
- Next.js automatycznie escapuje output
- JSON.parse() w try/catch (AuthProvider.tsx:27)
- Brak `dangerouslySetInnerHTML`

### Token Expiration
- Backend odpowiada 401 Unauthorized przy wygasłym tokenie
- Frontend automatycznie wylogowuje (apiClient error handler)

---

## 🚀 Rozszerzenia Przyszłościowe

### Sugerowane Ulepszenia:
1. **Refresh Token** - Auto-odświeżanie wygasłych tokenów
2. **Secure Storage** - Przeniesienie tokenu do `httpOnly` cookie (bezpieczniejsze niż localStorage)
3. **Session Timeout** - Auto-wylogowanie po 30min nieaktywności
4. **Multi-Device Sync** - Broadcast logout na wszystkie otwarte karty (BroadcastChannel API)
5. **Remember Me** - Opcjonalne przedłużenie sesji (checkbox przy logowaniu)

---

## 📞 Kontakt i Wsparcie

W razie problemów z autentykacją:
1. Sprawdź console log: `✅ Auth state restored` / `ℹ️ No stored auth state found`
2. Sprawdź localStorage (DevTools → Application → Local Storage)
3. Sprawdź Redux state (Redux DevTools → state.auth)
4. Sprawdź network tab (DevTools → Network → POST /auth/login)

**Główne pliki do debugowania:**
- `AuthProvider.tsx` - Przywracanie stanu
- `authSlice.ts` - Redux state management
- `auth.ts` - API calls
- `client.ts` - HTTP client

---

**Ostatnia aktualizacja:** 2025-10-17
**Wersja dokumentu:** 1.0
**Status:** ✅ System w pełni funkcjonalny po naprawie kluczy localStorage
