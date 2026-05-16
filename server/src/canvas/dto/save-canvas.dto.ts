import { IsArray } from 'class-validator';

export class SaveCanvasDto {
  @IsArray()
  nodes: object[];

  @IsArray()
  edges: object[];
}