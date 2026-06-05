-- Chuyển tin nhắn từ cuộc trò chuyện trùng sang bản giữ (id nhỏ nhất mỗi cặp user)
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
WHERE c.id <> k.keep_id;

-- Xóa cuộc trò chuyện trùng
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
WHERE c.id <> k.keep_id;

-- Chuẩn hóa user1_id < user2_id
UPDATE conversations
SET
  user1_id = LEAST(user1_id, user2_id),
  user2_id = GREATEST(user1_id, user2_id);

-- Mỗi cặp user chỉ một cuộc trò chuyện
CREATE UNIQUE INDEX `conversations_user1_id_user2_id_key` ON `conversations`(`user1_id`, `user2_id`);
