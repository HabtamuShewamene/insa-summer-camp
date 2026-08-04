import { Module, OnModuleInit } from '@nestjs/common';
import { CommentsController, CommentActionsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { SocketServer } from '../socket/socket.server';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsController, CommentActionsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule implements OnModuleInit {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly socketServer: SocketServer,
  ) {}

  onModuleInit() {
    // Inject SocketServer into CommentsService after module initialization
    this.commentsService.setSocketServer(this.socketServer);
  }
}
