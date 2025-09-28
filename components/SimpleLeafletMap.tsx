"use client"

import { useEffect, useRef, useState } from "react"

export interface SimpleLeafletMapProps {
  onMapLoad?: (map: any) => void
  onLayerToggle?: (layerId: string, visible: boolean) => void
}

export default function SimpleLeafletMap({ onMapLoad, onLayerToggle }: SimpleLeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<any>(null)

  useEffect(() => {
    if (!mapContainer.current || mapInstance) return

    const initializeMap = async () => {
      try {
        console.log("🗺️ Starting SIMPLE Leaflet for main app...")

        // Import Leaflet
        const L = await import("leaflet")
        await import("leaflet/dist/leaflet.css")

        console.log("✅ Leaflet imported, version:", L.default.version)

        // Fix for default markers
        delete (L.default.Icon.Default.prototype as any)._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })

        // Create simple Leaflet map
        const map = L.default.map(mapContainer.current!, {
          center: [52.0, 19.0], // Poland
          zoom: 6,
          zoomControl: true
        })

        // Add OpenStreetMap tiles
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)

        // Add sample layers
        addSampleLayers(map, L.default)

        console.log("🎯 SIMPLE Leaflet map for main app loaded successfully!")

        setMapInstance(map)

        // Create compatibility wrapper
        const mapWrapper = {
          ...map,
          toggleLayerVisibility: (layerId: string, visible: boolean) => {
            console.log(`🔄 Toggle layer ${layerId}: ${visible}`)
            const sampleLayers = (map as any)._sampleLayers
            if (sampleLayers && sampleLayers[layerId]) {
              const layer = sampleLayers[layerId]
              if (Array.isArray(layer)) {
                // Handle array of markers (POI)
                layer.forEach(marker => {
                  if (visible) {
                    marker.addTo(map)
                  } else {
                    map.removeLayer(marker)
                  }
                })
              } else if (layer) {
                // Handle single layer
                if (visible) {
                  layer.addTo(map)
                } else {
                  map.removeLayer(layer)
                }
              }
            }
          },
          setLayoutProperty: () => {},
          addSource: () => {},
          addLayer: () => {}
        }

        onMapLoad?.(mapWrapper)

      } catch (err) {
        console.error("💥 Failed to load simple map for main app:", err)
      }
    }

    initializeMap()

    return () => {
      if (mapInstance) {
        console.log("🧹 Cleaning up simple map")
        mapInstance.remove()
      }
    }
  }, [])

  const addSampleLayers = (map: any, L: any) => {
    try {
      console.log("🗂️ Adding sample layers...")

      // Add sample markers (POI)
      const warszawaMarker = L.marker([52.2297, 21.0122])
        .bindPopup('Warszawa - Stolica Polski')

      const krakowMarker = L.marker([50.0647, 19.9445])
        .bindPopup('Kraków - Miasto Królów')

      // Add sample polygon (parcel)
      const sampleParcel = L.polygon([
        [52.2, 21.0],
        [52.25, 21.0],
        [52.25, 21.05],
        [52.2, 21.05]
      ], {
        color: '#FF9800',
        fillColor: '#FF9800',
        fillOpacity: 0.6
      }).bindPopup('Przykładowa działka ewidencyjna')

      // Add sample polyline (road)
      const sampleRoad = L.polyline([
        [52.2297, 21.0122],
        [50.0647, 19.9445],
        [51.1079, 17.0385]
      ], {
        color: '#2196F3',
        weight: 4
      }).bindPopup('Przykładowa droga krajowa')

      // Store references for layer control
      ;(map as any)._sampleLayers = {
        'poi-layer': [warszawaMarker, krakowMarker],
        'parcels-layer': sampleParcel,
        'roads-layer': sampleRoad,
        'buildings-layer': null
      }

      // Add visible layers by default
      sampleParcel.addTo(map)
      sampleRoad.addTo(map)

      console.log("✅ Sample layers added successfully")

    } catch (err) {
      console.error("❌ Error adding layers:", err)
    }
  }

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        position: "relative"
      }}
    />
  )
}