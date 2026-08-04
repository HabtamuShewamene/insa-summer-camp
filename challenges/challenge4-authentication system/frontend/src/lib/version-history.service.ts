'use client';

import { apiClient } from './api';

export interface VersionAuthor {
  id: string;
  name: string;
  email: string;
}

export interface DocumentVersionListItem {
  id: string;
  documentId: string;
  versionNumber: number;
  createdAt: string;
  changeDescription: string | null;
  isRestored: boolean;
  createdBy: VersionAuthor;
}

export interface DocumentVersionDetail extends DocumentVersionListItem {
  title: string;
  content: any;
}

export interface VersionRestoreResponse {
  message: string;
  version: DocumentVersionDetail;
  backupVersion: DocumentVersionListItem;
  restoredVersion: DocumentVersionListItem;
}

export const versionHistoryService = {
  async getVersions(documentId: string): Promise<DocumentVersionListItem[]> {
    const { data } = await apiClient.get<DocumentVersionListItem[]>(`/documents/${documentId}/versions`);
    return data;
  },

  async getVersion(documentId: string, versionId: string): Promise<DocumentVersionDetail> {
    const { data } = await apiClient.get<DocumentVersionDetail>(`/documents/${documentId}/versions/${versionId}`);
    return data;
  },

  async createVersion(documentId: string, changeDescription?: string): Promise<DocumentVersionListItem | null> {
    const { data } = await apiClient.post<DocumentVersionListItem | null>(`/documents/${documentId}/versions`, {
      changeDescription,
    });
    return data;
  },

  async restoreVersion(documentId: string, versionId: string): Promise<VersionRestoreResponse> {
    const { data } = await apiClient.post<VersionRestoreResponse>(`/documents/${documentId}/versions/${versionId}/restore`);
    return data;
  },
};