/**
 * DraggableLayerTree - Tree View z drag & drop reordering
 * Obsługuje przesuwanie warstw góra/dół i pakowanie/wypakowywanie do folderów
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Box, Button } from '@mui/material'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  MeasuringStrategy
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'

import { LayerNode } from '../../state/layers/types'
import { useLayerTree, useLayerActions } from '../../state/layers/hooks'
import DraggableLayerItem from './DraggableLayerItem'

interface DraggableLayerTreeProps {
  searchQuery?: string
  miniMode?: boolean
  maxInitialChildren?: number
  lazyLoadThreshold?: number
}

interface FlattenedItem extends LayerNode {
  parentId: string | null
  depth: number
  index: number
}

const DraggableLayerTree: React.FC<DraggableLayerTreeProps> = ({
  searchQuery = '',
  miniMode = false,
  maxInitialChildren = 50,
  lazyLoadThreshold = 100
}) => {
  const { tree, expandedNodes } = useLayerTree()
  const { onReorder } = useLayerActions()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [loadedChildren, setLoadedChildren] = useState<Set<string>>(new Set())

  // Flatten tree structure for dnd-kit with lazy loading support
  const flattenTree = (
    nodes: LayerNode[],
    parentId: string | null = null,
    depth: number = 0
  ): FlattenedItem[] => {
    const result: FlattenedItem[] = []

    nodes.forEach((node, index) => {
      result.push({
        ...node,
        parentId,
        depth,
        index
      })

      // Only expand children if:
      // 1. Node is expanded AND
      // 2. Either children count is below threshold OR children have been explicitly loaded
      const shouldShowChildren =
        expandedNodes.includes(node.id) &&
        node.children &&
        node.children.length > 0 &&
        (node.children.length <= lazyLoadThreshold || loadedChildren.has(node.id))

      if (shouldShowChildren) {
        // For large child lists, initially show only a subset
        const childrenToShow = loadedChildren.has(node.id)
          ? node.children
          : node.children.slice(0, maxInitialChildren)

        result.push(...flattenTree(childrenToShow, node.id, depth + 1))

        // Add "Load More" indicator if there are more children to load
        if (!loadedChildren.has(node.id) && node.children.length > maxInitialChildren) {
          result.push({
            id: `${node.id}-load-more`,
            name: `Pokaż więcej (${node.children.length - maxInitialChildren} pozostałych)`,
            type: 'load-more' as any,
            visible: true,
            opacity: 1,
            parentId: node.id,
            depth: depth + 1,
            index: maxInitialChildren,
            children: []
          })
        }
      }
    })

    return result
  }

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree

    const filterNodes = (nodes: LayerNode[]): LayerNode[] => {
      const filtered: LayerNode[] = []

      for (const node of nodes) {
        const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase())
        const filteredChildren = node.children ? filterNodes(node.children) : []

        if (matchesSearch || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children
          })
        }
      }

      return filtered
    }

    return filterNodes(tree)
  }, [tree, searchQuery])

  const flattenedItems = flattenTree(filteredTree)
  const itemIds = flattenedItems.map(item => item.id)

  // Configure sensors for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    })
  )

  // Measuring strategy for better performance
  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const activeItem = flattenedItems.find(item => item.id === active.id)
    const overItem = flattenedItems.find(item => item.id === over.id)

    if (!activeItem || !overItem) return

    // Calculate horizontal and vertical drag distances
    const delta = event.delta
    const isHorizontalDrag = Math.abs(delta.x) > Math.abs(delta.y) && Math.abs(delta.x) > 30
    const dragDirection = delta.x > 30 ? 'right' : delta.x < -30 ? 'left' : 'none'

    // Handle horizontal dragging for folder operations
    if (isHorizontalDrag && dragDirection !== 'none') {
      handleFolderOperation(activeItem, dragDirection)
      setActiveId(null)
      setOverId(null)
      return
    }

    // Determine the new parent and position for vertical dragging
    let newParentId = overItem.parentId
    let newPosition = overItem.index

    // If dropping on a group, move inside it
    if (overItem.type === 'group') {
      newParentId = overItem.id
      newPosition = 0
    }

    // Handle reordering logic
    if (activeItem.parentId === newParentId) {
      // Simple reordering within same parent
      const siblings = flattenedItems.filter(item => item.parentId === newParentId)
      const activeIndex = siblings.findIndex(item => item.id === activeItem.id)
      const overIndex = siblings.findIndex(item => item.id === overItem.id)

      if (activeIndex !== overIndex) {
        const newOrder = arrayMove(siblings.map(s => s.id), activeIndex, overIndex)
        onReorder(newParentId, newOrder)
      }
    } else {
      // Moving between different parents
      handleCrossParentMove(activeItem, newParentId, newPosition)
    }

    setActiveId(null)
    setOverId(null)
  }

  const handleCrossParentMove = (
    item: FlattenedItem,
    newParentId: string | null,
    newPosition: number
  ) => {
    // This would need to be implemented based on your backend API
    // For now, we'll use the existing reorder logic
    console.log('Cross-parent move:', {
      itemId: item.id,
      oldParent: item.parentId,
      newParent: newParentId,
      newPosition
    })

    // You might want to implement a specific action for moving items between parents
    // onMoveItem(item.id, newParentId, newPosition)
  }

  const handleFolderOperation = (activeItem: FlattenedItem, direction: 'left' | 'right') => {
    if (direction === 'right') {
      // Pack into folder: find previous sibling group or create new group
      const siblings = flattenedItems.filter(item => item.parentId === activeItem.parentId)
      const activeIndex = siblings.findIndex(item => item.id === activeItem.id)

      // Find previous group sibling
      const previousGroup = siblings
        .slice(0, activeIndex)
        .reverse()
        .find(item => item.type === 'group')

      if (previousGroup) {
        // Move into existing group
        console.log(`Moving ${activeItem.name} into group ${previousGroup.name}`)
        // For now, we'll simulate the move with reorder
        // TODO: Implement proper API call for moving item into group
        // onReorder(previousGroup.id, [activeItem.id])
      } else {
        // Create new group and move item into it
        console.log(`Creating new group for ${activeItem.name}`)
        // TODO: Implement create group and move API call
        // const newGroupName = `Group ${Date.now()}`
        // onAddGroup(newGroupName, activeItem.parentId)
        // Then move item into the new group
      }
    } else if (direction === 'left') {
      // Unpack from folder: move to parent's parent
      if (activeItem.parentId) {
        const parentItem = flattenedItems.find(item => item.id === activeItem.parentId)
        if (parentItem && parentItem.type === 'group') {
          const newParentId = parentItem.parentId
          console.log(`Unpacking ${activeItem.name} from ${parentItem.name} to ${newParentId || 'root'}`)
          // TODO: Implement unpack from folder API call
          // For now, simulate with cross-parent move
          // handleCrossParentMove(activeItem, newParentId, 0)
        }
      }
    }
  }

  const handleLoadMore = (parentId: string) => {
    setLoadedChildren(prev => new Set([...prev, parentId]))
  }

  const activeItem = activeId ? flattenedItems.find(item => item.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuring}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={itemIds}
        strategy={verticalListSortingStrategy}
      >
        <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
          {flattenedItems.map((item) => {
            if (item.type === 'load-more') {
              // Render "Load More" button
              return (
                <Box
                  key={item.id}
                  sx={{
                    pl: item.depth * 2,
                    py: 0.5,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleLoadMore(item.parentId!)}
                    sx={{
                      textTransform: 'none',
                      color: 'primary.main',
                      fontSize: '0.75rem',
                      fontStyle: 'italic'
                    }}
                  >
                    📂 {item.name}
                  </Button>
                </Box>
              )
            }

            // Render normal layer item
            return (
              <DraggableLayerItem
                key={item.id}
                node={item}
                depth={item.depth}
                miniMode={miniMode}
                searchQuery={searchQuery}
                isActive={activeId === item.id}
                isOver={overId === item.id}
              />
            )
          })}
        </Box>
      </SortableContext>

      <DragOverlay>
        {activeItem ? (
          <DraggableLayerItem
            node={activeItem}
            depth={0}
            miniMode={miniMode}
            searchQuery={searchQuery}
            isActive={false}
            isOver={false}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default DraggableLayerTree