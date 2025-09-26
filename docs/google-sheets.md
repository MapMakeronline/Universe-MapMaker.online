# Google Sheets Integration

## Setup

### 1. Utwórz Service Account:
\`\`\`bash
# W Google Cloud Console
1. IAM & Admin > Service Accounts
2. Create Service Account
3. Download JSON key
4. Enable Sheets API
\`\`\`

### 2. Konfiguracja Spreadsheet:
\`\`\`
Arkusz musi mieć strukturę:
- Sheet "layers": id, name, type, url, visible, group
- Sheet "parcels": id, geometry, properties, owner, area
\`\`\`

### 3. Environment Variables:
\`\`\`bash
GOOGLE_SHEETS_SPREADSHEET_ID=1ABC...XYZ
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
\`\`\`

## API Endpoints

### Layers:
- `GET /api/sheets/layers` - pobierz wszystkie warstwy
- `POST /api/sheets/layers` - dodaj warstwę
- `PUT /api/sheets/layers/[id]` - aktualizuj warstwę
- `DELETE /api/sheets/layers/[id]` - usuń warstwę

### Parcels:
- `GET /api/sheets/parcels` - pobierz działki (z paginacją)
- `POST /api/sheets/parcels` - dodaj działkę
- `PUT /api/sheets/parcels/[id]` - aktualizuj działkę

## Data Validation

Wszystkie dane są walidowane przez Zod schemas:

\`\`\`typescript
const LayerSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(['wms', 'wfs', 'mvt']),
  url: z.string().url(),
  visible: z.boolean(),
  group: z.string().optional()
});
