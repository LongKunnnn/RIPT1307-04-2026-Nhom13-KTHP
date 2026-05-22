import type { RewardItem, UserVoucher } from '@/types';
import { apiFetch } from '@/services/api/client';

export const rewardsService = {
  async getCatalog(): Promise<RewardItem[]> {
    return apiFetch<RewardItem[]>('/api/rewards/catalog');
  },

  async getWallet(): Promise<{ rewardPoints: number }> {
    return apiFetch<{ rewardPoints: number }>('/api/rewards/wallet');
  },

  async redeem(itemId: string): Promise<{ rewardPoints: number; item: { id: string; title: string } }> {
    return apiFetch('/api/rewards/redeem', {
      method: 'POST',
      body: JSON.stringify({ itemId: Number(itemId) }),
    });
  },

  async getMyVouchers(): Promise<UserVoucher[]> {
    return apiFetch<UserVoucher[]>('/api/rewards/my-vouchers');
  },
};
