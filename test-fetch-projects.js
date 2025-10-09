// Quick test to fetch projects for admin user
const API_URL = 'https://api.universemapmaker.online';

async function testFetchProjects() {
  console.log('\n🧪 Testing GET /dashboard/projects/\n');
  
  // First login as admin
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'maciekstrach23@wp.pl',
      password: 'Test1234!',
    }),
  });
  
  const loginData = await loginResponse.json();
  console.log('✅ Logged in as:', loginData.user.username);
  console.log('Token:', loginData.token.substring(0, 20) + '...\n');
  
  // Now fetch projects
  const projectsResponse = await fetch(`${API_URL}/dashboard/projects/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${loginData.token}`,
      'Content-Type': 'application/json',
    },
  });
  
  console.log('Status:', projectsResponse.status);
  const projectsData = await projectsResponse.json();
  
  console.log('Projects count:', projectsData.list_of_projects?.length || 0);
  console.log('\nProjects:');
  projectsData.list_of_projects?.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.project_name} (${p.custom_project_name})`);
  });
}

testFetchProjects().catch(console.error);
