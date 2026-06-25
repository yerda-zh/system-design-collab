import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Room } from './room.entity';
import { RoomMember } from './room-member.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { sanitizeText } from '../common/utils/sanitize';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room)
        private roomsRepository: Repository<Room>,
        @InjectRepository(RoomMember)
        private roomMembersRepository: Repository<RoomMember>,
    ) {}

    async createRoom(dto: CreateRoomDto, userId: string) {
        // uuidv4() generates a random UUID string to use as the invite token
        const inviteToken = uuidv4();

        const room = this.roomsRepository.create({
            name: sanitizeText(dto.name),
            ownerId: userId,
            inviteToken,
        });
        
        await this.roomsRepository.save(room);

        // The owner is also added as a room_members row with role 'owner'
        // This way all access checks go through one table
        const member = this.roomMembersRepository.create({
            roomId: room.id,
            userId,
            role: 'owner'
        });

        await this.roomMembersRepository.save(member);
        return room;
    }

    async getMyRooms(userId: string) {
        // Returns rooms where this user is the owner
        return this.roomsRepository.find({
            where: { ownerId: userId},
            order: { createdAt: 'DESC'},
        });
    }

    async getSharedRooms(userId: string) {
        // Returns rooms where this user is a member with role 'editor'
        const memberships = await this.roomMembersRepository.find({
            where: { userId, role: 'editor' },
            relations: { room: true },  // use object syntax instead of array
        });

        // filter out any null rooms just in case, then map
        return memberships
            .filter((m) => m.room !== null)
            .map((m) => m.room);
    }
    
    async getRoom(roomId: string, userId: string) {
        // Access check: user must be in room_members for this room
        const member = await this.roomMembersRepository.findOne({
            where: { roomId, userId },
            relations: ['room'],
        });

        if (!member) {
            throw new ForbiddenException('You do not have access to this room');
        }

        return member.room;
    }

    async joinRoom(inviteToken: string, userId: string) {
        // Find the room by its invite token
        const room = await this.roomsRepository.findOne({
            where: { inviteToken },
        });

        if (!room) {
            // Generic error — don't reveal whether the token ever existed
            throw new NotFoundException('Invalid invite link');
        }

        // If they're already a member, just return success (idempotent)
        const existing = await this.roomMembersRepository.findOne({
            where: { roomId: room.id, userId},
        });

        if (existing) {
            return { message: 'Already a member', roomId: room.id};
        }

        const member = this.roomMembersRepository.create({
            roomId: room.id,
            userId,
            role: 'editor',
        });

        await this.roomMembersRepository.save(member);

        return { message: 'Joined successfully', roomId: room.id };
    }
    
    async regenerateInviteToken(roomId: string, userId: string) {
        const room = await this.roomsRepository.findOne({
            where: { id: roomId},
        });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        if (room.ownerId !== userId) {
            throw new ForbiddenException('Only the owner can regenerate the invite link');
        }

        room.inviteToken = uuidv4();
        await this.roomsRepository.save(room);

        return { inviteToken: room.inviteToken };
    }

    async getInviteToken(roomId: string, userId: string) {
        const room = await this.roomsRepository.findOne({ where: { id: roomId } });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        if (room.ownerId !== userId) {
            throw new ForbiddenException('Only the owner can access the invite link');
        }

        return { inviteToken: room.inviteToken, roomName: room.name };
    }

    async getInviteTokenPublic(roomId: string, userId: string) {
        const member = await this.roomMembersRepository.findOne({
            where: { roomId, userId },
            relations: ['room'],
        });

        if (!member) {
            throw new ForbiddenException('You do not have access to this room');
        }

        return { inviteToken: member.room.inviteToken, roomName: member.room.name };
    }

    async updateRoomName(roomId: string, userId: string, name: string) {
        const room = await this.roomsRepository.findOne({ where: { id: roomId } });

        if (!room) {
            throw new NotFoundException('Room not found');
        }

        if (room.ownerId !== userId) {
            throw new ForbiddenException('Only the owner can rename the room');
        }

        room.name = sanitizeText(name);
        await this.roomsRepository.save(room);
        return room;
    }
}