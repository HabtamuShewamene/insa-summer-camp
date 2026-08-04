export interface VersionAuthor {
  id: string;
  name: string;
  email: string;
}

export interface DocumentVersionListItem {
  id: string;
  documentId: string;
  versionNumber: number;
  createdAt: Date;
  changeDescription: string | null;
  isRestored: boolean;
  createdBy: VersionAuthor;
}

export interface DocumentVersionDetail extends DocumentVersionListItem {
  title: string;
  content: any;
}

export interface DocumentVersionSnapshot {
  title: string;
  content: any;
}