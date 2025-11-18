// Test QML Style Import Script
// Run in browser console on http://localhost:3000/map?project=Wyszki

const layerMappings = [
  { name: 'Budynki', id: 'tmp_name_e8a0725b_e49f_4212_a216_e3e2310be0ea', qmlFile: 'Budynki.qml' },
  { name: 'Działki 29.10.25', id: 'tmp_name_96c4c758_dbcd_4d5a_a5f1_aefc45de706a', qmlFile: 'Działki_29.10.25.qml' },
  { name: 'Działki Kolbudy', id: 'tmp_name_5c4b4948_a062_4f43_a189_d1001fd7bd28', qmlFile: 'Działki_Kolbudy.qml' },
  { name: 'Obszar Uzupełnienia Zabudowy', id: 'tmp_name_e050da66_421e_470d_95ec_6d25db5862c0', qmlFile: 'Obszar_Uzupełnienia_Zabudowy.qml' },
  { name: 'PLG', id: 'tmp_name_8ff5f5fc_6682_4d76_a3e6_99c826bf0c4a', qmlFile: 'PLG.qml' },
  { name: 'Strefa planistyczna', id: 'tmp_name_b66f072e_f535_4106_9913_799b4a33e31d', qmlFile: 'Strefa_planistyczna.qml' },
  { name: 'Strefy', id: 'tmp_name_8c20c81f_94c1_4198_813d_93a3b5f6d1fa', qmlFile: 'Strefy.qml' }
];

async function testQMLImport(layer, qmlFilePath) {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();

  formData.append('project', 'Wyszki');
  formData.append('layer_id', layer.id);

  // Load QML file from local filesystem
  const response = await fetch(qmlFilePath);
  const blob = await response.blob();
  formData.append('style', blob, layer.qmlFile);

  console.log(`\n🧪 Testing: ${layer.name}`);
  console.log(`   Layer ID: ${layer.id}`);
  console.log(`   QML File: ${layer.qmlFile}`);

  try {
    const apiResponse = await fetch('https://api.universemapmaker.online/api/layer/style/add', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`
      },
      body: formData
    });

    const result = await apiResponse.json();

    if (apiResponse.ok) {
      console.log(`   ✅ SUCCESS: ${result.message}`);
      return { success: true, layer: layer.name, data: result };
    } else {
      console.error(`   ❌ FAILED: ${result.message || apiResponse.statusText}`);
      return { success: false, layer: layer.name, error: result };
    }
  } catch (error) {
    console.error(`   ❌ ERROR: ${error.message}`);
    return { success: false, layer: layer.name, error: error.message };
  }
}

async function testAllLayers() {
  console.log('🚀 Starting QML Import Test for 7 layers...\n');

  const results = [];

  for (const layer of layerMappings) {
    const qmlPath = `C:\\Users\\Bartosz\\Desktop\\Wyszki_QML_Styles\\${layer.qmlFile}`;
    const result = await testQMLImport(layer, qmlPath);
    results.push(result);

    // Wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Test Summary:');
  console.log(`   Success: ${results.filter(r => r.success).length}/7`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}/7`);

  return results;
}

// Auto-run test
console.log('📝 QML Import Test Script Loaded');
console.log('   Run: testAllLayers()');
console.log('   Or test single: testQMLImport(layerMappings[0], "path/to/file.qml")');
