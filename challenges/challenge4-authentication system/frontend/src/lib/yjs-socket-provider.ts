import * as Y from 'yjs';
import { Socket } from 'socket.io-client';
import { Awareness } from 'y-protocols/awareness';

export class SocketIOProvider {
  public awareness: Awareness;
  private doc: Y.Doc;
  private socket: Socket;
  private documentId: string;
  public isSynced: boolean = false;
  
  constructor(socket: Socket, documentId: string, doc: Y.Doc, userOptions: { name: string, color: string }) {
    this.socket = socket;
    this.documentId = documentId;
    this.doc = doc;
    this.awareness = new Awareness(this.doc);

    // Set local awareness state
    this.awareness.setLocalStateField('user', {
      name: userOptions.name,
      color: userOptions.color,
    });

    // Join room
    this.socket.emit('join-document', { documentId, color: userOptions.color });

    // YJS updates
    this.doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== this) {
        this.socket.emit('document-update', { documentId, update: Array.from(update) });
      }
    });

    this.socket.on('document-update', (updateArray: number[]) => {
      const update = new Uint8Array(updateArray);
      Y.applyUpdate(this.doc, update, this);
    });

    // Sync
    this.socket.on('sync-step-1', (stateVectorArray: number[]) => {
      const stateVector = new Uint8Array(stateVectorArray);
      const update = Y.encodeStateAsUpdate(this.doc, stateVector);
      this.socket.emit('sync-step-2', { documentId, update: Array.from(update) });
      this.isSynced = true;
    });

    // Awareness updates
    this.awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
      if (origin === 'local') {
        const changedClients = added.concat(updated).concat(removed);
        const update = import('y-protocols/awareness').then(({ encodeAwarenessUpdate }) => {
          const encoded = encodeAwarenessUpdate(this.awareness, changedClients);
          this.socket.emit('awareness-update', { documentId, update: Array.from(encoded) });
        });
      }
    });

    this.socket.on('awareness-update', async (updateArray: number[]) => {
      const { applyAwarenessUpdate } = await import('y-protocols/awareness');
      const update = new Uint8Array(updateArray);
      applyAwarenessUpdate(this.awareness, update, 'remote');
    });

    this.socket.on('room-users', (users: any[]) => {
      window.dispatchEvent(new CustomEvent('room-users', { detail: users }));
    });

    this.socket.on('comment-created', (comment: any) => {
      window.dispatchEvent(new CustomEvent('comment-created', { detail: comment }));
      window.dispatchEvent(
        new CustomEvent('comment-notification', {
          detail: {
            type: 'comment-created',
            message: 'Someone commented on your document.',
            comment,
          },
        }),
      );
    });

    this.socket.on('reply-added', (reply: any) => {
      window.dispatchEvent(new CustomEvent('comment-replied', { detail: reply }));
    });

    this.socket.on('comment-resolved', (comment: any) => {
      window.dispatchEvent(new CustomEvent('comment-resolved', { detail: comment }));
    });

    this.socket.on('comment-reopened', (comment: any) => {
      window.dispatchEvent(new CustomEvent('comment-reopened', { detail: comment }));
    });

    this.socket.on('comment-deleted', (payload: { commentId: string }) => {
      window.dispatchEvent(new CustomEvent('comment-deleted', { detail: payload }));
    });

    this.socket.on('reply-deleted', (payload: { replyId: string; commentId: string }) => {
      window.dispatchEvent(new CustomEvent('comment-reply-deleted', { detail: payload }));
    });
  }

  destroy() {
    this.socket.emit('leave-document', { documentId: this.documentId });
    this.socket.off('document-update');
    this.socket.off('sync-step-1');
    this.socket.off('awareness-update');
    this.socket.off('room-users');
    this.socket.off('comment-created');
    this.socket.off('reply-added');
    this.socket.off('comment-resolved');
    this.socket.off('comment-reopened');
    this.socket.off('comment-deleted');
    this.socket.off('reply-deleted');
    this.awareness.destroy();
  }
}
