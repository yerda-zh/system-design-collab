import { useState, useEffect } from 'react';
import { X, CornerDownRight, Trash2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useCommentStore } from '../../store/commentStore';
import { useAuthStore } from '../../store/authStore';
import { createComment, deleteComment } from '../../api/comments';
import type { Comment } from '../../types';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function EmptyComments() {
  return (
    <div style={emptyStyles.container}>
      <svg width="40" height="36" viewBox="0 0 40 36" fill="none">
        <rect x="1" y="1" width="38" height="28" rx="6" stroke="#d1d5db" strokeWidth="2" />
        <polygon points="10,29 18,29 14,35" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <p style={emptyStyles.title}>No comments yet</p>
      <p style={emptyStyles.subtitle}>Be the first to add a comment below</p>
    </div>
  );
}

const emptyStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '2rem 1rem',
  },
  title: { color: '#6b7280', fontSize: '0.875rem' },
  subtitle: { color: '#9ca3af', fontSize: '0.78rem', textAlign: 'center' },
};

interface CommentPanelProps {
  targetId: string;
  targetType: 'node' | 'edge';
  roomId: string;
  onClose: () => void;
}

export default function CommentPanel({
  targetId,
  targetType,
  roomId,
  onClose,
}: CommentPanelProps) {
  const { user } = useAuthStore();
  const comments = useCommentStore(
    useShallow((state) =>
      state.comments.filter((c) => c.targetId === targetId),
    ),
  );

  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
  const [isReplySubmitHovered, setIsReplySubmitHovered] = useState(false);
  const [hoveredReplyId, setHoveredReplyId] = useState<string | null>(null);
  const [hoveredDeleteId, setHoveredDeleteId] = useState<string | null>(null);
  const [hoveredCancelId, setHoveredCancelId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const topLevel = comments.filter((c) => c.parentId === null);

  const getReplies = (parentId: string): Comment[] =>
    comments.filter((c) => c.parentId === parentId);

  const handleSubmit = async () => {
    const body = newBody.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    try {
      await createComment(roomId, { targetId, targetType, body, parentId: null });
      setNewBody('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    const body = replyBody.trim();
    if (!body || replySubmitting) return;
    setReplySubmitting(true);
    try {
      await createComment(roomId, { targetId, targetType, body, parentId });
      setReplyBody('');
      setReplyingTo(null);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.headerInner}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span style={styles.title}>Comments</span>
          </div>
          <button
            style={{ ...styles.closeBtn, color: isCloseHovered ? '#374151' : '#9ca3af', backgroundColor: isCloseHovered ? '#f3f4f6' : 'transparent' }}
            onClick={onClose}
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div style={styles.list}>
          {topLevel.length === 0 ? (
            <EmptyComments />
          ) : (
            topLevel.map((comment) => (
              <div key={comment.id} style={styles.commentBlock}>
                <div style={styles.commentCard}>
                  <div style={styles.commentMeta}>
                    <span style={styles.authorName}>{comment.authorName}</span>
                    <span style={styles.time}>{relativeTime(comment.createdAt)}</span>
                  </div>
                  <p style={styles.body}>{comment.body}</p>
                  <div style={styles.commentActions}>
                    <button
                      style={{
                        ...styles.replyBtn,
                        ...(hoveredReplyId === comment.id ? { color: '#5B21B6' } : {}),
                      }}
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyBody('');
                      }}
                      onMouseEnter={() => setHoveredReplyId(comment.id)}
                      onMouseLeave={() => setHoveredReplyId(null)}
                    >
                      <CornerDownRight size={13} /> Reply
                    </button>
                    {user && comment.authorId === user.id && (
                      <button
                        style={{
                          ...styles.deleteBtn,
                          ...(hoveredDeleteId === comment.id ? { color: '#b91c1c', backgroundColor: '#fef2f2' } : {}),
                        }}
                        onClick={() => handleDelete(comment.id)}
                        onMouseEnter={() => setHoveredDeleteId(comment.id)}
                        onMouseLeave={() => setHoveredDeleteId(null)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {getReplies(comment.id).map((reply) => (
                  <div key={reply.id} style={styles.replyCard}>
                    <div style={styles.commentMeta}>
                      <span style={styles.authorName}>{reply.authorName}</span>
                      <span style={styles.time}>{relativeTime(reply.createdAt)}</span>
                    </div>
                    <p style={styles.body}>{reply.body}</p>
                    {user && reply.authorId === user.id && (
                      <button
                        style={{
                          ...styles.deleteBtn,
                          ...(hoveredDeleteId === reply.id ? { color: '#b91c1c', backgroundColor: '#fef2f2' } : {}),
                        }}
                        onClick={() => handleDelete(reply.id)}
                        onMouseEnter={() => setHoveredDeleteId(reply.id)}
                        onMouseLeave={() => setHoveredDeleteId(null)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}

                {replyingTo === comment.id && (
                  <div style={styles.replyInput}>
                    <textarea
                      style={styles.textarea}
                      placeholder="Write a reply..."
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={2}
                    />
                    <div style={styles.replyActions}>
                      <button
                        style={{
                          ...styles.cancelBtn,
                          ...(hoveredCancelId === comment.id ? { backgroundColor: '#f9fafb', border: '1px solid #d1d5db' } : {}),
                        }}
                        onClick={() => { setReplyingTo(null); setReplyBody(''); }}
                        onMouseEnter={() => setHoveredCancelId(comment.id)}
                        onMouseLeave={() => setHoveredCancelId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        style={{
                          ...styles.submitBtn,
                          opacity: replySubmitting ? 0.6 : 1,
                          ...(isReplySubmitHovered && !replySubmitting
                            ? { background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)' }
                            : {}),
                        }}
                        onClick={() => handleReply(comment.id)}
                        disabled={replySubmitting}
                        onMouseEnter={() => setIsReplySubmitHovered(true)}
                        onMouseLeave={() => setIsReplySubmitHovered(false)}
                      >
                        {replySubmitting ? 'Sending...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={styles.inputArea}>
          <textarea
            style={styles.textarea}
            placeholder="Add a comment..."
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={3}
          />
          <button
            style={{
              ...styles.submitBtn,
              opacity: submitting ? 0.6 : 1,
              ...(isSubmitHovered && !submitting
                ? { background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)' }
                : {}),
            }}
            onClick={handleSubmit}
            disabled={submitting}
            onMouseEnter={() => setIsSubmitHovered(true)}
            onMouseLeave={() => setIsSubmitHovered(false)}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1100,
    pointerEvents: 'none',
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '340px',
    backgroundColor: 'white',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'all',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1rem',
    borderBottom: '1px solid #F3F4F6',
    flexShrink: 0,
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    fontWeight: 600,
    fontSize: '0.9375rem',
    color: '#111827',
    letterSpacing: '-0.01em',
  },
  closeBtn: {
    background: 'none',
    border: '1px solid transparent',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '0.25rem',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s, background-color 0.15s',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  commentBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  commentCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
    backgroundColor: '#fafafa',
  },
  replyCard: {
    marginLeft: '1rem',
    borderLeft: '2px solid #EDE9FE',
    paddingLeft: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  commentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  authorName: {
    fontWeight: 600,
    fontSize: '0.8rem',
    color: '#111827',
  },
  time: {
    fontSize: '0.72rem',
    color: '#9ca3af',
  },
  body: {
    fontSize: '0.875rem',
    color: '#374151',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.55,
  },
  commentActions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '0.125rem',
  },
  replyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: '#7C3AED',
    padding: 0,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: '#dc2626',
    padding: '2px 4px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  replyInput: {
    marginLeft: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  replyActions: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '0.375rem 0.75rem',
    background: 'white',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
    outline: 'none',
  },
  inputArea: {
    padding: '0.75rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flexShrink: 0,
    backgroundColor: '#fafafa',
  },
  textarea: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '0.875rem',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
    outline: 'none',
    backgroundColor: 'white',
    color: '#111827',
    transition: 'border-color 0.15s',
  },
  submitBtn: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 600,
    alignSelf: 'flex-end',
    transition: 'background 0.15s ease',
  },
};
