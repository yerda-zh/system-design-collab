import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('canvas_states')
export class CanvasState {
  // roomId is both the primary key and the foreign key
  // One room has exactly one canvas state
  @PrimaryColumn()
  roomId: string;

  // We store all nodes as a JSON array
  @Column({ type: 'jsonb', default: '[]' })
  nodes: object[];

  // We store all edges as a JSON array
  @Column({ type: 'jsonb', default: '[]' })
  edges: object[];

  // revision tracks how many times the canvas has been saved for conflict resolution
  @Column({ default: 0 })
  revision: number;

  @UpdateDateColumn()
  updatedAt: Date;
}