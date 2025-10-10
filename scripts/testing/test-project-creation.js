/**
 * Test Project Creation - Full E2E Flow
 * Tests: Login → Dashboard → Create Project → Verify
 */

const API_URL = 'https://api.universemapmaker.online';

// Test credentials (from previous successful registration)
const TEST_EMAIL = 'test_1760009904068@example.com';
const TEST_PASSWORD = 'SecureTestPass123!';

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

let authToken = null;

async function testLogin() {
  logSection('STEP 1: Login User');

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      logSuccess(`Login successful`);
      logInfo(`Token: ${authToken.substring(0, 20)}...`);
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

async function testCreateProject() {
  logSection('STEP 2: Create New Project with CORRECT API Fields');

  const timestamp = Date.now();
  const projectData = {
    project_name: `TestProject${timestamp}`,            // ✅ Dashboard expects "project_name"
    custom_project_name: `testproject${timestamp}`,     // ✅ Dashboard expects "custom_project_name"
    description: 'Automated test project',              // ✅ Dashboard expects "description"
    keywords: 'test, automated, integration',
    category: 'Inne',
    is_public: false,
  };

  logInfo(`POST ${API_URL}/dashboard/projects/create/`);
  logInfo(`Project name: ${projectData.project_name}`);
  logInfo(`Custom name: ${projectData.custom_project_name}`);
  logInfo(`Category: ${projectData.category}`);

  try {
    const response = await fetch(`${API_URL}/dashboard/projects/create/`, {
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
      logInfo(`Response: ${JSON.stringify(data, null, 2)}`);
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

async function testGetProjects() {
  logSection('STEP 3: Verify Projects List');

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
      logInfo(`Total projects: ${data.list_of_projects.length}`);

      if (data.list_of_projects.length > 0) {
        logInfo(`\nRecent projects:`);
        data.list_of_projects.slice(0, 3).forEach((proj, idx) => {
          console.log(`  ${idx + 1}. ${proj.custom_project_name || proj.project_name}`);
          console.log(`     Domain: ${proj.domain_name || 'N/A'}`);
          console.log(`     Categories: ${proj.categories || 'N/A'}`);
        });
      }
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

async function runTests() {
  log('\n🧪 Project Creation E2E Test', colors.cyan);
  log(`Backend: ${API_URL}\n`, colors.yellow);

  const results = [];

  // Step 1: Login
  results.push({ name: 'Login', passed: await testLogin() });

  if (!authToken) {
    log('\n⚠️  Cannot continue - login failed', colors.red);
    process.exit(1);
  }

  // Step 2: Create Project
  results.push({ name: 'Create Project', passed: await testCreateProject() });

  // Step 3: Verify
  results.push({ name: 'Get Projects', passed: await testGetProjects() });

  // Summary
  logSection('TEST SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}`);
    }
  });

  console.log();
  log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`, colors.blue);

  if (failed === 0) {
    log('\n✨ All tests passed! Project creation working correctly!', colors.green);
  } else {
    log(`\n⚠️  ${failed} test(s) failed`, colors.red);
  }

  console.log();
}

runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
