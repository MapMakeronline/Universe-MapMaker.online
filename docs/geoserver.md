# GeoServer Integration

## Supported Services

### WMS (Web Map Service):
- Raster map layers
- GetCapabilities, GetMap requests
- Multiple formats: PNG, JPEG, WebP

### WFS (Web Feature Service):
- Vector data access
- GetFeature, DescribeFeatureType
- GeoJSON output format

### MVT (Mapbox Vector Tiles):
- Optimized vector tiles
- Direct integration with Mapbox GL JS
- Efficient for large datasets

## Configuration

### Environment Variables:
\`\`\`bash
GEOSERVER_URL=https://your-geoserver.com/geoserver
GEOSERVER_WORKSPACE=your_workspace
GEOSERVER_USERNAME=admin
GEOSERVER_PASSWORD=your_password
\`\`\`

### GeoServer Setup:
1. Create workspace
2. Add data stores (PostGIS, Shapefile, etc.)
3. Publish layers
4. Configure security (Basic Auth)

## API Usage

### Test Connection:
\`\`\`bash
GET /api/geoserver/test
\`\`\`

### Get Available Layers:
\`\`\`bash
GET /api/geoserver/layers
\`\`\`

### Get Layer Configuration:
\`\`\`bash
GET /api/geoserver/layer/[name]
\`\`\`

## Integration with Mapbox

Layers are automatically configured for Mapbox GL JS:

\`\`\`typescript
// WMS as raster source
map.addSource('wms-layer', {
  type: 'raster',
  tiles: [\`\${GEOSERVER_URL}/wms?...\`],
  tileSize: 256
});

// MVT as vector source
map.addSource('mvt-layer', {
  type: 'vector',
  tiles: [\`\${GEOSERVER_URL}/gwc/service/tms/1.0.0/workspace:layer@EPSG:3857@pbf/{z}/{x}/{-y}.pbf\`]
});
\`\`\`

## Practical Examples

### WMS Layer Example:
\`\`\`typescript
import { addWmsLayer } from '@/modules/mapRuntime'

// Add WMS raster layer
addWmsLayer(map, {
  id: 'administrative-boundaries',
  wmsUrl: 'https://your-geoserver.com/geoserver/wms',
  params: {
    layers: 'workspace:admin_boundaries',
    format: 'image/png',
    transparent: true,
    version: '1.1.1'
  }
})
\`\`\`

### WFS Data Fetching Example:
\`\`\`typescript
// Fetch GeoJSON data via WFS
const fetchWfsData = async (layerName: string) => {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '1.0.0',
    request: 'GetFeature',
    typeName: \`\${GEOSERVER_WORKSPACE}:\${layerName}\`,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326'
  })
  
  const response = await fetch(\`\${GEOSERVER_URL}/wfs?\${params}\`)
  const geojson = await response.json()
  
  return geojson
}

// Use with mapRuntime
const data = await fetchWfsData('points_of_interest')
addGeoJson(map, {
  id: 'poi-layer',
  data: data,
  paint: {
    'circle-radius': 6,
    'circle-color': '#ff6b6b',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff'
  }
})
\`\`\`

### MVT (Vector Tiles) Example:
\`\`\`typescript
import { addVectorTileLayer } from '@/modules/mapRuntime'

// Add MVT layer for large datasets
addVectorTileLayer(map, {
  id: 'buildings-mvt',
  tiles: [
    'https://your-geoserver.com/geoserver/gwc/service/tms/1.0.0/workspace:buildings@EPSG:3857@pbf/{z}/{x}/{-y}.pbf'
  ],
  sourceLayer: 'buildings',
  paint: {
    'fill-color': '#627BC1',
    'fill-opacity': 0.8,
    'fill-outline-color': '#ffffff'
  },
  layout: {
    'visibility': 'visible'
  }
})
\`\`\`

### Advanced WMS with Custom Parameters:
\`\`\`typescript
// WMS with custom styling and filtering
addWmsLayer(map, {
  id: 'population-density',
  wmsUrl: 'https://your-geoserver.com/geoserver/wms',
  params: {
    layers: 'workspace:population_grid',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    crs: 'EPSG:3857',
    styles: 'population_choropleth', // Custom SLD style
    cql_filter: 'population > 1000'  // Server-side filtering
  }
})
\`\`\`

### Dynamic Layer Management:
\`\`\`typescript
import { setLayerVisibility, setLayerOrder } from '@/modules/mapRuntime'

// Toggle layer visibility
const toggleLayer = (layerId: string, visible: boolean) => {
  setLayerVisibility(map, layerId, visible)
}

// Reorder layers (z-index)
const moveLayerToTop = (layerId: string) => {
  setLayerOrder(map, layerId) // Move to top
}

const moveLayerBefore = (layerId: string, beforeId: string) => {
  setLayerOrder(map, layerId, beforeId)
}
\`\`\`

## GeoServer Client Module

### Basic Usage

\`\`\`typescript
import { 
  getWmsUrl, 
  wfsGetFeatures, 
  addWmsLayerFromGeoServer, 
  addWfsLayerFromGeoServer 
} from '@/modules/geoserver'


// Generate WMS URL for tile requests
const wmsUrl = getWmsUrl({
  base: 'https://your-geoserver.com/geoserver',
  layer: 'workspace:layer_name',
  format: 'image/png',
  transparent: true,
  srs: 'EPSG:3857'
})

// Fetch WFS data as GeoJSON
const geojsonData = await wfsGetFeatures({
  base: 'https://your-geoserver.com/geoserver',
  typeName: 'workspace:layer_name',
  srs: 'EPSG:4326',
  outputFormat: 'application/json',
  maxFeatures: 1000
})

// Add WMS layer directly to map
addWmsLayerFromGeoServer(map, {
  id: 'my-wms-layer',
  geoserverUrl: 'https://your-geoserver.com/geoserver',
  workspace: 'my_workspace',
  layerName: 'my_layer',
  format: 'image/png',
  transparent: true
})

// Add WFS layer as GeoJSON to map
await addWfsLayerFromGeoServer(map, {
  id: 'my-wfs-layer',
  geoserverUrl: 'https://your-geoserver.com/geoserver',
  workspace: 'my_workspace',
  typeName: 'my_layer',
  maxFeatures: 500,
  paint: {
    'circle-radius': 6,
    'circle-color': '#ff6b6b'
  }
})
\`\`\`

### Advanced Features

#### Filtering with CQL
\`\`\`typescript
// Server-side filtering with CQL
const filteredData = await wfsGetFeatures({
  base: 'https://your-geoserver.com/geoserver',
  typeName: 'workspace:cities',
  cql_filter: 'population > 100000 AND country = \'Poland\'',
  maxFeatures: 100
})

// WMS with CQL filter
addWmsLayerFromGeoServer(map, {
  id: 'filtered-cities',
  geoserverUrl: 'https://your-geoserver.com/geoserver',
  workspace: 'demo',
  layerName: 'cities',
  cql_filter: 'population > 50000'
})
\`\`\`

#### Pagination for Large Datasets
\`\`\`typescript
// Fetch data in pages
const fetchAllFeatures = async (typeName: string) => {
  const allFeatures = []
  let startIndex = 0
  const pageSize = 1000
  
  while (true) {
    const page = await wfsGetFeatures({
      base: 'https://your-geoserver.com/geoserver',
      typeName,
      maxFeatures: pageSize,
      startIndex,
      srs: 'EPSG:4326'
    })
    
    if (page.features.length === 0) break
    
    allFeatures.push(...page.features)
    startIndex += pageSize
    
    if (page.features.length < pageSize) break
  }
  
  return {
    type: 'FeatureCollection',
    features: allFeatures
  }
}
\`\`\`

#### Fallback GML Support
\`\`\`typescript
import { wfsGetFeaturesGml, parseGml } from '@/modules/geoserver'

// For servers without GeoJSON support
try {
  const geojsonData = await wfsGetFeatures({
    base: 'https://old-geoserver.com/geoserver',
    typeName: 'workspace:layer',
    outputFormat: 'application/json'
  })
} catch (error) {
  console.log('GeoJSON not supported, falling back to GML')
  
  const gmlData = await wfsGetFeaturesGml({
    base: 'https://old-geoserver.com/geoserver',
    typeName: 'workspace:layer'
  })
  
  const geojsonData = await parseGml(gmlData)
  // Use geojsonData...
}
\`\`\`

## Performance Tips

### For WMS:
- Use appropriate tile size (256px recommended)
- Enable GeoWebCache for better performance
- Use proper CRS (EPSG:3857 for web maps)

### For WFS:
- Limit features with maxFeatures parameter
- Use bbox parameter for spatial filtering
- Consider pagination for large datasets

### For MVT:
- Configure proper zoom levels in GeoServer
- Use appropriate simplification settings
- Enable compression (gzip)

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Configure CORS in GeoServer web.xml
   - Add proper headers in middleware

2. **Authentication Issues**:
   - Verify credentials in environment variables
   - Check GeoServer security settings

3. **Performance Issues**:
   - Enable GeoWebCache
   - Optimize layer configurations
   - Use appropriate zoom level ranges

4. **Styling Issues**:
   - Verify SLD styles in GeoServer
   - Check layer paint/layout properties
   - Use proper data types in styling expressions
