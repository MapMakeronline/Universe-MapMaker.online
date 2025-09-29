# 🗺️ Universe MapMaker

Professional Mapbox-powered mapping application built with Next.js 15+, deployed on Google Cloud Run.

## 🚀 Live Demo

**Production**: [https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app](https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app)

## ✨ Features

- **Interactive Mapbox GL JS Map** - Smooth, responsive mapping experience
- **Real-time Coordinates** - Live position and zoom level display
- **Token Management** - Secure API-based token delivery for production
- **Mobile Optimized** - Touch-friendly controls and responsive design
- **Google Cloud Run** - Scalable, serverless deployment
- **Modern Stack** - Next.js 15+, React 19, TypeScript

## 🏗️ Architecture

### Simple & Clean Structure
```
app/
├── api/mapbox/token/route.ts  # Secure token API endpoint
├── page.tsx                   # Main map component
├── layout.tsx                 # App layout
└── providers.tsx              # Material-UI theme provider
```

### Key Technical Decisions
- **Runtime Token Loading**: API route serves Mapbox tokens at runtime instead of build-time
- **Direct Mapbox Integration**: No abstractions - direct mapbox-gl usage
- **Minimal Dependencies**: Only essential libraries for better performance
- **Cloud Run Deployment**: Containerized deployment with proper region consistency

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/MapMakeronline/Universe-MapMaker.online.git
cd Universe-MapMaker.online
npm install
```

### 2. Get Mapbox Token
1. Sign up at [mapbox.com](https://account.mapbox.com/auth/signup/)
2. Go to [Access Tokens](https://account.mapbox.com/access-tokens/)
3. Copy your **Default Public Token** (starts with `pk.`)

### 3. Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cl91c2VybmFtZSIsImEiOiJjbGZxZXF3MjAwMDExM29zN3...
```

### 4. Run Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 Development

### Scripts
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Code linting
```

### Core Component
The main map is implemented in `app/page.tsx`:

```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

export default function MapPage() {
  // Dynamic token loading from API route
  const initializeMap = async () => {
    const response = await fetch('/api/mapbox/token');
    const { token } = await response.json();
    mapboxgl.accessToken = token;

    // Initialize map...
  };
}
```

### API Route
Token security is handled via `/api/mapbox/token/route.ts`:
```typescript
export async function GET() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  return NextResponse.json({ token });
}
```

## 🌐 Deployment

### Google Cloud Run
The app is configured for automatic deployment to Google Cloud Run:

1. **Build**: Docker multi-stage build
2. **Registry**: Artifact Registry in `europe-central2`
3. **Deploy**: Cloud Run service with environment variables
4. **Region**: All resources in `europe-central2` for consistency

### Deploy Commands
```bash
# Build and deploy
gcloud builds submit --region=europe-central2 --config=cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse HEAD)

# Check deployment
gcloud run services describe universe-mapmaker --region=europe-central2
```

## 📦 Dependencies

### Production Dependencies
```json
{
  "@emotion/react": "^11.14.0",
  "@emotion/styled": "^11.14.1",
  "@mui/material": "^7.3.2",
  "mapbox-gl": "^3.0.0",
  "next": "^15.5.4",
  "react": "^19",
  "react-dom": "^19"
}
```

### Key Features of Dependencies
- **Next.js 15.5.4** - Latest App Router with server components
- **React 19** - Latest React with concurrent features
- **Mapbox GL 3.0** - Latest Mapbox with WebGL2 support
- **Material-UI 7.3** - Modern design system
- **TypeScript 5** - Full type safety

## 🔧 Configuration

### Map Settings
Default map configuration in `app/page.tsx`:
```typescript
const [lng, setLng] = useState(19.9449799);  // Kraków longitude
const [lat, setLat] = useState(50.0646501);  // Kraków latitude
const [zoom, setZoom] = useState(12);        // Zoom level

// Map style
style: 'mapbox://styles/mapbox/streets-v12'
```

### Environment Variables
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox access token
- `NODE_ENV` - Environment (production/development)
- `NEXT_TELEMETRY_DISABLED` - Disable Next.js telemetry

## 🐛 Troubleshooting

### Common Issues

**Map not loading**
- Check browser console for errors
- Verify Mapbox token starts with `pk.`
- Test API endpoint: `/api/mapbox/token`

**Build failures**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Production token issues**
- Tokens are loaded via API route at runtime
- No build-time embedding needed
- Check Cloud Run environment variables

### Debug Info
The app displays real-time debug information:
- **Token Status**: ⏳ (loading) → ✅ (success) → ❌ (error)
- **Coordinates**: Live latitude/longitude
- **Zoom Level**: Current map zoom

## 🚀 Performance

### Bundle Size Optimization
- Removed unused dependencies (Redux, Leaflet, DnD Kit, etc.)
- Direct Mapbox integration without abstractions
- Minimal Material-UI usage
- Tree shaking enabled

### Production Optimizations
- Docker multi-stage builds
- Next.js standalone output
- Proper caching headers
- Lazy loading and code splitting

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/MapMakeronline/Universe-MapMaker.online/issues)
- **Mapbox Documentation**: [docs.mapbox.com](https://docs.mapbox.com/)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)

---

**Built with** ❤️ using **Mapbox GL JS** + **Next.js 15** + **Google Cloud Run**

*Deployed at: [universe-mapmaker-vs4lfmh3ma-lm.a.run.app](https://universe-mapmaker-vs4lfmh3ma-lm.a.run.app)*