import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('snapshots')
export class Snapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomId: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', default: '[]' })
  nodes: object[];

  @Column({ type: 'jsonb', default: '[]' })
  edges: object[];

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;
}
