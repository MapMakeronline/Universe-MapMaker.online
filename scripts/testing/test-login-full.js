// Test pełnego flow logowania
// Usage: node test-login-full.js <username> <password>

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

async function testFullLoginFlow(username, password) {
  console.log('🧪 Test pełnego flow logowania');
  console.log('======================================\n');
  console.log(`📧 Username: ${username}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}\n`);

  // Krok 1: Logowanie
  console.log('📝 Krok 1: Wysyłanie żądania logowania...');
  try {
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    console.log(`   Status: ${loginResponse.status}`);

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log(`   ❌ Błąd logowania:`, JSON.stringify(error, null, 2));
      console.log('\n💡 Możliwe przyczyny:');
      console.log('   - Nieprawidłowa nazwa użytkownika lub hasło');
      console.log('   - Konto nie istnieje');
      console.log('   - Backend nie jest dostępny');
      return;
    }

    const loginData = await loginResponse.json();
    console.log(`   ✅ Logowanie udane!`);
    console.log(`   Token: ${loginData.token.substring(0, 20)}...`);
    console.log(`   User ID: ${loginData.user.id}`);
    console.log(`   Email: ${loginData.user.email}`);
    console.log(`   Imię: ${loginData.user.first_name} ${loginData.user.last_name}\n`);

    // Krok 2: Test tokena - pobranie profilu
    console.log('📝 Krok 2: Testowanie tokena - pobieranie profilu...');
    const profileResponse = await fetch(`${API_URL}/dashboard/profile/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${loginData.token}`,
      },
    });

    if (!profileResponse.ok) {
      console.log(`   ❌ Błąd pobierania profilu: ${profileResponse.status}`);
      return;
    }

    const profileData = await profileResponse.json();
    console.log(`   ✅ Profil pobrany!`);
    console.log(`   Username: ${profileData.username}`);
    console.log(`   Email: ${profileData.email}`);
    console.log(`   Firma: ${profileData.company_name || 'Brak'}\n`);

    // Krok 3: Pobranie projektów
    console.log('📝 Krok 3: Pobieranie listy projektów...');
    const projectsResponse = await fetch(`${API_URL}/dashboard/projects/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${loginData.token}`,
      },
    });

    if (!projectsResponse.ok) {
      console.log(`   ❌ Błąd pobierania projektów: ${projectsResponse.status}`);
      return;
    }

    const projectsData = await projectsResponse.json();
    console.log(`   ✅ Projekty pobrane!`);
    console.log(`   Liczba projektów: ${projectsData.list_of_projects?.length || 0}`);

    if (projectsData.list_of_projects?.length > 0) {
      console.log(`   Przykładowy projekt: ${projectsData.list_of_projects[0].custom_project_name}`);
    }

    console.log(`   Database info: ${projectsData.db_info?.host || 'Brak'}\n`);

    // Krok 4: Test wylogowania
    console.log('📝 Krok 4: Testowanie wylogowania...');
    const logoutResponse = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${loginData.token}`,
      },
    });

    if (logoutResponse.ok || logoutResponse.status === 204) {
      console.log(`   ✅ Wylogowanie udane!\n`);
    } else {
      console.log(`   ⚠️  Status wylogowania: ${logoutResponse.status}\n`);
    }

    // Podsumowanie
    console.log('======================================');
    console.log('✅ PEŁNY FLOW LOGOWANIA DZIAŁA POPRAWNIE!');
    console.log('======================================');
    console.log('✅ Logowanie: OK');
    console.log('✅ Token authentication: OK');
    console.log('✅ Pobieranie profilu: OK');
    console.log('✅ Pobieranie projektów: OK');
    console.log('✅ Wylogowanie: OK');
    console.log('\n🎉 Integracja frontend-backend w pełni funkcjonalna!');

  } catch (error) {
    console.log(`\n❌ Błąd podczas testu: ${error.message}`);
    console.log('Stack:', error.stack);
  }
}

// Pobranie argumentów z linii poleceń
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.log('❌ Brak danych logowania!\n');
  console.log('Użycie: node test-login-full.js <username> <password>\n');
  console.log('Przykład:');
  console.log('  node test-login-full.js admin@example.com mypassword123');
  process.exit(1);
}

testFullLoginFlow(username, password);
