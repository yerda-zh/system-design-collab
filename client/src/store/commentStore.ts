import { create } from 'zustand';
import type { Comment } from '../types';

interface CommentState {
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  addComment: (comment: Comment) => void;
  removeComment: (commentId: string) => void;
}

export const useCommentStore = create<CommentState>((set) => ({
  comments: [],
  setComments: (comments) => set({ comments }),
  addComment: (comment) =>
    set((state) => {
      if (state.comments.some((c) => c.id === comment.id)) return state;
      return { comments: [...state.comments, comment] };
    }),
  removeComment: (commentId) =>
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== commentId),
    })),
}));
