import { getFollows, setFollows } from '@/services/mock/db';

export interface PostFollow {
  userId: string;
  postId: string;
  createdAt: string;
}

export const followService = {
  isFollowing(userId: string, postId: string): boolean {
    return getFollows().some((f) => f.userId === userId && f.postId === postId);
  },

  toggle(userId: string, postId: string): boolean {
    const list = getFollows();
    const idx = list.findIndex((f) => f.userId === userId && f.postId === postId);
    if (idx >= 0) {
      list.splice(idx, 1);
      setFollows(list);
      return false;
    }
    list.push({ userId, postId, createdAt: new Date().toISOString() });
    setFollows(list);
    return true;
  },

  getFollowedPostIds(userId: string): string[] {
    return getFollows()
      .filter((f) => f.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((f) => f.postId);
  },

  countFollowed(userId: string): number {
    return followService.getFollowedPostIds(userId).length;
  },
};
