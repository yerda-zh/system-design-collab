import { NodeType } from './index';

declare global {
  interface Window {
    __addNode?: (nodeType: NodeType) => void;
  }
}