import { apiClient } from './api';

export type PermissionLevel = 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER';

export interface DocumentPermissionItem {
  id: string;
  documentId: string;
  userId: string;
  permission: PermissionLevel;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const sharingService = {
  async shareDocument(documentId: string, email: string, permission: PermissionLevel) {
    const { data } = await apiClient.post<DocumentPermissionItem>(`/documents/${documentId}/share`, {
      email,
      permission,
    });
    return data;
  },

  async getPermissions(documentId: string) {
    const { data } = await apiClient.get<DocumentPermissionItem[]>(`/documents/${documentId}/permissions`);
    return data;
  },

  async updatePermission(documentId: string, permissionId: string, permission: PermissionLevel) {
    const { data } = await apiClient.patch<DocumentPermissionItem>(
      `/documents/${documentId}/permissions/${permissionId}`,
      { permission }
    );
    return data;
  },

  async removePermission(documentId: string, permissionId: string) {
    const { data } = await apiClient.delete<{ message: string }>(
      `/documents/${documentId}/permissions/${permissionId}`
    );
    return data;
  },
};
