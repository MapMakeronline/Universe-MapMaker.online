'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, CircularProgress } from '@mui/material';

interface TestResult {
  layerName: string;
  testType: string;
  layerId: string;
  status: number | null;
  success: boolean;
  featuresCount: number;
  message: string;
  error?: string;
}

export default function TestIdentifyPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    const token = localStorage.getItem('authToken') || '';
    const projectName = 'graph';
    const testPoint = [18.789, 51.967]; // Środek mapy

    // Faktyczne nazwy tabel z bazy danych (NIE UUID!)
    const layersToTest = [
      {
        name: 'Granica Ciepłowody',
        table: 'granicaciepłowody_id_476798', // FAKTYCZNA TABELA W BAZIE
        uuid: 'tmp_name_1b860a66_58b0_4d87_962f_ed520ccfbf16' // UUID z API
      },
      {
        name: 'test',
        table: 'test_id_340688', // FAKTYCZNA TABELA W BAZIE
        uuid: 'tmp_name_aed23536_81a3_4fdd_a292_d0ce5ef8d76a' // UUID z API
      }
    ];

    const testResults: TestResult[] = [];

    console.log('🧪 Starting identify test...\n');
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('Project:', projectName);
    console.log('Test point:', testPoint);

    for (const layer of layersToTest) {
      // TEST 1: UUID as layer_id
      console.log(`\n📝 TEST 1: UUID as layer_id (${layer.name})`);
      console.log(`   UUID: ${layer.uuid}`);

      try {
        const response = await fetch('https://api.universemapmaker.online/api/layer/feature/coordinates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({
            project: projectName,
            layer_id: layer.uuid,
            point: testPoint,
            layer_type: 'polygon'
          })
        });

        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, data);

        testResults.push({
          layerName: layer.name,
          testType: 'UUID',
          layerId: layer.uuid,
          status: response.status,
          success: data.success || false,
          featuresCount: data.data?.features?.length || 0,
          message: data.message || 'OK',
        });

        if (data.success && data.data?.features?.length > 0) {
          console.log(`   ✅ SUCCESS! Found ${data.data.features.length} features`);
        } else if (data.success && data.data?.features?.length === 0) {
          console.log(`   ⚠️  SUCCESS but 0 features found`);
        } else {
          console.log(`   ❌ FAILED:`, data.message);
        }
      } catch (error: any) {
        console.error(`   ❌ ERROR:`, error);
        testResults.push({
          layerName: layer.name,
          testType: 'UUID',
          layerId: layer.uuid,
          status: null,
          success: false,
          featuresCount: 0,
          message: '',
          error: error.message,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // TEST 2: Table name as layer_id
      console.log(`\n📝 TEST 2: Table name as layer_id (${layer.name})`);
      console.log(`   Table: ${layer.table}`);

      try {
        const response = await fetch('https://api.universemapmaker.online/api/layer/feature/coordinates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({
            project: projectName,
            layer_id: layer.table, // TRY DIRECT TABLE NAME!
            point: testPoint,
            layer_type: 'polygon'
          })
        });

        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Response:`, data);

        testResults.push({
          layerName: layer.name,
          testType: 'TABLE_NAME',
          layerId: layer.table,
          status: response.status,
          success: data.success || false,
          featuresCount: data.data?.features?.length || 0,
          message: data.message || 'OK',
        });

        if (data.success && data.data?.features?.length > 0) {
          console.log(`   ✅ SUCCESS! Found ${data.data.features.length} features`);
        } else if (data.success && data.data?.features?.length === 0) {
          console.log(`   ⚠️  SUCCESS but 0 features found`);
        } else {
          console.log(`   ❌ FAILED:`, data.message);
        }
      } catch (error: any) {
        console.error(`   ❌ ERROR:`, error);
        testResults.push({
          layerName: layer.name,
          testType: 'TABLE_NAME',
          layerId: layer.table,
          status: null,
          success: false,
          featuresCount: 0,
          message: '',
          error: error.message,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n🏁 All tests completed!');
    setResults(testResults);
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Test QGIS Identify API
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Testing UUID vs Table Name as layer_id parameter
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Running tests...</Typography>
        </Box>
      ) : (
        <Box sx={{ mt: 4 }}>
          {results.map((result, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                mb: 2,
                bgcolor: result.success && result.featuresCount > 0
                  ? 'success.light'
                  : result.success
                    ? 'warning.light'
                    : 'error.light'
              }}
            >
              <Typography variant="h6">
                {result.layerName} - {result.testType}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 1 }}>
                layer_id: {result.layerId}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Status: {result.status || 'ERROR'}
              </Typography>
              <Typography variant="body2">
                Success: {result.success ? '✅ YES' : '❌ NO'}
              </Typography>
              <Typography variant="body2">
                Features Found: {result.featuresCount}
              </Typography>
              {result.message && (
                <Typography variant="body2">
                  Message: {result.message}
                </Typography>
              )}
              {result.error && (
                <Typography variant="body2" color="error">
                  Error: {result.error}
                </Typography>
              )}
            </Paper>
          ))}

          <Paper sx={{ p: 3, mt: 4, bgcolor: 'info.light' }}>
            <Typography variant="h6">📊 Summary</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total Tests: {results.length}
            </Typography>
            <Typography variant="body2">
              Successful (with features): {results.filter(r => r.success && r.featuresCount > 0).length}
            </Typography>
            <Typography variant="body2">
              Successful (no features): {results.filter(r => r.success && r.featuresCount === 0).length}
            </Typography>
            <Typography variant="body2">
              Failed: {results.filter(r => !r.success).length}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, mt: 4, bgcolor: '#f5f5f5' }}>
            <Typography variant="h6">💡 Conclusion</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {results.filter(r => r.testType === 'UUID' && r.success && r.featuresCount > 0).length > 0 && (
                '✅ UUID works! Current implementation is correct.'
              )}
              {results.filter(r => r.testType === 'TABLE_NAME' && r.success && r.featuresCount > 0).length > 0 && (
                '✅ Table name works! Consider using table names instead of UUIDs.'
              )}
              {results.every(r => !r.success || r.featuresCount === 0) && (
                '⚠️ No features found in either test. Either data doesn\'t exist at this location, or endpoint requires different parameters.'
              )}
            </Typography>
          </Paper>
        </Box>
      )}
    </Container>
  );
}
