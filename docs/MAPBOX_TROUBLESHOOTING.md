# 🔧 Mapbox Token - Rozwiązywanie Problemów

## 🎯 Strona testowa
Użyj strony testowej do diagnozowania problemów:
- **Lokalnie**: http://localhost:3002/mapbox-test
- **Cloud Run**: https://universe-mapmaker-576538488457.europe-central2.run.app/mapbox-test

## ❌ Częste problemy i rozwiązania

### Problem: Mapa działa lokalnie, ale nie na Cloud Run

**Objawy:**
- Lokalnie: Mapa ładuje się poprawnie
- Cloud Run: Błąd "Brak tokenu Mapbox" lub mapa nie ładuje się

**Przyczyny i rozwiązania:**

#### 1. Token nie ma ustawionych URL restrictions ✅

**Rozwiązanie:**
1. Zaloguj się na https://account.mapbox.com
2. Przejdź do: Account → Access Tokens
3. Znajdź token: `pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ...`
4. Kliknij na token aby go edytować
5. W sekcji "URL restrictions" dodaj:
   ```
   https://*.run.app/*
   https://universe-mapmaker-*.europe-central2.run.app/*
   https://universe-mapmaker-576538488457.europe-central2.run.app/*
   http://localhost:3000/*
   http://localhost:3001/*
   http://localhost:3002/*
   ```
6. Zapisz zmiany

#### 2. Token nie jest ustawiony w Cloud Run ✅

**Sprawdzenie:**
```bash
gcloud run services describe universe-mapmaker \
  --region europe-central2 \
  --format "value(spec.template.spec.containers[0].env[].name)"
```

**Rozwiązanie:**
```bash
# Opcja 1: Użyj skryptu
./scripts/update-mapbox-token.sh

# Opcja 2: Ręcznie
gcloud run services update universe-mapmaker \
  --update-env-vars NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ \
  --region europe-central2
```

#### 3. Używana jest zła nazwa zmiennej ✅

**Problem:** Kod szuka `NEXT_PUBLIC_MAPBOX_TOKEN` ale w Cloud Run jest `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

**Rozwiązanie:** Ustaw obie zmienne dla kompatybilności:
```bash
gcloud run services update universe-mapmaker \
  --update-env-vars "NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_TOKEN,NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=YOUR_TOKEN" \
  --region europe-central2
```

### Problem: Błąd 401 Unauthorized

**Przyczyna:** Token nie ma odpowiednich URL restrictions

**Rozwiązanie:** Zobacz punkt 1 powyżej

### Problem: Błąd 403 Forbidden

**Przyczyna:** Token nie ma odpowiednich scopów

**Rozwiązanie:**
1. W Mapbox Console, edytuj token
2. Upewnij się że ma te scopy:
   - ✅ styles:read
   - ✅ fonts:read
   - ✅ datasets:read
   - ✅ vision:read (jeśli używasz 3D)

## 🔍 Diagnostyka

### 1. Sprawdź logi Cloud Run
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=universe-mapmaker" \
  --limit 50 \
  --format json | grep -i mapbox
```

### 2. Sprawdź status tokenu na stronie testowej
1. Otwórz: https://universe-mapmaker-576538488457.europe-central2.run.app/mapbox-test
2. Sprawdź panel "Token Information"
3. Zobacz "Debug Logs" na dole strony

### 3. Test API bezpośrednio
```bash
# Test lokalny
curl "https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=YOUR_TOKEN"

# Powinno zwrócić: {"version":8,"name":"Mapbox Streets",...}
```

## 📝 Checklist przed wdrożeniem

- [ ] Token jest ustawiony w `.env.local`
- [ ] Token ma prefix `pk.` i ma ~100 znaków
- [ ] URL restrictions są skonfigurowane w Mapbox Console
- [ ] Token jest ustawiony w `cloudbuild.yaml`
- [ ] Obie zmienne są ustawione: `NEXT_PUBLIC_MAPBOX_TOKEN` i `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- [ ] Strona testowa działa lokalnie: http://localhost:3002/mapbox-test

## 🚀 Komendy pomocnicze

```bash
# Wdróż z tokenem
gcloud run deploy universe-mapmaker \
  --source . \
  --region europe-central2 \
  --set-env-vars NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwbWFrZXItb25saW5lIiwiYSI6ImNtZzN3bm8wYTBwaXIybHM5dDlpc3YwOTQifQ.8Hrv97gishqnvI_h7PiqlQ

# Sprawdź aktualną konfigurację
gcloud run services describe universe-mapmaker \
  --region europe-central2 \
  --format yaml | grep NEXT_PUBLIC_MAPBOX

# Zobacz logi
gcloud logging read "resource.type=cloud_run_revision" \
  --limit 20 \
  --format "table(timestamp,jsonPayload.message)"
```

## 🔗 Przydatne linki

- **Mapbox Console**: https://account.mapbox.com/access-tokens/
- **Cloud Run Console**: https://console.cloud.google.com/run/detail/europe-central2/universe-mapmaker
- **Test Page (prod)**: https://universe-mapmaker-576538488457.europe-central2.run.app/mapbox-test
- **Test Page (local)**: http://localhost:3002/mapbox-test