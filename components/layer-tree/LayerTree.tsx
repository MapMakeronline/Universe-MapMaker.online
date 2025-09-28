"use client"

import { useState } from "react"
import { Checkbox, IconButton, Collapse, Box, Typography } from "@mui/material"
import PlaceIcon from "@mui/icons-material/Place"
import PolylineIcon from "@mui/icons-material/Polyline"
import PentagonIcon from "@mui/icons-material/Pentagon"
import ImageIcon from "@mui/icons-material/Image"
import LayersIcon from "@mui/icons-material/Layers"
import FolderIcon from "@mui/icons-material/Folder"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import PublicIcon from "@mui/icons-material/Public"
import type { LayerNode } from "@/types/layers"

type Props = {
  data: LayerNode[]
  onToggleVisibility?: (node: LayerNode, visible: boolean) => void
  isVisible?: boolean
  onTogglePanel?: () => void
}

export default function LayerTree({ data, onToggleVisibility, isVisible = true, onTogglePanel }: Props) {
  const initializeState = (nodes: LayerNode[]): Record<string, boolean> => {
    const result: Record<string, boolean> = {}
    const processNode = (node: LayerNode) => {
      result[node.id] = node.visible !== false
      if (node.children) {
        node.children.forEach(processNode)
      }
    }
    nodes.forEach(processNode)
    return result
  }

  const [visibilityState, setVisibilityState] = useState<Record<string, boolean>>(initializeState(data))
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>(
    Object.fromEntries(data.filter(n => n.children).map(n => [n.id, true]))
  )

  const handleCheck = (node: LayerNode) => {
    const next = !visibilityState[node.id]
    setVisibilityState((s) => ({ ...s, [node.id]: next }))
    onToggleVisibility?.(node, next)
  }

  const handleToggleExpand = (nodeId: string) => {
    setExpandedState((s) => ({ ...s, [nodeId]: !s[nodeId] }))
  }

  const getLayerIcon = (type?: string) => {
    switch (type) {
      case "point":
        return <PlaceIcon sx={{ color: "#4CAF50" }} />
      case "line":
        return <PolylineIcon sx={{ color: "#2196F3" }} />
      case "polygon":
        return <PentagonIcon sx={{ color: "#FF9800" }} />
      case "raster":
        return <ImageIcon sx={{ color: "#9C27B0" }} />
      case "wms":
        return <PublicIcon sx={{ color: "#00BCD4" }} />
      case "group":
        return <FolderIcon sx={{ color: "#FFC107" }} />
      default:
        return <LayersIcon sx={{ color: "#607D8B" }} />
    }
  }

  const renderLayerNode = (node: LayerNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedState[node.id]

    return (
      <Box key={node.id}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            pl: level * 3,
            py: 0.5,
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={() => handleToggleExpand(node.id)}
              sx={{ p: 0.5 }}
            >
              {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </IconButton>
          )}
          {!hasChildren && <Box sx={{ width: 32 }} />}

          <Checkbox
            checked={!!visibilityState[node.id]}
            onChange={() => handleCheck(node)}
            size="small"
            sx={{ p: 0.5 }}
          />

          {getLayerIcon(node.type)}

          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {node.name}
          </Typography>
        </Box>

        {hasChildren && (
          <Collapse in={isExpanded}>
            {node.children!.map((child) => renderLayerNode(child, level + 1))}
          </Collapse>
        )}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" component="h2">
          Warstwy
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 1,
        }}
      >
        {data.map((node) => renderLayerNode(node))}
      </Box>
    </Box>
  )
}