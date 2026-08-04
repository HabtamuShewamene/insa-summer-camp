import { apiClient } from './api';

export interface Document {
  id: string;
  title: string;
  ownerId: string;
  isDeleted: boolean;
  lastOpenedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string };
  content?: { id: string; content: any; createdAt: string; updatedAt: string };
}

export interface DocumentResponse {
  document: Document;
  message?: string;
}

export const documentService = {
  async createDocument(title: string): Promise<DocumentResponse> {
    const { data } = await apiClient.post<DocumentResponse>('/documents', { title });
    return data;
  },

  async getDocuments(): Promise<{ documents: Document[] }> {
    const { data } = await apiClient.get<{ documents: Document[] }>('/documents');
    return data;
  },

  async getRecentDocuments(): Promise<{ documents: Document[] }> {
    const { data } = await apiClient.get<{ documents: Document[] }>('/documents/recent');
    return data;
  },

  async getDocument(id: string): Promise<DocumentResponse> {
    const { data } = await apiClient.get<DocumentResponse>(`/documents/${id}`);
    return data;
  },

  async renameDocument(id: string, title: string): Promise<DocumentResponse> {
    const { data } = await apiClient.patch<DocumentResponse>(`/documents/${id}`, { title });
    return data;
  },

  async deleteDocument(id: string): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/documents/${id}`);
    return data;
  },

  async openDocument(id: string): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(`/documents/${id}/open`);
    return data;
  },

  async duplicateDocument(id: string): Promise<DocumentResponse> {
    const { data } = await apiClient.post<DocumentResponse>(`/documents/${id}/duplicate`);
    return data;
  },

  async updateContent(id: string, content: Record<string, any>): Promise<{ message: string }> {
    const { data } = await apiClient.patch<{ message: string }>(`/documents/${id}/content`, { content });
    return data;
  }
};
