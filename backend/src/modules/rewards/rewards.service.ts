import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUserPayload } from '../../common/utils/helpers';

@Injectable()
export class RewardsService {
  constructor(private prisma: PrismaService) {}

  async getCatalog() {
    const items = await this.prisma.rewardItem.findMany({
      where: { active: true },
      orderBy: { cost: 'asc' },
    });
    return items.map((i) => ({
      id: String(i.id),
      title: i.title,
      description: i.description ?? undefined,
      cost: i.cost,
      stock: i.stock,
    }));
  }

  async getWallet(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { reward_points: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return { rewardPoints: user.reward_points };
  }

  async redeem(user: AuthUserPayload, itemId: number) {
    const item = await this.prisma.rewardItem.findFirst({
      where: { id: itemId, active: true },
    });
    if (!item) throw new NotFoundException('Phần quà không tồn tại');
    if (item.stock <= 0) throw new BadRequestException('Phần quà đã hết');

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!dbUser) throw new NotFoundException('Không tìm thấy người dùng');
    if (dbUser.reward_points < item.cost) {
      throw new BadRequestException(
        `Không đủ điểm. Cần ${item.cost}, bạn có ${dbUser.reward_points}.`,
      );
    }

    const [updated] = await this.prisma.$transaction(
      async (tx) => {
        const u = await tx.user.update({
          where: { id: user.id },
          data: { reward_points: { decrement: item.cost } },
        });
        await tx.rewardItem.update({
          where: { id: item.id },
          data: { stock: { decrement: 1 } },
        });
        await tx.rewardRedemption.create({
          data: {
            user_id: user.id,
            item_id: item.id,
            cost: item.cost,
            voucher_code: `VOUCHER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          },
        });
        return [u];
      },
      { timeout: 30000 },
    );

    return {
      rewardPoints: updated.reward_points,
      item: { id: String(item.id), title: item.title },
    };
  }

  async getMyVouchers(userId: number) {
    const redemptions = await this.prisma.rewardRedemption.findMany({
      where: { user_id: userId },
      include: { item: true },
      orderBy: { created_at: 'desc' },
    });

    return redemptions.map((r) => ({
      id: String(r.id),
      itemId: String(r.item_id),
      itemTitle: r.item.title,
      itemDescription: r.item.description,
      cost: r.cost,
      voucherCode: r.voucher_code,
      isUsed: r.is_used,
      createdAt: r.created_at.toISOString(),
    }));
  }
}
