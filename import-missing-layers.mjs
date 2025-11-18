/**
 * Automatyczny import brakujących warstw i stylów QML
 *
 * Skrypt automatyzuje:
 * 1. Import pliku GML "Działki Kolbudy" przez frontend
 * 2. Import stylu QML dla zaimportowanej warstwy
 *
 * Wymagania:
 * - npm run dev (aplikacja uruchomiona na http://localhost:3000)
 * - Zalogowany użytkownik (authToken w localStorage)
 *
 * Użycie:
 *   node import-missing-layers.mjs
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfiguracja
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  projectName: 'Wyszki',

  // Plik GML do zaimportowania
  gmlFile: {
    path: 'C:\\Users\\Bartosz\\Desktop\\Przykładowe QGIS\\Kolbudy\\Działki starostwo 260525_3857.gml',
    layerName: 'Działki Kolbudy Import',
    groupName: 'Stwórz poza grupami',
  },

  // Styl QML do zaimportowania po utworzeniu warstwy
  qmlFile: {
    path: 'C:\\Users\\Bartosz\\Desktop\\Przykładowe QGIS\\Kolbudy\\Działki starostwo 26.05.25_style.qml',
  },

  // Timeouty
  timeout: {
    navigation: 30000,
    apiCall: 60000,
    fileUpload: 120000,
  },
};

async function main() {
  console.log('🚀 Uruchamianie automatycznego importu warstw...\n');

  const browser = await chromium.launch({
    headless: false, // Pokaż przeglądarkę
    slowMo: 500, // Spowolnij operacje dla lepszej widoczności
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Krok 1: Otwórz aplikację
    console.log(`📂 Otwieranie ${CONFIG.baseUrl}/map?project=${CONFIG.projectName}...`);
    await page.goto(`${CONFIG.baseUrl}/map?project=${CONFIG.projectName}`, {
      waitUntil: 'domcontentloaded', // Zmiana: networkidle → domcontentloaded (szybsze)
      timeout: CONFIG.timeout.navigation,
    });

    // Poczekaj dodatkowe 3 sekundy na załadowanie React komponentów
    await page.waitForTimeout(3000);

    // Sprawdź, czy użytkownik jest zalogowany
    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    if (!authToken) {
      console.error('❌ Błąd: Brak authToken w localStorage.');
      console.log('   Zaloguj się ręcznie w przeglądarce, a następnie uruchom skrypt ponownie.');
      await browser.close();
      return;
    }
    console.log('✅ Użytkownik zalogowany (authToken znaleziony)');

    // Krok 2: Otwórz panel warstw (lewy panel)
    console.log('\n📋 Otwieranie panelu warstw...');
    await page.waitForSelector('[data-testid="layer-panel"]', { timeout: 10000 }).catch(() => {
      console.warn('⚠️ Panel warstw nie znaleziony przez data-testid, próbuję alternative selector...');
    });

    // Krok 3: Kliknij przycisk "Importuj warstwę"
    console.log('📥 Klikanie przycisku "Importuj warstwę"...');

    // Szukaj przycisku po tekście
    const importButton = await page.getByRole('button', { name: /importuj/i }).first();
    await importButton.click();
    await page.waitForTimeout(1000);

    // Krok 4: Poczekaj na modal importu
    console.log('⏳ Oczekiwanie na modal importu...');
    await page.waitForSelector('dialog', { state: 'visible', timeout: 5000 });
    console.log('✅ Modal importu otwarty');

    // Krok 5: Wybierz zakładkę "gml"
    console.log('🗂️ Wybieranie zakładki GML...');
    const gmlTab = await page.getByRole('tab', { name: 'gml' });
    await gmlTab.click();
    await page.waitForTimeout(500);

    // Krok 6: Wypełnij formularz
    console.log('📝 Wypełnianie formularza importu...');

    // Nazwa warstwy
    const layerNameInput = await page.locator('input').filter({ hasText: /nazwa warstwy/i }).or(
      page.locator('label:has-text("Nazwa warstwy") + div input')
    );
    await layerNameInput.fill(CONFIG.gmlFile.layerName);
    console.log(`   Nazwa warstwy: ${CONFIG.gmlFile.layerName}`);

    // Nazwa grupy (wybierz z dropdown)
    const groupSelect = await page.locator('label:has-text("Nazwa grupy") + div').locator('[role="combobox"]');
    await groupSelect.click();
    await page.waitForTimeout(300);
    await page.getByRole('option', { name: CONFIG.gmlFile.groupName }).click();
    console.log(`   Nazwa grupy: ${CONFIG.gmlFile.groupName}`);

    // Krok 7: Upload pliku GML
    console.log(`📤 Upload pliku GML: ${CONFIG.gmlFile.path}...`);

    // Znajdź input type="file"
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(CONFIG.gmlFile.path);
    console.log('✅ Plik GML wybrany');

    await page.waitForTimeout(1000);

    // Krok 8: Kliknij przycisk "Import"
    console.log('🔄 Klikanie przycisku "Import"...');
    const importSubmitButton = await page.getByRole('button', { name: /import/i }).filter({ hasText: /^Import$/ });

    // Poczekaj na odpowiedź API
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/layer/add/gml') && response.status() === 200,
      { timeout: CONFIG.timeout.fileUpload }
    );

    await importSubmitButton.click();
    console.log('⏳ Oczekiwanie na odpowiedź API (może potrwać do 2 minut)...');

    const response = await responsePromise;
    const responseData = await response.json();
    console.log('✅ Import GML zakończony pomyślnie!');
    console.log('   Odpowiedź:', JSON.stringify(responseData, null, 2));

    // Wyciągnij layer_id z odpowiedzi
    const layerId = responseData?.data?.layer_id;
    if (!layerId) {
      console.error('❌ Błąd: Nie znaleziono layer_id w odpowiedzi API');
      console.log('   Odpowiedź:', responseData);
      await browser.close();
      return;
    }
    console.log(`📌 ID nowej warstwy: ${layerId}`);

    // Krok 9: Poczekaj na odświeżenie drzewa warstw
    console.log('\n⏳ Oczekiwanie na odświeżenie drzewa warstw...');
    await page.waitForTimeout(3000);

    // Krok 10: Import stylu QML dla nowej warstwy
    console.log('\n🎨 Rozpoczynam import stylu QML...');

    // Wywołaj API bezpośrednio przez fetch (łatwiejsze niż UI)
    const qmlImportResult = await page.evaluate(async ({ layerId, projectName, qmlFilePath, authToken }) => {
      try {
        // Pobierz plik QML z lokalnego systemu plików
        const response = await fetch(qmlFilePath);
        if (!response.ok) {
          throw new Error(`Nie można odczytać pliku QML: ${response.statusText}`);
        }
        const blob = await response.blob();

        // Utwórz FormData
        const formData = new FormData();
        formData.append('project', projectName);
        formData.append('layer_id', layerId);
        formData.append('style', blob, 'style.qml');

        // Wyślij request do API
        const apiResponse = await fetch('https://api.universemapmaker.online/api/layer/style/add', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${authToken}`,
          },
          body: formData,
        });

        const result = await apiResponse.json();

        return {
          ok: apiResponse.ok,
          status: apiResponse.status,
          data: result,
        };
      } catch (error) {
        return {
          ok: false,
          error: error.message,
        };
      }
    }, {
      layerId,
      projectName: CONFIG.projectName,
      qmlFilePath: CONFIG.qmlFile.path,
      authToken,
    });

    if (qmlImportResult.ok) {
      console.log('✅ Import stylu QML zakończony pomyślnie!');
      console.log('   Odpowiedź:', JSON.stringify(qmlImportResult.data, null, 2));
    } else {
      console.error('❌ Błąd importu stylu QML:');
      console.log('   Status:', qmlImportResult.status);
      console.log('   Error:', qmlImportResult.error || qmlImportResult.data);
    }

    // Krok 11: Odśwież stronę, aby zobaczyć nową warstwę ze stylem
    console.log('\n🔄 Odświeżanie strony...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('\n✅ Skrypt zakończony pomyślnie!');
    console.log(`📋 Nowa warstwa: "${CONFIG.gmlFile.layerName}" (ID: ${layerId})`);
    console.log('🎨 Styl QML zaimportowany');
    console.log('\n👀 Przeglądarka pozostanie otwarta - sprawdź wynik!');
    console.log('   Zamknij ręcznie przeglądarkę, aby zakończyć.');

    // Zostaw przeglądarkę otwartą
    await page.waitForTimeout(10000000); // Czekaj 3h (praktycznie nieskończenie)

  } catch (error) {
    console.error('\n❌ Błąd podczas wykonywania skryptu:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    // await browser.close(); // Zostaw przeglądarkę otwartą
  }
}

main();
