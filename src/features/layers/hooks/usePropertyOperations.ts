/**
 * PROPERTY OPERATIONS HOOK
 *
 * Manages backend operations for PropertiesPanel component.
 * Handles project download and WMS/WFS publication.
 */
'use client';

import { useAppDispatch } from '@/redux/hooks';
import { showSuccess, showError, showInfo } from '@/redux/slices/notificationSlice';
import { useExportProjectMutation } from '@/backend/projects';

// Temporary mock hook
const usePublishWMSWFSMutation = () => [async () => {}, { isLoading: false }] as any;

// Types defined locally for now
interface Warstwa {
  id: string;
  nazwa: string;
  widoczna: boolean;
  typ: 'grupa' | 'wektor' | 'raster' | 'wms';
  dzieci?: Warstwa[];
  rozwinięta?: boolean;
}

export function usePropertyOperations(projectName: string, warstwy: Warstwa[]) {
  const dispatch = useAppDispatch();
  const [exportProject, { isLoading: isExporting }] = useExportProjectMutation();
  const [publishWMSWFS, { isLoading: isPublishing }] = usePublishWMSWFSMutation();

  // Handle Project Download
  const handleDownload = async (format: 'qgs' | 'qgz') => {
    if (!projectName) {
      dispatch(showError('Nie można pobrać projektu - brak nazwy projektu'));
      return false;
    }

    console.log(`📥 Downloading project "${projectName}" in format: ${format}`);
    dispatch(showInfo(`Pobieranie projektu w formacie ${format.toUpperCase()}...`, 5000));

    try {
      // Call backend API - automatic download via exportProject
      await exportProject({
        project: projectName,
        project_type: format,
      }).unwrap();

      console.log('✅ Project download started');
      dispatch(showSuccess(`Projekt "${projectName}.${format}" został pobrany`, 5000));

      return true;
    } catch (error: any) {
      console.error('❌ Failed to download project:', error);
      const errorMessage = error?.data?.message || error?.message || 'Nieznany błąd';
      dispatch(showError(`Nie udało się pobrać projektu: ${errorMessage}`, 8000));

      return false;
    }
  };

  // Handle WMS/WFS Publication
  const handlePublish = async (selectedLayerIds: string[]) => {
    if (!projectName) {
      dispatch(showError('Nie można opublikować - brak nazwy projektu'));
      return false;
    }

    if (selectedLayerIds.length === 0) {
      dispatch(showError('Wybierz co najmniej jedną warstwę do publikacji'));
      return false;
    }

    // Check auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    console.log('🔐 WMS/WFS Publish - Auth token:', token ? '✅ present' : '❌ missing');
    console.log('📦 Publishing layers:', selectedLayerIds);
    console.log('📁 Project:', projectName);

    // Build children array with layer tree structure
    // Backend expects: { project_name: string, children: [{type: 'VectorLayer', id, name, geometry}] }
    const buildLayerTree = (layerIds: string[], allLayers: Warstwa[]): any[] => {
      const children: any[] = [];

      // Helper to find layer by ID in tree
      const findLayer = (id: string, layers: Warstwa[]): Warstwa | null => {
        for (const layer of layers) {
          if (layer.id === id) return layer;
          if (layer.dzieci) {
            const found = findLayer(id, layer.dzieci);
            if (found) return found;
          }
        }
        return null;
      };

      for (const layerId of layerIds) {
        const layer = findLayer(layerId, allLayers);
        if (layer) {
          // Map local types to QGIS types
          let layerType = 'VectorLayer';
          if (layer.typ === 'raster') layerType = 'RasterLayer';
          else if (layer.typ === 'grupa') layerType = 'group';

          children.push({
            type: layerType,
            id: layer.id,
            name: layer.nazwa,
            visible: layer.widoczna,
            // Add geometry for vector layers (backend needs this)
            geometry: layer.typ === 'wektor' ? 'MultiPolygon' : undefined
          });
        }
      }

      return children;
    };

    const children = buildLayerTree(selectedLayerIds, warstwy);
    console.log('🌳 Built layer tree for publication:', children);
    console.log('🌳 Layer tree JSON:', JSON.stringify(children, null, 2));

    // Show loading notification
    dispatch(showInfo(`Publikowanie ${selectedLayerIds.length} warstw jako WMS/WFS...`, 10000));

    try {
      const result = await publishWMSWFS({
        project_name: projectName, // Backend expects project_name, not project!
        children: children,        // Backend expects children array, not layers array!
      }).unwrap();

      console.log('✅ WMS/WFS Publication successful:', result);

      // Extract URLs from result.data (backend wraps URLs in data object)
      const wmsUrl = result.data?.wms_url || result.wms_url || '';
      const wfsUrl = result.data?.wfs_url || result.wfs_url || '';

      // Show success with URLs
      const successMsg = `Opublikowano ${selectedLayerIds.length} warstw!\n` +
        `WMS: ${wmsUrl}\n` +
        `WFS: ${wfsUrl}`;
      dispatch(showSuccess(successMsg, 8000));

      return true;
      // RTK Query automatically invalidates cache and refetches project data with new URLs
    } catch (error: any) {
      console.error('❌ WMS/WFS Publication failed:', error);
      console.error('❌ Error status:', error?.status);
      console.error('❌ Error data:', error?.data);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.data?.detail || error?.message || 'Nieznany błąd';
      dispatch(showError(`Nie udało się opublikować usług: ${errorMessage}`, 8000));

      return false;
    }
  };

  return {
    handleDownload,
    handlePublish,
    isExporting,
    isPublishing,
  };
}
