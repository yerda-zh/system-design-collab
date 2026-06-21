import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roomId: string;

  @Column()
  targetId: string;

  @Column()
  targetType: string;

  @Column()
  body: string;

  @Column()
  authorId: string;

  @Column()
  authorName: string;

  @Column({ nullable: true, type: 'varchar' })
  parentId: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
