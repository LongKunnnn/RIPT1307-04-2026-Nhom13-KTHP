/**
 * Gộp cuộc trò chuyện trùng trước khi thêm UNIQUE(user1_id, user2_id).
 * Chạy: npm run db:dedupe-chat
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const before = await prisma.$queryRaw<
    { pairs: bigint }[]
  >`SELECT COUNT(*) AS pairs FROM (
    SELECT LEAST(user1_id, user2_id) AS u1, GREATEST(user1_id, user2_id) AS u2
    FROM conversations
    GROUP BY LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id)
    HAVING COUNT(*) > 1
  ) t`;

  const dupPairs = Number(before[0]?.pairs ?? 0);
  console.log(`Cặp user bị trùng cuộc trò chuyện: ${dupPairs}`);

  const moved = await prisma.$executeRaw`
    UPDATE messages m
    INNER JOIN conversations c ON m.conversation_id = c.id
    INNER JOIN (
      SELECT
        LEAST(user1_id, user2_id) AS u1,
        GREATEST(user1_id, user2_id) AS u2,
        MIN(id) AS keep_id
      FROM conversations
      GROUP BY LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id)
    ) k ON LEAST(c.user1_id, c.user2_id) = k.u1
      AND GREATEST(c.user1_id, c.user2_id) = k.u2
    SET m.conversation_id = k.keep_id
    WHERE c.id <> k.keep_id
  `;
  console.log(`Đã chuyển tin nhắn (rows affected): ${moved}`);

  const deleted = await prisma.$executeRaw`
    DELETE c FROM conversations c
    INNER JOIN (
      SELECT
        LEAST(user1_id, user2_id) AS u1,
        GREATEST(user1_id, user2_id) AS u2,
        MIN(id) AS keep_id
      FROM conversations
      GROUP BY LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id)
    ) k ON LEAST(c.user1_id, c.user2_id) = k.u1
      AND GREATEST(c.user1_id, c.user2_id) = k.u2
    WHERE c.id <> k.keep_id
  `;
  console.log(`Đã xóa cuộc trò chuyện trùng: ${deleted}`);

  const normalized = await prisma.$executeRaw`
    UPDATE conversations
    SET
      user1_id = LEAST(user1_id, user2_id),
      user2_id = GREATEST(user1_id, user2_id)
  `;
  console.log(`Đã chuẩn hóa thứ tự user1/user2: ${normalized}`);

  const after = await prisma.$queryRaw<
    { pairs: bigint }[]
  >`SELECT COUNT(*) AS pairs FROM (
    SELECT user1_id, user2_id
    FROM conversations
    GROUP BY user1_id, user2_id
    HAVING COUNT(*) > 1
  ) t`;

  const remaining = Number(after[0]?.pairs ?? 0);
  if (remaining > 0) {
    throw new Error(
      `Vẫn còn ${remaining} cặp trùng sau khi gộp — kiểm tra dữ liệu thủ công.`,
    );
  }

  console.log('Gộp xong. Chạy tiếp: npx prisma db push');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
