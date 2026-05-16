import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
  };
}

// EVERY route in here requires a valid JWT — unauthenticated
// requests are automatically rejected with 401 Unauthorized
@Controller('rooms')
@UseGuards(AuthGuard('jwt'))
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    // POST /rooms — create a new room
    @Post()
    createRoom(@Body() dto: CreateRoomDto, @Request() req: AuthenticatedRequest ) {
        // req.user is set by JwtStrategy.validate() — contains { id, email }
        return this.roomsService.createRoom(dto, req.user.id);
    }

    // GET /rooms/my — rooms I created
    @Get('my')
    getMyRooms(@Request() req: AuthenticatedRequest ) {
        return this.roomsService.getMyRooms(req.user.id);
    }

    // GET /rooms/shared — rooms shared with me
    @Get('shared')
    getSharedRooms(@Request() req: AuthenticatedRequest ) {
        return this.roomsService.getSharedRooms(req.user.id);
    }

    // GET /rooms/:id — get one room (with access check)
    @Get(':id')
    getRoom(@Param('id') id: string, @Request() req: AuthenticatedRequest ) {
        return this.roomsService.getRoom(id, req.user.id);
    }

    // POST /rooms/join/:inviteToken — join via invite link
    @Post('join/:inviteToken')
    joinRoom(@Param('inviteToken') inviteToken: string, @Request() req: AuthenticatedRequest ) {
        return this.roomsService.joinRoom(inviteToken, req.user.id);
    }

    // PATCH /rooms/:id/regenerate-invite — invalidate old share link
    @Patch(':id/regenerate-invite')
    regenerateInvite(@Param('id') id: string, @Request() req: AuthenticatedRequest ) {
        return this.roomsService.regenerateInviteToken(id, req.user.id);
    }
}