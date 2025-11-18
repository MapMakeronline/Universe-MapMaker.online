/**
 * Import warstwy GML i stylu QML przez API
 *
 * Skrypt używa bezpośrednio API zamiast UI automation.
 * Wymaga podania tokena uwierzytelniającego.
 *
 * Użycie:
 *   node import-layer-api.mjs YOUR_AUTH_TOKEN
 */

import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Konfiguracja
const CONFIG = {
  apiUrl: 'https://api.universemapmaker.online',
  projectName: 'Wyszki',

  // Plik GML do zaimportowania
  gmlFile: {
    path: 'C:\\Users\\Bartosz\\Desktop\\Przykładowe QGIS\\Kolbudy\\Działki starostwo 260525_3857.gml',
    layerName: 'Działki Kolbudy Import',
    groupName: undefined, // undefined = Stwórz poza grupami
    epsg: 3857,
  },

  // Styl QML do zaimportowania po utworzeniu warstwy
  qmlFile: {
    path: 'C:\\Users\\Bartosz\\Desktop\\Przykładowe QGIS\\Kolbudy\\Działki starostwo 26.05.25_style.qml',
  },
};

async function importGmlLayer(authToken) {
  console.log('\n📥 Importowanie warstwy GML...');
  console.log(`   Projekt: ${CONFIG.projectName}`);
  console.log(`   Plik: ${CONFIG.gmlFile.path}`);
  console.log(`   Nazwa warstwy: ${CONFIG.gmlFile.layerName}`);

  // Sprawdź, czy plik istnieje
  if (!fs.existsSync(CONFIG.gmlFile.path)) {
    console.error(`❌ Błąd: Plik nie istnieje: ${CONFIG.gmlFile.path}`);
    return null;
  }

  // Utwórz FormData
  const formData = new FormData();
  formData.append('gml', fs.createReadStream(CONFIG.gmlFile.path));

  // Zbuduj URL z query parameters
  const params = new URLSearchParams({
    project: CONFIG.projectName,
    layer_name: CONFIG.gmlFile.layerName,
    epsg: CONFIG.gmlFile.epsg,
    encoding: 'UTF-8',
  });

  if (CONFIG.gmlFile.groupName) {
    params.append('parent', CONFIG.gmlFile.groupName);
  }

  const url = `${CONFIG.apiUrl}/api/layer/add/gml/?${params.toString()}`;

  console.log(`   URL: ${url}`);
  console.log('   Wysyłanie requestu...');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${authToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`❌ Błąd API (${response.status}):`, responseData);
      return null;
    }

    console.log('✅ Import GML zakończony pomyślnie!');
    console.log('   Odpowiedź:', JSON.stringify(responseData, null, 2));

    const layerId = responseData?.data?.layer_id;
    if (!layerId) {
      console.error('❌ Błąd: Brak layer_id w odpowiedzi');
      return null;
    }

    console.log(`📌 ID nowej warstwy: ${layerId}`);
    return layerId;

  } catch (error) {
    console.error('❌ Błąd podczas wywołania API:', error.message);
    return null;
  }
}

async function importQmlStyle(authToken, layerId) {
  console.log('\n🎨 Importowanie stylu QML...');
  console.log(`   Projekt: ${CONFIG.projectName}`);
  console.log(`   Warstwa: ${layerId}`);
  console.log(`   Plik: ${CONFIG.qmlFile.path}`);

  // Sprawdź, czy plik istnieje
  if (!fs.existsSync(CONFIG.qmlFile.path)) {
    console.error(`❌ Błąd: Plik nie istnieje: ${CONFIG.qmlFile.path}`);
    return false;
  }

  // Utwórz FormData
  const formData = new FormData();
  formData.append('project', CONFIG.projectName);
  formData.append('layer_id', layerId);
  formData.append('style', fs.createReadStream(CONFIG.qmlFile.path), 'style.qml');

  const url = `${CONFIG.apiUrl}/api/layer/style/add`;

  console.log(`   URL: ${url}`);
  console.log('   Wysyłanie requestu...');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${authToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`❌ Błąd API (${response.status}):`, responseData);
      return false;
    }

    console.log('✅ Import stylu QML zakończony pomyślnie!');
    console.log('   Odpowiedź:', JSON.stringify(responseData, null, 2));
    return true;

  } catch (error) {
    console.error('❌ Błąd podczas wywołania API:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Automatyczny import warstwy GML i stylu QML\n');

  // Pobierz token z argumentu wiersza poleceń
  const authToken = process.argv[2];
  if (!authToken) {
    console.error('❌ Błąd: Nie podano tokena uwierzytelniającego');
    console.log('\nUżycie:');
    console.log('  node import-layer-api.mjs YOUR_AUTH_TOKEN');
    console.log('\nAby uzyskać token:');
    console.log('  1. Otwórz http://localhost:3000 w przeglądarce');
    console.log('  2. Zaloguj się');
    console.log('  3. Otwórz DevTools (F12)');
    console.log('  4. W konsoli wpisz: localStorage.getItem("authToken")');
    console.log('  5. Skopiuj token i użyj go jako argument skryptu\n');
    process.exit(1);
  }

  console.log('✅ Token uwierzytelniający podany');
  console.log(`   Token: ${authToken.substring(0, 20)}...`);

  // Krok 1: Import warstwy GML
  const layerId = await importGmlLayer(authToken);
  if (!layerId) {
    console.error('\n❌ Import warstwy GML nie powiódł się. Przerywam.');
    process.exit(1);
  }

  // Krok 2: Import stylu QML
  const styleSuccess = await importQmlStyle(authToken, layerId);
  if (!styleSuccess) {
    console.error('\n⚠️ Import stylu QML nie powiódł się, ale warstwa została zaimportowana.');
    console.log(`📌 ID warstwy: ${layerId}`);
    process.exit(1);
  }

  // Podsumowanie
  console.log('\n✅ Import zakończony pomyślnie!');
  console.log(`📋 Nowa warstwa: "${CONFIG.gmlFile.layerName}" (ID: ${layerId})`);
  console.log('🎨 Styl QML zaimportowany');
  console.log('\n👉 Otwórz http://localhost:3000/map?project=Wyszki aby zobaczyć nową warstwę!');
}

main();
