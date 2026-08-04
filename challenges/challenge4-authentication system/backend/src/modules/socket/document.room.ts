import { Injectable, Logger } from '@nestjs/common';

export interface RoomUser {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
  socketId: string;
}

@Injectable()
export class DocumentRoomService {
  private readonly logger = new Logger(DocumentRoomService.name);
  // documentId -> Set of RoomUser
  private rooms: Map<string, Map<string, RoomUser>> = new Map();

  addUser(documentId: string, user: RoomUser): void {
    if (!this.rooms.has(documentId)) {
      this.rooms.set(documentId, new Map());
    }
    const room = this.rooms.get(documentId)!;
    room.set(user.socketId, user);
    this.logger.debug(`User ${user.name} joined room ${documentId}`);
  }

  removeUser(documentId: string, socketId: string): RoomUser | null {
    const room = this.rooms.get(documentId);
    if (room) {
      const user = room.get(socketId);
      if (user) {
        room.delete(socketId);
        this.logger.debug(`User ${user.name} left room ${documentId}`);
        if (room.size === 0) {
          this.rooms.delete(documentId);
        }
        return user;
      }
    }
    return null;
  }

  getUsersInRoom(documentId: string): RoomUser[] {
    const room = this.rooms.get(documentId);
    return room ? Array.from(room.values()) : [];
  }

  getUserRoom(socketId: string): string | null {
    for (const [documentId, room] of this.rooms.entries()) {
      if (room.has(socketId)) {
        return documentId;
      }
    }
    return null;
  }
}
