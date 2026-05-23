import type { Comment } from '@/types';
import { getComments, newId, setComments } from '@/services/mock/db';
import { postService } from '@/services/posts/postService';
import { scanContent, isPubliclyVisible } from '@/services/moderation/contentScan';

export interface CommentNode extends Comment {
  children: CommentNode[];
}

function buildTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else if (!node.parentId) {
      roots.push(node);
    }
  });
  const sortRec = (nodes: CommentNode[]) => {
    nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export const commentService = {
  listByPost(postId: string, opts?: { includeNonPublic?: boolean }): CommentNode[] {
    const list = getComments().filter(
      (c) =>
        c.postId === postId &&
        (opts?.includeNonPublic || isPubliclyVisible(c.moderationStatus)),
    );
    return buildTree(list);
  },

  add(
    postId: string,
    body: string,
    parentId: string | null,
    author: { id: string; displayName: string; role: Comment['authorRole'] },
  ): Comment {
    const text = body.trim();
    const scan = scanContent(text);
    const comment: Comment = {
      id: newId('c'),
      postId,
      parentId,
      body: text,
      authorId: author.id,
      authorName: author.displayName,
      authorRole: author.role,
      createdAt: new Date().toISOString(),
      voteScore: 0,
      moderationStatus: scan.status,
      moderationFlags: scan.matchedWords.length ? scan.matchedWords : undefined,
    };
    setComments([...getComments(), comment]);
    if (!parentId) postService.recountAnswers(postId);
    return comment;
  },
};
