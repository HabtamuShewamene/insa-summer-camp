import { Injectable, Logger } from '@nestjs/common';
import * as Y from 'yjs';
import { prosemirrorJSONToYDoc } from 'y-prosemirror';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private documents: Map<string, Y.Doc> = new Map();

  getDoc(documentId: string): Y.Doc {
    if (!this.documents.has(documentId)) {
      this.logger.log(`Initializing new Y.Doc for document: ${documentId}`);
      this.documents.set(documentId, new Y.Doc());
    }
    return this.documents.get(documentId)!;
  }

  applyUpdate(documentId: string, update: Uint8Array): void {
    const doc = this.getDoc(documentId);
    Y.applyUpdate(doc, update);
  }

  replaceDocument(documentId: string, content: any): void {
    if (this.documents.has(documentId)) {
      this.documents.get(documentId)?.destroy();
    }

    const restoredDoc = prosemirrorJSONToYDoc(content ?? { ops: [{ insert: '\n' }] });
    this.documents.set(documentId, restoredDoc);
  }

  getStateVector(documentId: string): Uint8Array {
    const doc = this.getDoc(documentId);
    return Y.encodeStateVector(doc);
  }

  getUpdate(documentId: string, stateVector?: Uint8Array): Uint8Array {
    const doc = this.getDoc(documentId);
    return Y.encodeStateAsUpdate(doc, stateVector);
  }

  removeDocIfEmpty(documentId: string, activeUsersCount: number): void {
    if (activeUsersCount === 0 && this.documents.has(documentId)) {
      this.logger.log(`Cleaning up empty Y.Doc for document: ${documentId}`);
      this.documents.get(documentId)?.destroy();
      this.documents.delete(documentId);
    }
  }
}
