# Quick Import - automatyczny import warstwy z tokenem
# Wymaga uruchomionej przeglądarki z zalogowanym użytkownikiem

Write-Host "🚀 Automatyczny import warstwy 'Działki Kolbudy'" -ForegroundColor Cyan
Write-Host ""

# Krok 1: Sprawdź, czy aplikacja działa
Write-Host "📡 Sprawdzanie połączenia z aplikacją..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -UseBasicParsing
    Write-Host "✅ Aplikacja działa na http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Błąd: Aplikacja nie działa na http://localhost:3000" -ForegroundColor Red
    Write-Host "   Uruchom aplikację: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Krok 2: Pobierz token z przeglądarki
Write-Host "🔑 Instrukcja pobrania tokena:" -ForegroundColor Yellow
Write-Host "   1. Otwórz http://localhost:3000 w przeglądarce" -ForegroundColor White
Write-Host "   2. Zaloguj się (jeśli nie jesteś)" -ForegroundColor White
Write-Host "   3. Naciśnij F12 (DevTools)" -ForegroundColor White
Write-Host "   4. Wpisz w konsoli: localStorage.getItem('authToken')" -ForegroundColor White
Write-Host "   5. Skopiuj token (bez cudzysłowów)" -ForegroundColor White
Write-Host ""

# Poproś użytkownika o wklejenie tokena
$token = Read-Host "Wklej token tutaj i naciśnij Enter"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Błąd: Nie podano tokena" -ForegroundColor Red
    exit 1
}

# Usuń ewentualne cudzysłowy
$token = $token.Trim('"').Trim("'")

Write-Host ""
Write-Host "✅ Token otrzymany: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Green
Write-Host ""

# Krok 3: Uruchom skrypt importu
Write-Host "🔄 Uruchamianie importu..." -ForegroundColor Yellow
Write-Host ""

try {
    & node import-layer-api.mjs $token

    Write-Host ""
    Write-Host "✅ Import zakończony!" -ForegroundColor Green
    Write-Host "👉 Otwórz http://localhost:3000/map?project=Wyszki aby zobaczyć nową warstwę" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Błąd podczas importu: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
