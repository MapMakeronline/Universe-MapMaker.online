const API_URL = 'https://api.universemapmaker.online';

(async () => {
  const loginRes = await fetch(API_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  if (!loginRes.ok) {
    console.log('Login failed:', loginRes.status);
    return;
  }
  
  const { token, user } = await loginRes.json();
  console.log('Logged in as:', user.username, 'ID:', user.id);
  
  const projectsRes = await fetch(API_URL + '/dashboard/projects/', {
    headers: { 'Authorization': 'Token ' + token }
  });
  const data = await projectsRes.json();
  
  console.log('\nProjects count:', data.list_of_projects?.length || 0);
  if (data.list_of_projects?.length > 0) {
    console.log('\nProjects:');
    data.list_of_projects.forEach((p, i) => {
      console.log(`${i+1}. ${p.project_name} (${p.custom_project_name})`);
    });
  }
})();
