"use client"

import { useState } from "react"
import LayerTree from "@/components/layer-tree/LayerTree"
import type { LayerNode } from "@/types/layers"

const demoLayerData: LayerNode[] = [
  {
    id: "demo-root-1",
    name: "Działki",
    visible: true,
    type: "polygon",
    layerIds: ["dzialki-layer"],
    children: [
      {
        id: "dzialki-1",
        name: "Działki budowlane",
        visible: true,
        type: "polygon",
        layerIds: ["dzialki-budowlane"],
      },
      {
        id: "dzialki-2", 
        name: "Działki rolne",
        visible: false,
        type: "polygon",
        layerIds: ["dzialki-rolne"],
      },
    ],
  },
  {
    id: "demo-root-2",
    name: "Infrastruktura",
    visible: true,
    type: "group",
    children: [
      {
        id: "drogi-1",
        name: "Drogi główne",
        visible: true,
        type: "line",
        layerIds: ["drogi-glowne"],
      },
      {
        id: "budynki-1",
        name: "Budynki",
        visible: false,
        type: "point",
        layerIds: ["budynki"],
      },
    ],
  },
  {
    id: "demo-root-3",
    name: "Ortofotomapa",
    visible: true,
    type: "raster",
    layerIds: ["ortofoto"],
  },
  {
    id: "demo-root-4",
    name: "WMS - Mapa topograficzna",
    visible: false,
    type: "wms",
    layerIds: ["wms-topo"],
  },
]

export default function TestLayersPage() {
  const [isVisible, setIsVisible] = useState(true)

  const handleLayerToggle = (node: LayerNode, visible: boolean) => {
    console.log(`Layer ${node.name} (${node.type}) visibility changed to: ${visible}`)
    console.log(`Layer IDs affected:`, node.layerIds)
  }

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden">
      <LayerTree
        data={demoLayerData}
        isVisible={isVisible}
        onTogglePanel={() => setIsVisible(!isVisible)}
        onToggleVisibility={handleLayerToggle}
      />

      {/* Demo Content Area */}
      <div className="flex-1 relative bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl font-bold mb-4">LayerTree Demo</h1>
          <p className="text-lg mb-8">Test nowego komponentu LayerTree</p>
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Funkcje:</h2>
            <ul className="text-left space-y-2">
              <li>✓ Ikony typów warstw (point, line, polygon, raster, WMS)</li>
              <li>✓ Hierarchiczna struktura warstw</li>
              <li>✓ Kontrola widoczności checkbox</li>
              <li>✓ Rozwijanie/zwijanie grup</li>
              <li>✓ Kolorowe ikony według typu warstwy</li>
              <li>✓ Przezroczyste tło</li>
              <li>✓ Przełączanie widoczności panelu</li>
              <li>✓ Console.log dla zmian warstw</li>
            </ul>
          </div>
          <p className="text-sm mt-4 opacity-75">
            Otwórz console przeglądarki aby zobaczyć logi
          </p>
        </div>
      </div>
    </div>
  )
}