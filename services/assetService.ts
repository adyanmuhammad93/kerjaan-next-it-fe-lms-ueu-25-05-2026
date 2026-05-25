import { apiClient, BASE_URL } from './apiClient';
import { Asset, AssetFolder } from '../types';

const mapFolder = (f: any): AssetFolder => ({
  id: f.id,
  name: f.name,
  parentId: f.parent_id,
  createdBy: f.created_by,
  visibility: f.visibility,
  createdAt: f.created_at,
});

const BACKEND_URL = BASE_URL.replace(/\/api$/, '');

const getFullUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const mapAsset = (a: any): Asset => ({
  id: a.id,
  folderId: a.folder_id,
  name: a.name,
  fileUrl: getFullUrl(a.file_url),
  fileType: a.file_type,
  fileSize: a.file_size,
  createdBy: a.created_by,
  visibility: a.visibility,
  createdAt: a.created_at,
});

export const assetService = {
  // ─── Folders ──────────────────────────────────────────────────────────────
  async getFolders(parentId: string | null = null): Promise<AssetFolder[]> {
    const params = parentId ? `?parentId=${parentId}` : '';
    const data = await apiClient.get<{ folders: any[] }>(`/assets/folders${params}`);
    return (data.folders || []).map(mapFolder);
  },

  async createFolder(name: string, parentId: string | null = null): Promise<AssetFolder> {
    const data = await apiClient.post<{ folder: any }>('/assets/folders', { name, parentId });
    return mapFolder(data.folder);
  },

  async renameFolder(id: string, name: string): Promise<AssetFolder> {
    const data = await apiClient.patch<{ folder: any }>(`/assets/folders/${id}`, { name });
    return mapFolder(data.folder);
  },

  async deleteFolder(id: string): Promise<void> {
    await apiClient.delete(`/assets/folders/${id}`);
  },

  // ─── Assets ───────────────────────────────────────────────────────────────
  async getAssets(folderId: string | null = null): Promise<Asset[]> {
    const params = folderId ? `?folderId=${folderId}` : '';
    const data = await apiClient.get<{ assets: any[] }>(`/assets${params}`);
    return (data.assets || []).map(mapAsset);
  },

  async uploadAsset(file: File, folderId: string | null = null): Promise<Asset> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    const data = await apiClient.upload<{ asset: any }>('/assets/upload', formData);
    return mapAsset(data.asset);
  },

  async renameAsset(id: string, name: string): Promise<Asset> {
    const data = await apiClient.patch<{ asset: any }>(`/assets/${id}`, { name });
    return mapAsset(data.asset);
  },

  async deleteAsset(asset: Asset): Promise<void> {
    await apiClient.delete(`/assets/${asset.id}`);
  },

  // ─── Sharing & Permissions ────────────────────────────────────────────────
  async updateVisibility(id: string, type: 'asset' | 'folder', visibility: 'public' | 'private'): Promise<void> {
    await apiClient.patch(`/assets/${id}/visibility`, { type, visibility });
  },

  async getShares(id: string, type: 'asset' | 'folder'): Promise<any[]> {
    const data = await apiClient.get<{ shares: any[] }>(`/assets/${id}/shares?type=${type}`);
    return data.shares.map(s => ({
      id: s.id,
      assetId: s.asset_id,
      folderId: s.folder_id,
      sharedWithUserId: s.shared_with_user_id,
      sharedByUserId: s.shared_by_user_id,
      permissions: typeof s.permissions === 'string' ? JSON.parse(s.permissions) : s.permissions,
      expiresAt: s.expires_at,
      createdAt: s.created_at,
      sharedWithEmail: s.shared_with_email,
      sharedWithName: s.shared_with_name,
    }));
  },

  async addShare(payload: { assetId?: string, folderId?: string, sharedWithUserId: string, permissions: string[], expiresAt?: string | null }): Promise<any> {
    const data = await apiClient.post<{ share: any }>('/assets/shares', payload);
    return data.share;
  },

  async removeShare(shareId: string): Promise<void> {
    await apiClient.delete(`/assets/shares/${shareId}`);
  },

  // ─── Admin Methods ────────────────────────────────────────────────────────
  async getAllSharesForAdmin(): Promise<any[]> {
    const data = await apiClient.get<{ shares: any[] }>('/assets/admin/shares');
    return data.shares;
  },

  async getAllActivityLogsForAdmin(): Promise<any[]> {
    const data = await apiClient.get<{ logs: any[] }>('/assets/admin/logs');
    return data.logs;
  },
};
