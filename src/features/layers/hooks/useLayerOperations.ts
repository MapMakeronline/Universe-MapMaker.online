/**
 * useLayerOperations Hook
 *
 * Centralized layer CRUD operations with backend synchronization.
 * Extracted from LeftPanel.tsx to reduce complexity and improve testability.
 *
 * Provides operations for:
 * - Import layer from file (GeoJSON, Shapefile, GML, GeoTIFF)
 * - Add group
 * - Delete layer/group
 * - Toggle layer visibility
 *
 * All operations use optimistic updates with backend sync and error handling.
 *
 * Usage:
 * const { handleImportLayer, handleAddGroup, handleDeleteLayer, toggleVisibility } = useLayerOperations(projectName, layers);
 */

import { useAppDispatch } from '@/redux/hooks';
import {
  toggleLayerVisibility,
  toggleGroupVisibilityCascade,
} from '@/redux/slices/layersSlice';
import { showSuccess, showError, showInfo } from '@/redux/slices/notificationSlice';
import { projectsApi } from '@/backend/projects';
import {
  useAddGeoJsonLayerMutation,
  useAddShpLayerMutation,
  useAddGmlLayerMutation,
  useAddRasterLayerMutation,
  useSetLayerVisibilityMutation,
} from '@/backend/layers';
import {
  useAddGroupMutation,
  useRemoveGroupsAndLayersMutation,
} from '@/backend/groups';
import { LayerNode } from '@/types-app/layers';
import { findLayerById } from '@/utils/layerTreeUtils';

/**
 * useLayerOperations Hook
 *
 * @param projectName - Current project name
 * @param layers - Current layer tree state from Redux
 * @returns Layer operation handlers
 */
