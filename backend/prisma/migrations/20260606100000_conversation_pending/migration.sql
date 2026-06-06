-- AlterTable
ALTER TABLE `conversations`
  ADD COLUMN `initiated_by_id` INTEGER NULL,
  ADD COLUMN `status` ENUM('pending', 'active') NOT NULL DEFAULT 'active',
  ADD COLUMN `accepted_at` DATETIME(3) NULL;

-- Cuộc trò chuyện đã có tin nhắn: coi là đã chấp nhận
UPDATE `conversations` c
SET
  `status` = 'active',
  `accepted_at` = COALESCE(c.`updated_at`, c.`created_at`),
  `initiated_by_id` = (
    SELECT m.`sender_id`
    FROM `messages` m
    WHERE m.`conversation_id` = c.`id`
    ORDER BY m.`created_at` ASC
    LIMIT 1
  )
WHERE EXISTS (
  SELECT 1 FROM `messages` m WHERE m.`conversation_id` = c.`id`
);

ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_initiated_by_id_fkey`
  FOREIGN KEY (`initiated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
