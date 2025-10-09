// Test logowania - Frontend + Backend Integration
// Usage: node test-login.js

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

console.log('🧪 Test integracji Frontend-Backend');
console.log('=====================================\n');

// Test 1: Sprawdzenie dostępności backendu
async function testBackendAvailability() {
  console.log('📡 Test 1: Dostępność backendu');
  console.log(`   URL: ${API_URL}/auth/login`);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   ✅ Backend odpowiada\n`);
    return true;
  } catch (error) {
    console.log(`   ❌ Błąd: ${error.message}\n`);
    return false;
  }
}

// Test 2: Próba logowania z błędnymi danymi
async function testLoginInvalidCredentials() {
  console.log('🔐 Test 2: Logowanie z błędnymi danymi');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'test@invalid.com',
        password: 'wrongpassword123',
      }),
    });

    const data = await response.json();

    if (response.status === 400 || response.status === 401) {
      console.log(`   ✅ Status: ${response.status} (oczekiwany błąd)`);
      console.log(`   ✅ Odpowiedź:`, JSON.stringify(data, null, 2));
      console.log(`   ✅ Walidacja działa poprawnie\n`);
      return true;
    } else {
      console.log(`   ⚠️  Nieoczekiwany status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Błąd: ${error.message}\n`);
    return false;
  }
}

// Test 3: Sprawdzenie struktury odpowiedzi
async function testResponseStructure() {
  console.log('📋 Test 3: Struktura odpowiedzi błędu');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: '',
        password: '',
      }),
    });

    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Struktura odpowiedzi:`, JSON.stringify(data, null, 2));

    const hasExpectedFields = data.non_field_errors || data.detail || data.username || data.password;
    if (hasExpectedFields) {
      console.log(`   ✅ Struktura odpowiedzi poprawna\n`);
      return true;
    } else {
      console.log(`   ⚠️  Nieoczekiwana struktura odpowiedzi\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Błąd: ${error.message}\n`);
    return false;
  }
}

// Test 4: Sprawdzenie CORS headers
async function testCorsHeaders() {
  console.log('🌐 Test 4: CORS Headers');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   Allow: ${response.headers.get('Allow')}`);
    console.log(`   Vary: ${response.headers.get('Vary')}`);

    if (response.headers.get('Allow')?.includes('POST')) {
      console.log(`   ✅ CORS headers poprawne\n`);
      return true;
    } else {
      console.log(`   ⚠️  Brak odpowiednich CORS headers\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Błąd: ${error.message}\n`);
    return false;
  }
}

// Test 5: Test endpointu profilu (wymaga tokena)
async function testProtectedEndpoint() {
  console.log('🔒 Test 5: Chroniony endpoint (bez tokena)');

  try {
    const response = await fetch(`${API_URL}/dashboard/profile/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      console.log(`   ✅ Status: 401 (oczekiwany - brak tokena)`);
      console.log(`   ✅ Odpowiedź:`, JSON.stringify(data, null, 2));
      console.log(`   ✅ Autentykacja wymagana\n`);
      return true;
    } else {
      console.log(`   ⚠️  Nieoczekiwany status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Błąd: ${error.message}\n`);
    return false;
  }
}

// Uruchom wszystkie testy
async function runAllTests() {
  console.log(`🎯 Backend URL: ${API_URL}\n`);

  const results = [];

  results.push(await testBackendAvailability());
  results.push(await testLoginInvalidCredentials());
  results.push(await testResponseStructure());
  results.push(await testCorsHeaders());
  results.push(await testProtectedEndpoint());

  console.log('\n=====================================');
  console.log('📊 PODSUMOWANIE TESTÓW');
  console.log('=====================================');
  console.log(`✅ Udane: ${results.filter(r => r).length}/${results.length}`);
  console.log(`❌ Nieudane: ${results.filter(r => !r).length}/${results.length}`);

  if (results.every(r => r)) {
    console.log('\n🎉 Wszystkie testy przeszły pomyślnie!');
    console.log('✅ Integracja frontend-backend działa poprawnie');
  } else {
    console.log('\n⚠️  Niektóre testy nie powiodły się');
    console.log('❌ Sprawdź logi powyżej');
  }
}

runAllTests().catch(console.error);