export function useLayerOperations(projectName: string, layers: LayerNode[]) {
  const dispatch = useAppDispatch();

  // Backend mutations
  const [addGeoJsonLayer] = useAddGeoJsonLayerMutation();
  const [addShpLayer] = useAddShpLayerMutation();
  const [addGmlLayer] = useAddGmlLayerMutation();
  const [addRasterLayer] = useAddRasterLayerMutation();
  const [addGroup] = useAddGroupMutation();
  const [removeGroupsAndLayers] = useRemoveGroupsAndLayersMutation();
  const [setLayerVisibility] = useSetLayerVisibilityMutation();

  /**
   * Import layer from file (GeoJSON, Shapefile, GML, GeoTIFF)
   *
   * Supports:
   * - GeoJSON (.geojson, .json)
   * - Shapefile (.shp + .shx, .dbf, .prj, .cpg, etc.)
   * - GML (.gml)
   * - GeoTIFF (.tif, .tiff)
   *
   * Backend automatically:
   * - Validates geometry
   * - Fixes invalid geometries
   * - Imports to PostGIS
   * - Updates project tree.json
   * - Generates layer styling
   */
  const handleImportLayer = async (data: {
    nazwaWarstwy: string;
    nazwaGrupy: string;
    format: string;
    file?: File;
    files?: FileList | null; // Multiple files for Shapefile
    epsg?: string;
  }) => {
    if (!projectName) {
      dispatch(showError('Nie można zaimportować warstwy - brak nazwy projektu'));
      return;
    }

    // Validation
    if (data.format === 'shp') {
      // For Shapefile, check if files (multiple) are provided
      if (!data.files || data.files.length === 0) {
        dispatch(showError('Nie wybrano plików do importu (wymagane: .shp, .shx, .dbf)'));
        return;
      }
    } else {
      // For other formats, check single file
      if (!data.file) {
        dispatch(showError('Nie wybrano pliku do importu'));
        return;
      }
    }

    if (!data.nazwaWarstwy.trim()) {
      dispatch(showError('Nazwa warstwy nie może być pusta'));
      return;
    }

    // Show loading notification (context='layer' will auto-replace previous layer notifications)
    dispatch(showInfo(`Importowanie warstwy "${data.nazwaWarstwy}"...`, 10000, 'layer'));

    try {
      // Route to appropriate backend endpoint based on format
      switch (data.format) {
        case 'geoJSON':
          console.log('📥 Importing GeoJSON layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            file: data.file?.name,
          });

          // Backend docs: 'parent' is optional - send undefined for root level
          const parentGeoJson = data.nazwaGrupy === 'Stwórz poza grupami' ? undefined : data.nazwaGrupy;
          const formDataGeoJson = new FormData();
          // Backend expects simple field name 'geojson' (not 'uploaded_layer.geojson')
          formDataGeoJson.append('geojson', data.file!);

          await addGeoJsonLayer({
            params: {
              project: projectName,
              layer_name: data.nazwaWarstwy,
              parent: parentGeoJson,
            },
            files: formDataGeoJson,
          }).unwrap();
          break;

        case 'shp':
          // Extract files by extension from FileList
          console.log('🔍 DEBUG - Shapefile import data:', {
            hasFiles: !!data.files,
            filesCount: data.files?.length,
            filesList: data.files ? Array.from(data.files).map((f) => f.name) : [],
          });

          const filesArray = Array.from(data.files || []);
          const shpFile = filesArray.find((f) => f.name.toLowerCase().endsWith('.shp'));
          const shxFile = filesArray.find((f) => f.name.toLowerCase().endsWith('.shx'));
          const dbfFile = filesArray.find((f) => f.name.toLowerCase().endsWith('.dbf'));
          const prjFile = filesArray.find((f) => f.name.toLowerCase().endsWith('.prj'));
          const cpgFile = filesArray.find((f) => f.name.toLowerCase().endsWith('.cpg'));
          const qpjFile = filesArray.find((f) => f.name.toLowerCase().endsWith('.qpj'));

          console.log('📦 Extracted Shapefile components:', {
            shp: shpFile?.name,
            shx: shxFile?.name,
            dbf: dbfFile?.name,
            prj: prjFile?.name,
            cpg: cpgFile?.name,
            qpj: qpjFile?.name,
          });

          if (!shpFile) {
            console.error('❌ No .shp file found in:', filesArray.map((f) => f.name));
            throw new Error('Plik .shp jest wymagany');
          }

          console.log('📥 Importing Shapefile layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            files: filesArray.map((f) => f.name),
            epsg: data.epsg,
          });

          // Backend expects "project" not "project_name"
          // Backend docs: 'parent' is optional - send undefined for root level
          const parentShp = data.nazwaGrupy === 'Stwórz poza grupami' ? undefined : data.nazwaGrupy;

          // Create FormData with all Shapefile components
          // IMPORTANT: Backend expects field names WITHOUT prefix: shp, shx, dbf, prj, cpg
          // (Documentation is wrong - it says uploaded_layer.shp but backend uses just 'shp')
          const formDataShp = new FormData();
          if (shpFile) formDataShp.append('shp', shpFile);
          if (shxFile) formDataShp.append('shx', shxFile);
          if (dbfFile) formDataShp.append('dbf', dbfFile);
          if (prjFile) formDataShp.append('prj', prjFile);
          if (cpgFile) formDataShp.append('cpg', cpgFile);
          if (qpjFile) formDataShp.append('qpj', qpjFile);

          await addShpLayer({
            params: {
              project: projectName,
              layer_name: data.nazwaWarstwy,
              parent: parentShp,
              epsg: data.epsg ? parseInt(data.epsg) : undefined,
              encoding: 'UTF-8',
            },
            files: formDataShp,
          }).unwrap();
          break;

        case 'gml':
          console.log('📥 Importing GML layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            file: data.file?.name,
            epsg: data.epsg,
          });

          // Backend docs: 'parent' is optional - send undefined for root level
          const parentGml = data.nazwaGrupy === 'Stwórz poza grupami' ? undefined : data.nazwaGrupy;
          const formDataGml = new FormData();
          // Backend expects simple field name 'gml' (not 'uploaded_layer.gml')
          formDataGml.append('gml', data.file!);

          await addGmlLayer({
            params: {
              project: projectName,
              layer_name: data.nazwaWarstwy,
              parent: parentGml,
              epsg: data.epsg ? parseInt(data.epsg) : undefined,
            },
            files: formDataGml,
          }).unwrap();
          break;

        case 'geoTIFF':
          console.log('📥 Importing GeoTIFF raster layer:', {
            project: projectName,
            layerName: data.nazwaWarstwy,
            file: data.file?.name,
          });

          // Backend docs: 'parent' is optional - send undefined for root level
          const parentTiff = data.nazwaGrupy === 'Stwórz poza grupami' ? undefined : data.nazwaGrupy;
          const formDataTiff = new FormData();
          // Backend expects simple field name 'raster' (not 'uploaded_layer.tif')
          formDataTiff.append('raster', data.file!);

          await addRasterLayer({
            params: {
              project: projectName,
              layer_name: data.nazwaWarstwy,
              parent: parentTiff,
            },
            files: formDataTiff,
          }).unwrap();
          break;

        default:
          throw new Error(`Nieobsługiwany format: ${data.format}`);
      }

      console.log('✅ Layer imported successfully');

      // ✅ MANUAL REFETCH - Force regenerate tree.json from backend
      // RTK Query cache invalidation doesn't work between separate APIs (layersApi vs projectsApi)
      // So we manually invalidate the 'Project' tag in projectsApi to trigger refetch
      console.log('🔄 Triggering manual refetch of project data (tree.json)');
      dispatch(projectsApi.util.invalidateTags([{ type: 'Project', id: projectName }]));

      // Success notification (replaces "Importowanie..." notification)
      dispatch(showSuccess(`Warstwa "${data.nazwaWarstwy}" została zaimportowana!`, 5000, 'layer'));
    } catch (error: any) {
      console.error('❌ Failed to import layer:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.data?.error || error?.message || 'Nieznany błąd';

      // Log full error data for debugging
      if (error?.data) {
        console.error('Backend error data:', error.data);
      }

      // Error notification (replaces "Importowanie..." notification)
      dispatch(showError(`Nie udało się zaimportować warstwy: ${errorMessage}`, 8000, 'layer'));
    }
  };

  /**
   * Add Group with backend sync
   *
   * Process:
   * 1. Validate input
   * 2. Call backend API to create group in QGS file
   * 3. Refetch project data (tree.json) to update Redux state
   * 4. Show success notification
   *
   * Backend endpoint: POST /api/groups/add
   * Documentation: docs/backend/groups_api_docs.md (lines 16-60)
   */
  const handleAddGroup = async (data: { nazwaGrupy: string; grupaNadrzedna: string }) => {
    if (!projectName) {
      dispatch(showError('Nie można dodać grupy - brak nazwy projektu'));
      return;
    }

    // Validation
    if (!data.nazwaGrupy.trim()) {
      dispatch(showError('Nazwa grupy nie może być pusta'));
      return;
    }

    // Show loading notification (context='group' will auto-replace previous group notifications)
    dispatch(showInfo(`Tworzenie grupy "${data.nazwaGrupy}"...`, 8000, 'group'));

    try {
      // Determine parent group name
      // "Stwórz poza grupami" → empty string (root level)
      // Otherwise → group name (not ID!)
      const parentGroupName =
        data.grupaNadrzedna === 'Stwórz poza grupami' ? '' : data.grupaNadrzedna;

      console.log('➕ Adding group:', {
        project: projectName,
        groupName: data.nazwaGrupy,
        parent: parentGroupName || '(root)',
      });

      // Call backend API
      await addGroup({
        project: projectName,
        group_name: data.nazwaGrupy,
        parent: parentGroupName,
      }).unwrap();

      console.log('✅ Group added successfully');

      // RTK Query automatically invalidates 'Project' tag and refetches tree.json
      // Redux state will update automatically via QGISProjectLoader

      // Success notification (replaces "Tworzenie grupy..." notification)
      dispatch(showSuccess(`Grupa "${data.nazwaGrupy}" została utworzona!`, 5000, 'group'));
    } catch (error: any) {
      console.error('❌ Failed to add group:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.data?.error || error?.message || 'Nieznany błąd';

      // Error notification (replaces "Tworzenie grupy..." notification)
      dispatch(showError(`Nie udało się dodać grupy: ${errorMessage}`, 8000, 'group'));
    }
  };

  /**
   * Delete layer or group with backend sync
   *
   * Supports:
   * - Individual layers (via /api/groups/layer/remove with layers=[id])
   * - Groups (via /api/groups/layer/remove with groups=[name])
   *
   * Process:
   * 1. Validate selection (layer or group)
   * 2. Call backend API to remove from QGS file
   * 3. Optionally delete from PostgreSQL database
   * 4. Refetch project data (tree.json) to update Redux state
   * 5. Close properties panel
   *
   * Backend endpoint: POST /api/groups/layer/remove
   * Documentation: docs/backend/groups_api_docs.md (lines 63-105)
   *
   * IMPORTANT:
   * - groups: array of group NAMES (not IDs!)
   * - layers: array of layer IDs
   * - remove_from_database: true to delete from PostgreSQL
   */
  const handleDeleteLayer = async (selectedLayer: LayerNode | null) => {
    if (!selectedLayer) {
      console.warn('⚠️ No layer/group selected for deletion');
      return;
    }

    if (!projectName) {
      dispatch(showError('Nie można usunąć - brak nazwy projektu'));
      return;
    }

    const isGroup = selectedLayer.type === 'group';
    const itemName = selectedLayer.name;
    const itemId = selectedLayer.id;
    const itemType = isGroup ? 'grupy' : 'warstwy';
    // Use context based on item type: 'group' or 'layer'
    const notificationContext = isGroup ? 'group' : 'layer';

    try {
      console.log(`🗑️ Deleting ${itemType}:`, {
        project: projectName,
        name: itemName,
        id: itemId,
        type: selectedLayer.type,
      });

      // Show loading notification
      dispatch(showInfo(`Usuwanie ${itemType} "${itemName}"...`, 8000, notificationContext));

      // Call unified backend endpoint for both groups and layers
      await removeGroupsAndLayers({
        project: projectName,
        groups: isGroup ? [itemName] : [], // Groups use NAMES
        layers: isGroup ? [] : [itemId], // Layers use IDs
        remove_from_database: true, // Delete from PostgreSQL
      }).unwrap();

      console.log(`✅ ${itemType} deleted from backend`);

      // RTK Query automatically invalidates 'Project' tag and refetches tree.json
      // Redux state will update automatically via QGISProjectLoader

      // Show success message (replaces "Usuwanie..." notification)
      dispatch(
        showSuccess(
          `${isGroup ? 'Grupa' : 'Warstwa'} "${itemName}" została usunięta`,
          5000,
          notificationContext
        )
      );

      return true; // Success indicator for component to close properties panel
    } catch (error: any) {
      console.error(`❌ Failed to delete ${itemType}:`, error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Extract error message from backend response
      const errorMessage = error?.data?.message || error?.data?.error || error?.message || 'Nieznany błąd';

      // Error notification (replaces "Usuwanie..." notification)
      dispatch(showError(`Nie udało się usunąć ${itemType}: ${errorMessage}`, 8000, notificationContext));

      return false; // Failure indicator
    }
  };

  /**
   * Toggle layer visibility with backend sync
   *
   * For groups: cascades visibility to all children (Redux only - backend doesn't store group visibility)
   * For individual layers: syncs with backend via /api/layer/selection
   *
   * Uses optimistic updates with rollback on error
   */
  const toggleVisibility = async (id: string) => {
    if (!projectName) {
      console.warn('⚠️ No project name - skipping visibility toggle');
      dispatch(showError('Nie można zmienić widoczności - brak nazwy projektu'));
      return;
    }

    const layer = findLayerById(layers, id);
    if (!layer) {
      console.warn('⚠️ Layer not found:', id);
      return;
    }

    // 1. Optimistic update - update Redux immediately for instant UI feedback
    if (layer.type === 'group' && layer.children) {
      // Groups: cascade to all children (Redux only)
      dispatch(toggleGroupVisibilityCascade(id));
      console.log('👁️ Toggled group visibility (Redux only):', layer.name);
      return;
    } else {
      // Individual layer: toggle in Redux first
      const previousVisibility = layer.visible;
      dispatch(toggleLayerVisibility(id));
      console.log('👁️ Toggling layer visibility:', layer.name, '→', !previousVisibility);

      // 2. Sync with backend (async)
      try {
        await setLayerVisibility({
          project: projectName,
          layer_id: id, // Use layer ID (not name)
          checked: !previousVisibility, // Backend expects 'checked' (not 'visible')
        }).unwrap();

        console.log('✅ Layer visibility synced to backend:', {
          layer: layer.name,
          id,
          visible: !previousVisibility,
        });
      } catch (error: any) {
        console.error('❌ Failed to sync layer visibility:', error);

        // 3. Rollback on error - revert Redux state
        dispatch(toggleLayerVisibility(id));

        const errorMessage = error?.data?.message || error?.message || 'Nieznany błąd';
        dispatch(showError(`Nie udało się zapisać widoczności: ${errorMessage}`, 6000));
      }
    }
  };

  return {
    handleImportLayer,
    handleAddGroup,
    handleDeleteLayer,
    toggleVisibility,
  };
}
