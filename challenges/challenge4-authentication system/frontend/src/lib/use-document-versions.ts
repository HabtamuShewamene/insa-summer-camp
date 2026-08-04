'use client';

import { useCallback, useEffect, useState } from 'react';
import { DocumentVersionDetail, DocumentVersionListItem, versionHistoryService } from './version-history.service';

export function useDocumentVersions(documentId: string) {
  const [versions, setVersions] = useState<DocumentVersionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersionDetail | null>(null);

  const refreshVersions = useCallback(async () => {
    if (!documentId) {
      setVersions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await versionHistoryService.getVersions(documentId);
      setVersions(data);
      if (previewVersion && !data.some((version) => version.id === previewVersion.id)) {
        setPreviewVersion(null);
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Failed to load versions');
    } finally {
      setIsLoading(false);
    }
  }, [documentId, previewVersion]);

  useEffect(() => {
    void refreshVersions();
  }, [refreshVersions]);

  useEffect(() => {
    const handleRefresh = () => {
      void refreshVersions();
    };

    const handleDocumentRestored = () => {
      void refreshVersions();
    };

    window.addEventListener('version-created', handleRefresh);
    window.addEventListener('version-restored', handleRefresh);
    window.addEventListener('document-restored', handleDocumentRestored);

    return () => {
      window.removeEventListener('version-created', handleRefresh);
      window.removeEventListener('version-restored', handleRefresh);
      window.removeEventListener('document-restored', handleDocumentRestored);
    };
  }, [refreshVersions]);

  const previewVersionById = useCallback(
    async (versionId: string) => {
      try {
        const detail = await versionHistoryService.getVersion(documentId, versionId);
        setPreviewVersion(detail);
      } catch (requestError: any) {
        setError(requestError?.response?.data?.message || requestError?.message || 'Failed to load version');
      }
    },
    [documentId],
  );

  const createVersion = useCallback(
    async (changeDescription?: string) => {
      const created = await versionHistoryService.createVersion(documentId, changeDescription);
      if (created) {
        await refreshVersions();
      }
      return created;
    },
    [documentId, refreshVersions],
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      const result = await versionHistoryService.restoreVersion(documentId, versionId);
      await refreshVersions();
      return result;
    },
    [documentId, refreshVersions],
  );

  return {
    versions,
    previewVersion,
    isLoading,
    error,
    refreshVersions,
    previewVersionById,
    setPreviewVersion,
    createVersion,
    restoreVersion,
  };
}