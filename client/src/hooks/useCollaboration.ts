import { useEffect, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { socketService, WS_EVENTS } from '../services/socketService';
import { useCanvasStore } from '../store/canvasStore';
import { useCollaborationStore } from '../store/collaborationStore';
import { useAuthStore } from '../store/authStore';
import type { CanvasOperation } from '../types/operations';
import type { NodeData } from '../types';
import type {
  CursorPosition,
  RoomStatePayload,
  OperationAckPayload,
} from '../types/events';
import { useNavigate } from 'react-router-dom';
import { useWarningStore } from '../store/warningStore';
import type { Warning } from '../types/warnings';

export function useCollaboration(roomId: string) {
  const { user, logout } = useAuthStore();
  const { setNodes, setEdges, setRevision, addNode } = useCanvasStore();
  const {
    setActiveUsers,
    addActiveUser,
    removeActiveUser,
    updateCursor,
    removeCursor,
    setConnected,
    setJoined,
  } = useCollaborationStore();

  // Track server revision separately from canvas store
  // to avoid stale closure issues in callbacks
  const serverRevision = useRef(0);

  const emitOperation = useCallback(
    (operation: Omit<CanvasOperation, 'roomId' | 'userId' | 'clientRevision'>) => {
      if (!user) return;

      const fullOperation: CanvasOperation = {
        ...operation,
        roomId,
        userId: user.id,
        clientRevision: serverRevision.current,
      } as CanvasOperation;

      socketService.emit(WS_EVENTS.CANVAS_OPERATION, fullOperation);
    },
    [roomId, user],
  );

  const emitCursor = useCallback(
    (x: number, y: number) => {
      socketService.emit(WS_EVENTS.CURSOR_MOVE, { x, y });
    },
    [],
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !roomId) return;

    socketService.onAuthError(() => {
      logout();
      navigate('/login');
    });

    // Connect and join the room
    socketService.connect();
    setConnected(true);

    // Handler: server sends full canvas state when we join
    const onRoomState = (payload: RoomStatePayload) => {
      setNodes(payload.nodes as Node<NodeData>[]);
      setEdges(payload.edges.map((e) => ({ ...e, type: 'custom' })) as Edge[]);
      setRevision(payload.revision);
      serverRevision.current = payload.revision;
      setActiveUsers(payload.activeUsers);
      setJoined(true);
    };

     const onWarningUpdate = (data: { warnings: Warning[] }) => {
        useWarningStore.getState().setWarnings(data.warnings);
      };

      socketService.on(
        WS_EVENTS.WARNING_UPDATE,
        onWarningUpdate as (...args: unknown[]) => void,
      );

    // Handler: server broadcasts an operation from another user
    const onOperationBroadcast = (
      operation: CanvasOperation & { serverRevision: number },
    ) => {
      serverRevision.current = operation.serverRevision;
      setRevision(operation.serverRevision);

      // Set flag so Canvas knows not to re-emit these changes
      useCanvasStore.getState().setApplyingRemote(true);

      // Apply the operation to local state
      switch (operation.type) {
        case 'addNode':
          addNode(operation.node as Node<NodeData>);
          break;

        case 'deleteNode':
          useCanvasStore.getState().removeNode(operation.nodeId);
          break;

        case 'moveNode':
          setNodes(
            useCanvasStore.getState().nodes.map((n) =>
              n.id === operation.nodeId
                ? { ...n, position: { x: operation.x, y: operation.y } }
                : n,
            ),
          );
          break;

        case 'updateNode':
          setNodes(
            useCanvasStore.getState().nodes.map((n) =>
              n.id === operation.nodeId
                ? { ...n, data: { ...n.data, label: operation.label } }
                : n,
            ),
          );
          break;

        case 'addEdge':
          setEdges([
            ...useCanvasStore.getState().edges,
            { ...operation.edge, type: 'custom' } as Edge,
          ]);
          break;

        case 'deleteEdge':
          useCanvasStore.getState().removeEdge(operation.edgeId);
          break;
      }

      // Clear flag after React has processed the state update
      setTimeout(() => {
        useCanvasStore.getState().setApplyingRemote(false);
      }, 0);
    };

    // Handler: another user restored a snapshot — replace full canvas state
    const onCanvasRestored = (payload: { nodes: object[]; edges: object[]; revision: number }) => {
      setNodes(payload.nodes as Node<NodeData>[]);
      setEdges(payload.edges.map((e) => ({ ...e, type: 'custom' })) as Edge[]);
      setRevision(payload.revision);
      serverRevision.current = payload.revision;
      useCanvasStore.getState().markSaved();
    };

    // Handler: server acknowledges our operation
    const onOperationAck = (payload: OperationAckPayload) => {
      if (payload.success) {
        serverRevision.current = payload.serverRevision;
        setRevision(payload.serverRevision);
      } else {
        console.error('Operation rejected:', payload.error);
      }
    };

    // Handler: another user's cursor moved
    const onCursorBroadcast = (cursor: CursorPosition) => {
      updateCursor(cursor);
    };

    // Handler: a new user joined the room
    const onUserJoined = (data: { userId: string; displayName: string }) => {
      addActiveUser(data);
    };

    // Handler: a user left the room
    const onUserLeft = (data: { userId: string; displayName: string }) => {
      removeActiveUser(data.userId);
      removeCursor(data.userId);
    };

    const onError = (data: { message: string }) => {
      if (data.message === 'unauthorized') {
        useAuthStore.getState().logout();
      }
    };

    // Register all event handlers
    socketService.on(WS_EVENTS.ROOM_STATE, onRoomState as (...args: unknown[]) => void);
    socketService.on(WS_EVENTS.CANVAS_RESTORED, onCanvasRestored as (...args: unknown[]) => void);
    socketService.on(WS_EVENTS.OPERATION_BROADCAST, onOperationBroadcast as (...args: unknown[]) => void);
    socketService.on(WS_EVENTS.OPERATION_ACK, onOperationAck as (...args: unknown[]) => void);
    socketService.on(WS_EVENTS.CURSOR_BROADCAST, onCursorBroadcast as (...args: unknown[]) => void);
    socketService.on(WS_EVENTS.USER_JOINED, onUserJoined as (...args: unknown[]) => void);
    socketService.on(WS_EVENTS.USER_LEFT, onUserLeft as (...args: unknown[]) => void);
    socketService.on(WS_EVENTS.ERROR, onError as (...args: unknown[]) => void);

    // Join the room
    socketService.emit(WS_EVENTS.JOIN_ROOM, {
      roomId,
      displayName: user.displayName,
    });

    // Cleanup on unmount
    return () => {
      socketService.off(WS_EVENTS.ROOM_STATE, onRoomState as (...args: unknown[]) => void);
      socketService.off(WS_EVENTS.CANVAS_RESTORED, onCanvasRestored as (...args: unknown[]) => void);
      socketService.off(WS_EVENTS.OPERATION_BROADCAST, onOperationBroadcast as (...args: unknown[]) => void);
      socketService.off(WS_EVENTS.OPERATION_ACK, onOperationAck as (...args: unknown[]) => void);
      socketService.off(WS_EVENTS.CURSOR_BROADCAST, onCursorBroadcast as (...args: unknown[]) => void);
      socketService.off(WS_EVENTS.USER_JOINED, onUserJoined as (...args: unknown[]) => void);
      socketService.off(WS_EVENTS.USER_LEFT, onUserLeft as (...args: unknown[]) => void);
      socketService.off(WS_EVENTS.ERROR, onError as (...args: unknown[]) => void);
      socketService.off(WS_EVENTS.WARNING_UPDATE, onWarningUpdate as (...args: unknown[]) => void);
      socketService.disconnect();

      useWarningStore.getState().setWarnings([]);

      // Clear all cursors and active users when leaving the room
      useCollaborationStore.getState().setActiveUsers([]);
      const { cursors } = useCollaborationStore.getState();
      cursors.forEach((_, userId) => {
        useCollaborationStore.getState().removeCursor(userId);
      });

      setConnected(false);
      setJoined(false);
    };
  }, [roomId, user, setNodes, setEdges, 
    setRevision, addNode, setActiveUsers, 
    addActiveUser, removeActiveUser, updateCursor, 
    removeCursor, setConnected, setJoined, logout, navigate]);

  return { emitOperation, emitCursor };
}