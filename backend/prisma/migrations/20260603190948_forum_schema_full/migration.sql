-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `avatar_url` VARCHAR(500) NULL,
    `birthday` DATETIME(3) NULL,
    `bio` TEXT NULL,
    `social_links` JSON NULL,
    `faculty` VARCHAR(150) NULL,
    `role` ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `reward_points` INTEGER NOT NULL DEFAULT 200,
    `reset_password_token` VARCHAR(255) NULL,
    `reset_password_expires` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_is_active_idx`(`is_active`),
    INDEX `users_faculty_idx`(`faculty`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `author_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `excerpt` VARCHAR(500) NULL,
    `content` TEXT NOT NULL,
    `moderation_status` ENUM('published', 'pending', 'hidden') NOT NULL DEFAULT 'published',
    `moderation_note` TEXT NULL,
    `matched_words` JSON NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `answer_count` INTEGER NOT NULL DEFAULT 0,
    `bounty` INTEGER NOT NULL DEFAULT 0,
    `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    `avg_rating` DOUBLE NOT NULL DEFAULT 0,
    `rating_count` INTEGER NOT NULL DEFAULT 0,
    `accepted_comment_id` INTEGER NULL,
    `vote_score` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `posts_slug_key`(`slug`),
    UNIQUE INDEX `posts_accepted_comment_id_key`(`accepted_comment_id`),
    INDEX `posts_difficulty_idx`(`difficulty`),
    INDEX `posts_avg_rating_idx`(`avg_rating`),
    INDEX `posts_author_id_idx`(`author_id`),
    INDEX `posts_moderation_status_idx`(`moderation_status`),
    INDEX `posts_created_at_idx`(`created_at`),
    INDEX `posts_moderation_status_created_at_idx`(`moderation_status`, `created_at`),
    INDEX `posts_deleted_at_idx`(`deleted_at`),
    INDEX `posts_bounty_idx`(`bounty`),
    FULLTEXT INDEX `posts_title_content_idx`(`title`, `content`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_follows` (
    `user_id` INTEGER NOT NULL,
    `post_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `post_follows_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `post_follows_post_id_idx`(`post_id`),
    PRIMARY KEY (`user_id`, `post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `category` ENUM('subject', 'class', 'faculty', 'field', 'other') NOT NULL DEFAULT 'other',
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tags_name_key`(`name`),
    UNIQUE INDEX `tags_slug_key`(`slug`),
    INDEX `tags_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_tags` (
    `post_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `post_tags_tag_id_idx`(`tag_id`),
    PRIMARY KEY (`post_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `author_id` INTEGER NOT NULL,
    `parent_id` INTEGER NULL,
    `content` TEXT NOT NULL,
    `is_accepted` BOOLEAN NOT NULL DEFAULT false,
    `moderation_status` ENUM('published', 'pending', 'hidden') NOT NULL DEFAULT 'published',
    `moderation_note` TEXT NULL,
    `matched_words` JSON NULL,
    `vote_score` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `comments_post_id_idx`(`post_id`),
    INDEX `comments_author_id_idx`(`author_id`),
    INDEX `comments_parent_id_idx`(`parent_id`),
    INDEX `comments_post_id_parent_id_created_at_idx`(`post_id`, `parent_id`, `created_at`),
    INDEX `comments_moderation_status_idx`(`moderation_status`),
    INDEX `comments_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `votes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `target_id` INTEGER NOT NULL,
    `target_type` ENUM('post', 'comment') NOT NULL,
    `vote_value` TINYINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `votes_target_type_target_id_idx`(`target_type`, `target_id`),
    UNIQUE INDEX `votes_user_id_target_id_target_type_key`(`user_id`, `target_id`, `target_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `sender_id` INTEGER NULL,
    `post_id` INTEGER NULL,
    `comment_id` INTEGER NULL,
    `type` ENUM('comment', 'reply', 'vote', 'system', 'moderation', 'report') NOT NULL,
    `title` VARCHAR(150) NULL,
    `content` VARCHAR(500) NOT NULL,
    `link_path` VARCHAR(255) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_is_read_created_at_idx`(`user_id`, `is_read`, `created_at`),
    INDEX `notifications_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banned_words` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `word` VARCHAR(100) NOT NULL,
    `action` ENUM('pending', 'hidden') NOT NULL DEFAULT 'pending',
    `created_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `banned_words_word_key`(`word`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `target_type` ENUM('post', 'comment') NOT NULL,
    `target_id` INTEGER NOT NULL,
    `reporter_id` INTEGER NOT NULL,
    `reason` VARCHAR(1000) NOT NULL,
    `status` ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
    `resolved_action` ENUM('keep', 'warn', 'delete') NULL,
    `resolved_by` INTEGER NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `content_reports_status_idx`(`status`),
    INDEX `content_reports_target_type_target_id_idx`(`target_type`, `target_id`),
    INDEX `content_reports_reporter_id_target_type_target_id_status_idx`(`reporter_id`, `target_type`, `target_id`, `status`),
    INDEX `content_reports_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_ratings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `stars` TINYINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `post_ratings_user_id_idx`(`user_id`),
    UNIQUE INDEX `post_ratings_post_id_user_id_key`(`post_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reward_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `cost` INTEGER NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 100,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reward_redemptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `cost` INTEGER NOT NULL,
    `voucher_code` VARCHAR(100) NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reward_redemptions_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moderation_audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_id` INTEGER NOT NULL,
    `target_type` ENUM('post', 'comment') NOT NULL,
    `target_id` INTEGER NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `previous_status` ENUM('published', 'pending', 'hidden') NULL,
    `new_status` ENUM('published', 'pending', 'hidden') NULL,
    `note` TEXT NULL,
    `report_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `moderation_audit_logs_target_type_target_id_idx`(`target_type`, `target_id`),
    INDEX `moderation_audit_logs_actor_id_idx`(`actor_id`),
    INDEX `moderation_audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_follows` (
    `follower_id` INTEGER NOT NULL,
    `following_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_follows_following_id_created_at_idx`(`following_id`, `created_at` DESC),
    INDEX `user_follows_follower_id_created_at_idx`(`follower_id`, `created_at` DESC),
    PRIMARY KEY (`follower_id`, `following_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user1_id` INTEGER NOT NULL,
    `user2_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `conversations_user1_id_idx`(`user1_id`),
    INDEX `conversations_user2_id_idx`(`user2_id`),
    INDEX `conversations_user1_id_user2_id_idx`(`user1_id`, `user2_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_conversation_id_idx`(`conversation_id`),
    INDEX `messages_sender_id_idx`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_accepted_comment_id_fkey` FOREIGN KEY (`accepted_comment_id`) REFERENCES `comments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_follows` ADD CONSTRAINT `post_follows_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_follows` ADD CONSTRAINT `post_follows_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `votes` ADD CONSTRAINT `votes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `banned_words` ADD CONSTRAINT `banned_words_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_reports` ADD CONSTRAINT `content_reports_reporter_id_fkey` FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_reports` ADD CONSTRAINT `content_reports_resolved_by_fkey` FOREIGN KEY (`resolved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_ratings` ADD CONSTRAINT `post_ratings_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_ratings` ADD CONSTRAINT `post_ratings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_redemptions` ADD CONSTRAINT `reward_redemptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_redemptions` ADD CONSTRAINT `reward_redemptions_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `reward_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moderation_audit_logs` ADD CONSTRAINT `moderation_audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moderation_audit_logs` ADD CONSTRAINT `moderation_audit_logs_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `content_reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_follows` ADD CONSTRAINT `user_follows_follower_id_fkey` FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_follows` ADD CONSTRAINT `user_follows_following_id_fkey` FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user1_id_fkey` FOREIGN KEY (`user1_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user2_id_fkey` FOREIGN KEY (`user2_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
