# Instrukcja uruchomienia na laptopie

## Problem
Next.js 15 ma problem z hot-reload - webpack cache nie aktualizuje się mimo zmian w plikach źródłowych. Zmiany SĄ zapisane w Git, ale wymagają pełnego rebuildu.

## Co zostało zrobione
✅ Wszystkie API URLs zmienione z Railway na GCP VM (http://34.0.251.33)
✅ Pliki zaktualizowane:
- src/lib/api/auth.ts
- src/lib/api/dashboard.ts
- src/services/api.ts
- next.config.mjs (dodano sekcję env)

✅ Zmiany zacommitowane do Git (commit: 3ed8a5d)

## Uruchomienie na laptopie

### 1. Sklonuj/pobierz najnowszy kod
```bash
cd /path/to/Universe-MapMaker.online
git pull origin main
```

### 2. Usuń CAŁKOWICIE cache i node_modules
```bash
rm -rf .next
rm -rf node_modules
rm -rf .next-cache
```

### 3. Zainstaluj zależności od nowa
```bash
npm install
```

### 4. Uruchom production build (nie dev!)
```bash
npm run build
npm run start
```

**LUB jeśli chcesz dev mode:**
```bash
npm run dev
```

### 5. Otwórz w NOWEJ przeglądarce (tryb incognito)
```bash
# Chrome/Edge
Ctrl+Shift+N → http://localhost:3000

# Firefox
Ctrl+Shift+P → http://localhost:3000
```

## Weryfikacja
W konsoli przeglądarki powinieneś zobaczyć:
❌ Błąd: `https://universe-mapmaker-backend-production.up.railway.app` (ŹLE!)
✅ OK: `http://34.0.251.33` (DOBRZE!)

## Jeśli nadal Railway URL
Sprawdź skompilowany kod:
```bash
grep -r "universe-mapmaker-backend-production" .next/
```

Jeśli znajdzie Railway URL w .next/ - znaczy że build się nie zaktualizował.

Rozwiązanie:
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
npm run start
```

## Backend status
- ✅ GCP VM backend działa: http://34.0.251.33
- ✅ Railway database działa: centerbeam.proxy.rlwy.net:38178
- ❌ Railway backend wyłączony (przez Ciebie)

## Next steps po uruchomieniu
1. Przetestuj login na froncie z GCP backendem
2. Jeśli działa → deploy na Cloud Run
3. Zaktualizuj cloudbuild.yaml z nowym URL
4. Wyłącz Railway backend kompletnie (zostaw tylko DB)
