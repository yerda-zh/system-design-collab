import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Room } from './room.entity';

export type MemberRole = 'owner' | 'editor';

@Entity('room_members')
export class RoomMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.members)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column()
  roomId: string;

  @ManyToOne(() => User, (user) => user.roomMemberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ default: 'editor' })
  role: MemberRole;

  @CreateDateColumn()
  joinedAt: Date;
}