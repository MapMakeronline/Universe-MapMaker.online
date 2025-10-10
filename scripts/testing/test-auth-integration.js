/**
 * Integration Tests - Auth & Projects
 * Tests actual API endpoints against production backend
 *
 * Run: node test-auth-integration.js
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.universemapmaker.online';

// Test utilities
let authToken = null;
let testUser = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  console.log();
  log(`${'='.repeat(60)}`, colors.blue);
  log(message, colors.blue);
  log(`${'='.repeat(60)}`, colors.blue);
}

// Generate unique test data
const timestamp = Date.now();
const testUsername = `testuser_${timestamp}`;
const testEmail = `test_${timestamp}@example.com`;
const testPassword = 'SecureTestPass123!';

// Test functions

async function testRegister() {
  logSection('TEST 1: Register New User');

  const requestData = {
    username: testUsername,
    email: testEmail,
    password: testPassword,
    password_confirm: testPassword,
    first_name: 'Test',
    last_name: 'User',
  };

  logInfo(`POST ${API_URL}/auth/register`);
  logInfo(`Username: ${testUsername}`);
  logInfo(`Email: ${testEmail}`);

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      testUser = data.user;

      logSuccess(`User registered successfully`);
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
      logInfo(`User ID: ${testUser.id}`);
      logInfo(`Username: ${testUser.username}`);
      return true;
    } else {
      logError(`Registration failed: ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  logSection('TEST 2: Login User');

  const requestData = {
    username: testEmail, // Test login with email
    password: testPassword,
  };

  logInfo(`POST ${API_URL}/auth/login`);
  logInfo(`Email: ${testEmail}`);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (response.ok) {
      const newToken = data.token;

      logSuccess(`Login successful`);
      logInfo(`Token matches registration: ${newToken === authToken}`);
      return true;
    } else {
      logError(`Login failed: ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testGetProfile() {
  logSection('TEST 3: Get User Profile');

  logInfo(`GET ${API_URL}/auth/profile`);
  logInfo(`Authorization: Token ${authToken.substring(0, 20)}...`);

  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Profile retrieved successfully`);
      logInfo(`User: ${data.first_name} ${data.last_name} (${data.email})`);
      return true;
    } else {
      logError(`Get profile failed: ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testGetProjects() {
  logSection('TEST 4: Get User Projects');

  logInfo(`GET ${API_URL}/dashboard/projects/`);

  try {
    const response = await fetch(`${API_URL}/dashboard/projects/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Projects retrieved successfully`);
      logInfo(`Projects count: ${data.list_of_projects.length}`);
      logInfo(`DB Info: ${data.db_info.login}@${data.db_info.host}:${data.db_info.port}`);
      return true;
    } else {
      logError(`Get projects failed: ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testCreateProject() {
  logSection('TEST 5: Create New Project');

  const projectData = {
    project: `Test Project ${timestamp}`,
    domain: `testproject${timestamp}`,
    categories: ['Inne'], // Backend expects array of strings (ListField)
    projectDescription: 'Integration test project',
    keywords: 'test, integration, automated',
  };

  logInfo(`POST ${API_URL}/api/projects/create/`);
  logInfo(`Project: ${projectData.project}`);
  logInfo(`Domain: ${projectData.domain}`);

  try {
    const response = await fetch(`${API_URL}/api/projects/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
      body: JSON.stringify(projectData),
    });

    const data = await response.json();

    if (response.ok || response.status === 201) {
      logSuccess(`Project created successfully`);
      if (data.data) {
        logInfo(`DB Name: ${data.data.db_name}`);
      }
      logInfo(`Message: ${data.message}`);
      return true;
    } else {
      logError(`Create project failed: ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testLogout() {
  logSection('TEST 6: Logout User');

  logInfo(`POST ${API_URL}/auth/logout`);

  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      logSuccess(`Logout successful`);
      logInfo(`Message: ${data.message}`);
      return true;
    } else {
      logError(`Logout failed: ${response.status}`);
      console.log(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

async function testInvalidLogin() {
  logSection('TEST 7: Invalid Login (Should Fail)');

  const requestData = {
    username: testEmail,
    password: 'WrongPassword123',
  };

  logInfo(`POST ${API_URL}/auth/login`);

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();

    if (!response.ok) {
      logSuccess(`Invalid login correctly rejected (${response.status})`);
      return true;
    } else {
      logError(`Invalid login was accepted - SECURITY ISSUE!`);
      return false;
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  log('\n🧪 Backend Integration Tests - Auth & Projects', colors.cyan);
  log(`Backend URL: ${API_URL}\n`, colors.yellow);

  const results = [];

  // Run tests sequentially
  results.push({ name: 'Register User', passed: await testRegister() });

  if (authToken) {
    results.push({ name: 'Login User', passed: await testLogin() });
    results.push({ name: 'Get Profile', passed: await testGetProfile() });
    results.push({ name: 'Get Projects', passed: await testGetProjects() });
    results.push({ name: 'Create Project', passed: await testCreateProject() });
    results.push({ name: 'Logout User', passed: await testLogout() });
  } else {
    log('\n⚠️  Skipping remaining tests - registration failed', colors.yellow);
  }

  results.push({ name: 'Invalid Login', passed: await testInvalidLogin() });

  // Summary
  logSection('TEST SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });

  console.log();
  log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`, colors.blue);

  if (failed === 0) {
    log('\n✨ All tests passed!', colors.green);
  } else {
    log(`\n⚠️  ${failed} test(s) failed`, colors.red);
  }

  console.log();
}

// Run tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
