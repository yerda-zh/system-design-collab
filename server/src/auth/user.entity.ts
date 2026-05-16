import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';

import { RoomMember } from '../rooms/room-member.entity';

@Entity('users')
export class User {
  // UUID is a random unique string like "a3f9c2d1-..."
  // Better than sequential integers because they don't expose how many
  // users you have and are safe to expose in URLs
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  displayName: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => RoomMember, (member) => member.user)
  roomMemberships: RoomMember[];
}
