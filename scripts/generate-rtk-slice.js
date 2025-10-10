#!/usr/bin/env node

/**
 * RTK QUERY SLICE GENERATOR
 *
 * Automatically generates RTK Query slices from backend endpoint documentation
 *
 * Usage:
 * node scripts/generate-rtk-slice.js <endpoint-name> <base-url>
 *
 * Example:
 * node scripts/generate-rtk-slice.js projects /api/projects
 *
 * Reads from: Dokumentacja/BACKEND-ENDPOINTS.md
 * Generates: src/api/endpointy/<endpoint-name>.ts
 */

const fs = require('fs');
const path = require('path');

// Template for RTK Query slice
const RTK_SLICE_TEMPLATE = `import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../client';

/**
 * {{ENDPOINT_NAME_UPPER}} API
 *
 * Auto-generated RTK Query slice for {{ENDPOINT_NAME}} endpoints
 * Base URL: {{BASE_URL}}
 *
 * Generated on: {{DATE}}
 */

export interface {{ENDPOINT_NAME_PASCAL}}ListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {{ENDPOINT_NAME_PASCAL}}[];
}

export interface {{ENDPOINT_NAME_PASCAL}} {
  id: number;
  // TODO: Add fields from backend documentation
}

export const {{ENDPOINT_NAME_CAMEL}}Api = createApi({
  reducerPath: '{{ENDPOINT_NAME_CAMEL}}Api',
  baseQuery: fetchBaseQuery({
    baseUrl: \`\${API_BASE_URL}{{BASE_URL}}\`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.set('Authorization', \`Token \${token}\`);
      }
      return headers;
    },
  }),
  tagTypes: ['{{ENDPOINT_NAME_PASCAL}}'],
  endpoints: (builder) => ({
    // GET - List all {{ENDPOINT_NAME}}
    get{{ENDPOINT_NAME_PASCAL}}List: builder.query<{{ENDPOINT_NAME_PASCAL}}ListResponse, { page?: number; search?: string }>({
      query: ({ page = 1, search = '' }) => ({
        url: '/',
        params: { page, search },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ id }) => ({ type: '{{ENDPOINT_NAME_PASCAL}}' as const, id })),
              { type: '{{ENDPOINT_NAME_PASCAL}}', id: 'LIST' },
            ]
          : [{ type: '{{ENDPOINT_NAME_PASCAL}}', id: 'LIST' }],
    }),

    // GET - Get single {{ENDPOINT_NAME}} by ID
    get{{ENDPOINT_NAME_PASCAL}}ById: builder.query<{{ENDPOINT_NAME_PASCAL}}, number>({
      query: (id) => \`/\${id}/\`,
      providesTags: (result, error, id) => [{ type: '{{ENDPOINT_NAME_PASCAL}}', id }],
    }),

    // POST - Create new {{ENDPOINT_NAME}}
    create{{ENDPOINT_NAME_PASCAL}}: builder.mutation<{{ENDPOINT_NAME_PASCAL}}, Partial<{{ENDPOINT_NAME_PASCAL}}>>({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: '{{ENDPOINT_NAME_PASCAL}}', id: 'LIST' }],
    }),

    // PATCH - Update existing {{ENDPOINT_NAME}}
    update{{ENDPOINT_NAME_PASCAL}}: builder.mutation<{{ENDPOINT_NAME_PASCAL}}, { id: number; updates: Partial<{{ENDPOINT_NAME_PASCAL}}> }>({
      query: ({ id, updates }) => ({
        url: \`/\${id}/\`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: '{{ENDPOINT_NAME_PASCAL}}', id },
        { type: '{{ENDPOINT_NAME_PASCAL}}', id: 'LIST' },
      ],
    }),

    // DELETE - Delete {{ENDPOINT_NAME}}
    delete{{ENDPOINT_NAME_PASCAL}}: builder.mutation<void, number>({
      query: (id) => ({
        url: \`/\${id}/\`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: '{{ENDPOINT_NAME_PASCAL}}', id },
        { type: '{{ENDPOINT_NAME_PASCAL}}', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGet{{ENDPOINT_NAME_PASCAL}}ListQuery,
  useGet{{ENDPOINT_NAME_PASCAL}}ByIdQuery,
  useCreate{{ENDPOINT_NAME_PASCAL}}Mutation,
  useUpdate{{ENDPOINT_NAME_PASCAL}}Mutation,
  useDelete{{ENDPOINT_NAME_PASCAL}}Mutation,
} = {{ENDPOINT_NAME_CAMEL}}Api;

export default {{ENDPOINT_NAME_CAMEL}}Api;
`;

/**
 * Convert string to PascalCase
 */
function toPascalCase(str) {
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert string to camelCase
 */
function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Generate RTK Query slice
 */
function generateSlice(endpointName, baseUrl) {
  const pascalCase = toPascalCase(endpointName);
  const camelCase = toCamelCase(endpointName);
  const upperCase = endpointName.toUpperCase();
  const date = new Date().toISOString().split('T')[0];

  let content = RTK_SLICE_TEMPLATE;

  // Replace placeholders
  content = content.replace(/{{ENDPOINT_NAME}}/g, endpointName);
  content = content.replace(/{{ENDPOINT_NAME_PASCAL}}/g, pascalCase);
  content = content.replace(/{{ENDPOINT_NAME_CAMEL}}/g, camelCase);
  content = content.replace(/{{ENDPOINT_NAME_UPPER}}/g, upperCase);
  content = content.replace(/{{BASE_URL}}/g, baseUrl);
  content = content.replace(/{{DATE}}/g, date);

  return content;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node generate-rtk-slice.js <endpoint-name> <base-url>');
    console.error('Example: node generate-rtk-slice.js projects /api/projects');
    process.exit(1);
  }

  const [endpointName, baseUrl] = args;
  const outputPath = path.join(process.cwd(), 'src', 'api', 'endpointy', `${endpointName}.ts`);

  console.log('🚀 RTK Query Slice Generator');
  console.log(`📦 Endpoint: ${endpointName}`);
  console.log(`🔗 Base URL: ${baseUrl}`);
  console.log(`📄 Output: ${outputPath}\n`);

  // Check if file already exists
  if (fs.existsSync(outputPath)) {
    console.error(`❌ File already exists: ${outputPath}`);
    console.error('Delete the file first or choose a different endpoint name.');
    process.exit(1);
  }

  // Generate slice content
  const sliceContent = generateSlice(endpointName, baseUrl);

  // Create directory if it doesn't exist
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(outputPath, sliceContent, 'utf8');

  console.log('✅ RTK Query slice generated successfully!');
  console.log('\n📝 Next steps:');
  console.log(`1. Open ${outputPath}`);
  console.log('2. Update the interface with actual fields from backend docs');
  console.log('3. Add any custom endpoints specific to this API');
  console.log('4. Add the API to src/redux/store.ts:');
  console.log(`   import { ${toCamelCase(endpointName)}Api } from '@/api/endpointy/${endpointName}';`);
  console.log(`   middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(${toCamelCase(endpointName)}Api.middleware),`);
  console.log(`   reducer: { [${toCamelCase(endpointName)}Api.reducerPath]: ${toCamelCase(endpointName)}Api.reducer },`);
}

main();
