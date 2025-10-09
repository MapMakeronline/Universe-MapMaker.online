// Layers API service for GeoCraft Backend
// Handles layer operations: add, edit, delete, style, export

import { apiClient } from './client';
import type {
  Layer,
  AddGeoJsonLayerData,
  UpdateLayerStyleData,
  LayerAttribute,
  ExportLayerOptions,
  LayerStyle,
} from './types';

class LayersService {
  /**
   * Add GeoJSON layer to project
   */
  async addGeoJsonLayer(data: AddGeoJsonLayerData): Promise<{ success: boolean; layer_name: string }> {
    const formData = new FormData();
    formData.append('project_name', data.project_name);
    formData.append('layer_name', data.layer_name);

    // Handle both File and GeoJSON object
    if (data.geojson instanceof File) {
      formData.append('file', data.geojson);
    } else {
      const geojsonBlob = new Blob([JSON.stringify(data.geojson)], {
        type: 'application/json',
      });
      formData.append('file', geojsonBlob, `${data.layer_name}.geojson`);
    }

    if (data.epsg) {
      formData.append('epsg', data.epsg);
    }

    return apiClient.post('/api/layer/add/geojson/', formData);
  }

  /**
   * Add Shapefile layer to project
   */
  async addShapefileLayer(
    projectName: string,
    layerName: string,
    files: {
      shp: File;
      shx: File;
      dbf: File;
      prj?: File;
    }
  ): Promise<{ success: boolean; layer_name: string }> {
    const formData = new FormData();
    formData.append('project_name', projectName);
    formData.append('layer_name', layerName);
    formData.append('shp', files.shp);
    formData.append('shx', files.shx);
    formData.append('dbf', files.dbf);
    if (files.prj) {
      formData.append('prj', files.prj);
    }

    return apiClient.post('/api/layer/add/shp/', formData);
  }

  /**
   * Add GML layer to project
   */
  async addGMLLayer(
    projectName: string,
    layerName: string,
    file: File
  ): Promise<{ success: boolean; layer_name: string }> {
    const formData = new FormData();
    formData.append('project_name', projectName);
    formData.append('layer_name', layerName);
    formData.append('file', file);

    return apiClient.post('/api/layer/add/gml/', formData);
  }

