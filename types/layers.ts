export type LayerType = "point" | "line" | "polygon" | "raster" | "wms" | "group"

export type LayerNode = {
  id: string
  name: string
  visible?: boolean
  layerIds?: string[]
  children?: LayerNode[]
  disabled?: boolean
  type?: LayerType
}