import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { RoomMember } from './room-member.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // The invite token is a separate UUID used only for sharing
  @Column({ unique: true })
  inviteToken: string;

  // ManyToOne: many rooms can have the same owner
  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  // We store ownerId directly so we can query without joining the users table
  @Column()
  ownerId: string;

  @OneToMany(() => RoomMember, (member) => member.room)
  members: RoomMember[];

  @CreateDateColumn()
  createdAt: Date;
}