  /**
   * Add existing layer from database
   */
  async addExistingLayer(
    projectName: string,
    layerName: string,
    tableName: string
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/add/existing', {
      project_name: projectName,
      layer_name: layerName,
      table_name: tableName,
    });
  }

  /**
   * Update layer style
   */
  async updateLayerStyle(data: UpdateLayerStyleData): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/style', data);
  }

  /**
   * Reset layer style to default
   */
  async resetLayerStyle(projectName: string, layerName: string): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/style/reset', {
      project_name: projectName,
      layer_name: layerName,
    });
  }

  /**
   * Delete layer from project
   */
  async deleteLayer(projectName: string, layerName: string): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/remove/database', {
      project_name: projectName,
      layer_name: layerName,
    });
  }

  /**
   * Get layer attributes (columns)
   */
  async getLayerAttributes(
    projectName: string,
    layerName: string
  ): Promise<{ attributes: LayerAttribute[] }> {
    return apiClient.post('/api/layer/attributes', {
      project_name: projectName,
      layer_name: layerName,
    });
  }

  /**
   * Get layer attribute names
   */
  async getAttributeNames(
    projectName: string,
    layerName: string
  ): Promise<{ columns: string[] }> {
    return apiClient.post('/api/layer/attributes/names', {
      project_name: projectName,
      layer_name: layerName,
    });
  }

  /**
   * Get layer attribute names and types
   */
  async getAttributeNamesAndTypes(
    projectName: string,
    layerName: string
  ): Promise<{ columns: Array<{ name: string; type: string }> }> {
    return apiClient.post('/api/layer/attributes/names_and_types', {
      project_name: projectName,
      layer_name: layerName,
    });
  }

  /**
   * Add column to layer
   */
  async addColumn(
    projectName: string,
    layerName: string,
    columnName: string,
    columnType: string
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/column/add', {
      project_name: projectName,
      layer_name: layerName,
      column_name: columnName,
      column_type: columnType,
    });
  }

  /**
   * Rename column in layer
   */
  async renameColumn(
    projectName: string,
    layerName: string,
    oldName: string,
    newName: string
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/column/rename', {
      project_name: projectName,
      layer_name: layerName,
      old_name: oldName,
      new_name: newName,
    });
  }

  /**
   * Remove column from layer
   */
  async removeColumn(
    projectName: string,
    layerName: string,
    columnName: string
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/column/remove', {
      project_name: projectName,
      layer_name: layerName,
      column_name: columnName,
    });
  }

  /**
   * Set layer visibility
   */
  async setLayerVisibility(
    projectName: string,
    layerName: string,
    visible: boolean
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/selection', {
      project_name: projectName,
      layer_name: layerName,
      visible,
    });
  }

  /**
   * Rename layer
   */
  async renameLayer(
    projectName: string,
    layerName: string,
    newName: string
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/name', {
      project_name: projectName,
      layer_name: layerName,
      new_name: newName,
    });
  }

  /**
   * Clone layer
   */
  async cloneLayer(
    projectName: string,
    layerName: string,
    newLayerName: string
  ): Promise<{ success: boolean; layer_name: string }> {
    return apiClient.post('/api/layer/clone', {
      project_name: projectName,
      layer_name: layerName,
      new_layer_name: newLayerName,
    });
  }

  /**
   * Export layer to various formats
   */
  async exportLayer(
    projectName: string,
    layerName: string,
    options?: ExportLayerOptions
  ): Promise<Blob> {
    const params = new URLSearchParams({
      project_name: projectName,
      layer_name: layerName,
      ...(options?.format && { format: options.format }),
      ...(options?.epsg && { epsg: options.epsg }),
      ...(options?.filter && { filter: options.filter }),
      ...(options?.selected_only && { selected_only: options.selected_only.toString() }),
    });

    const response = await fetch(
      `${apiClient.getBaseURL()}/layer/export?${params}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Token ${this.getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get layer features as GeoJSON
   */
  async getFeatures(
    projectName: string,
    layerName: string,
    options?: {
      bbox?: [number, number, number, number];
      filter?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<GeoJSON.FeatureCollection> {
    return apiClient.post('/api/layer/features', {
      project_name: projectName,
      layer_name: layerName,
      ...options,
    });
  }

  /**
   * Get feature coordinates
   */
  async getFeatureCoordinates(
    projectName: string,
    layerName: string,
    featureId: number
  ): Promise<{ coordinates: GeoJSON.Position[] }> {
    return apiClient.post('/api/layer/feature/coordinates', {
      project_name: projectName,
      layer_name: layerName,
      feature_id: featureId,
    });
  }

  /**
   * Get layer geometry type and bounds
   */
  async getGeometry(
    projectName: string,
    layerName: string
  ): Promise<{
    geometry_type: string;
    bounds: [number, number, number, number];
    feature_count: number;
  }> {
    return apiClient.post('/api/layer/geometry', {
      project_name: projectName,
      layer_name: layerName,
    });
  }

  /**
   * Check layer geometry validity
   */
  async checkGeometry(
    projectName: string,
    layerName: string
  ): Promise<{
    valid: boolean;
    invalid_count: number;
    issues: Array<{ feature_id: number; reason: string }>;
  }> {
    return apiClient.post('/api/layer/geometry/check', {
      project_name: projectName,
      layer_name: layerName,
    });
  }

  /**
   * Get layer validation details
   */
  async getValidationDetails(
    projectName: string,
    layerName: string
  ): Promise<{
    invalid_geometries: Array<{
      fid: number;
      error: string;
      geometry: GeoJSON.Geometry;
    }>;
  }> {
    return apiClient.post('/api/layer/validation/details', {
      project_name: projectName,
      layer_name: layerName,
    });
  }

  /**
   * Add label to layer
   */
  async addLabel(
    projectName: string,
    layerName: string,
    labelConfig: {
      field: string;
      size?: number;
      color?: string;
      font?: string;
    }
  ): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/label', {
      project_name: projectName,
      layer_name: layerName,
      ...labelConfig,
    });
  }

  /**
   * Remove label from layer
   */
  async removeLabel(projectName: string, layerName: string): Promise<{ success: boolean }> {
    return apiClient.post('/api/layer/label/remove', {
      project_name: projectName,
      layer_name: layerName,
    });
  }

  /**
   * Get column values (for filtering/classification)
   */
  async getColumnValues(
    projectName: string,
    layerName: string,
    columnName: string,
    options?: {
      unique?: boolean;
      limit?: number;
    }
  ): Promise<{ values: Array<string | number> }> {
    return apiClient.post('/api/layer/column/values', {
      project_name: projectName,
      layer_name: layerName,
      column_name: columnName,
      ...options,
    });
  }

  // Helper method to get auth token
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }
}

export const layersApi = new LayersService();
