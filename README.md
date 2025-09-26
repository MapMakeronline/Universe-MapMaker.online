# Universe MapMaker

Professional mapping application built with Next.js, Redux Toolkit, Material UI, and Mapbox GL JS.

## Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, Material UI
- **State Management**: Redux Toolkit + RTK Query
- **Mapping**: Mapbox GL JS with custom runtime
- **Integrations**: Google Sheets API, GeoServer (WMS/WFS/MVT)
- **Deployment**: Google Cloud Run with Docker
- **Testing**: Vitest + Playwright

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
npm run test:e2e

# Lint and format
npm run lint
npm run lint:fix
\`\`\`

## Environment Variables

\`\`\`env
# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Google Sheets
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_PARENT_FOLDER_ID=optional_folder_id

# Django Backend (for proxy endpoints)
DJANGO_API_URL=http://localhost:8000/api

# Application
APP_BASE_URL=https://your-app.run.app
\`\`\`

## Project Structure

\`\`\`
app/                    # Next.js App Router
├── (app)/             # Main application layout
├── api/               # API routes
│   └── proxy/         # Proxy endpoints to Django
├── globals.css        # Global styles
├── layout.tsx         # Root layout
└── providers.tsx      # Redux & Theme providers

src/
├── components/ui/     # Reusable UI components
├── lib/              # Utilities and theme
├── modules/          # Feature modules
│   ├── geoserver/    # GeoServer integration
│   ├── google/       # Google Sheets integration
│   └── mapRuntime.ts # Map runtime logic
└── state/            # Redux store and slices
    └── services/     # RTK Query API definitions

docs/                 # Documentation
├── DEPLOY.md         # Deployment guide
├── google-sheets.md  # Google Sheets setup
├── geoserver.md      # GeoServer integration
├── security.md       # Security guidelines
└── adr/             # Architecture Decision Records
\`\`\`

## API Development

### Adding New RTK Query Endpoints

1. **Define the endpoint in `src/state/services/api.ts`:**

\`\`\`typescript
// Add to endpoints builder
getNewData: builder.query<ResponseType, RequestType>({
  query: (params) => ({
    url: '/proxy/new-endpoint',
    params,
  }),
  providesTags: ['NewDataTag'],
}),
\`\`\`

2. **Create corresponding proxy route in `src/app/api/proxy/`:**

\`\`\`typescript
// src/app/api/proxy/new-endpoint/route.ts
export async function GET(request: NextRequest) {
  // Validation, proxy to Django, error handling
}
\`\`\`

3. **Add tag types for cache invalidation:**

\`\`\`typescript
// In api.ts tagTypes array
tagTypes: ["Parcel", "Offer", "Layer", "GeoData", "NewDataTag"],
\`\`\`

### Tag Versioning Strategy

- **Entity tags**: `{ type: 'Parcel', id: '123' }` for specific entities
- **List tags**: `{ type: 'Parcel', id: 'LIST' }` for collections
- **Partial tags**: `'Parcel'` for invalidating all parcel-related data
- **Conditional tags**: Use functions to provide tags based on response data

Example:
\`\`\`typescript
providesTags: (result, error, arg) => 
  result
    ? [
        ...result.map(({ id }) => ({ type: 'Parcel' as const, id })),
        { type: 'Parcel', id: 'LIST' },
      ]
    : [{ type: 'Parcel', id: 'LIST' }],
\`\`\`

### Error Handling

All API responses follow consistent error format:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
\`\`\`

Common error codes:
- `VALIDATION_ERROR`: Invalid request parameters
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript check
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for detailed deployment instructions.
