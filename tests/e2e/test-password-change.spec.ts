import { test, expect } from '@playwright/test';

test('Test password change endpoint with real credentials', async ({ request }) => {
  // Get token by logging in via API
  console.log('🔐 Logging in via API...');
  const loginResponse = await request.post('https://api.universemapmaker.online/auth/login', {
    data: {
      username: 'admin',
      password: 'admin123',
    },
  });

  console.log('Login status:', loginResponse.status());

  const loginText = await loginResponse.text();
  console.log('Login raw response:', loginText.substring(0, 500));

  let loginData;
  try {
    loginData = JSON.parse(loginText);
  } catch (e) {
    console.log('❌ Login endpoint returned HTML instead of JSON');
    return;
  }

  console.log('Login response:', loginData);

  if (!loginData.token) {
    console.log('❌ Login failed - no token in response');
    return;
  }

  const authToken = loginData.token;

  console.log('🔑 Auth token:', authToken);

  // Make API request directly
  console.log('\n📡 Testing password change endpoint...');
  const response = await request.put('https://api.universemapmaker.online/dashboard/settings/password/', {
    headers: {
      'Authorization': `Token ${authToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      old_password: 'admin123',
      new_password: 'SuperSecureP@ssw0rd2025!',
    },
  });

  console.log('📡 Response status:', response.status());
  console.log('📡 Response headers:', response.headers());

  const responseText = await response.text();
  console.log('📄 Response body (first 1000 chars):\n', responseText.substring(0, 1000));

  // Try to parse as JSON
  try {
    const jsonData = JSON.parse(responseText);
    console.log('✅ Valid JSON response:', jsonData);
  } catch (e) {
    console.log('❌ Response is not JSON - likely HTML error page');
    // Check if it's HTML
    if (responseText.includes('<!DOCTYPE')) {
      console.log('🔴 Backend returned HTML error page (500)');
      // Try to extract error from HTML
      const titleMatch = responseText.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        console.log('🔴 Error title:', titleMatch[1]);
      }

      // Try to extract error details from HTML
      const h1Match = responseText.match(/<h1>(.*?)<\/h1>/);
      if (h1Match) {
        console.log('🔴 Error heading:', h1Match[1]);
      }

      // Look for exception info
      const exceptionMatch = responseText.match(/Exception Type:.*?<td>(.*?)<\/td>/);
      if (exceptionMatch) {
        console.log('🔴 Exception Type:', exceptionMatch[1]);
      }

      const exceptionValueMatch = responseText.match(/Exception Value:.*?<pre[^>]*>(.*?)<\/pre>/s);
      if (exceptionValueMatch) {
        console.log('🔴 Exception Value:', exceptionValueMatch[1].trim());
      }
    }
  }
});
