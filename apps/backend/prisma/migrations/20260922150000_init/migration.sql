-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('CUSTOMER', 'AGENT', 'SUPERVISOR', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isAiConsultant` BOOLEAN NOT NULL DEFAULT false,
    `isBanned` BOOLEAN NOT NULL DEFAULT false,
    `banReason` VARCHAR(191) NULL,
    `bannedAt` DATETIME(3) NULL,
    `failedLoginCount` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `emailVerifyToken` VARCHAR(191) NULL,
    `passwordResetToken` VARCHAR(191) NULL,
    `passwordResetExpires` DATETIME(3) NULL,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(191) NULL,
    `isSuspicious` BOOLEAN NOT NULL DEFAULT false,
    `suspicionScore` DOUBLE NOT NULL DEFAULT 0,
    `suspicionReason` VARCHAR(191) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(191) NULL,
    `registeredIp` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_emailVerifyToken_key`(`emailVerifyToken`),
    UNIQUE INDEX `users_passwordResetToken_key`(`passwordResetToken`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_isAiConsultant_idx`(`isAiConsultant`),
    INDEX `users_isBanned_idx`(`isBanned`),
    INDEX `users_isSuspicious_idx`(`isSuspicious`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `userAgent` TEXT NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `revokedAt` DATETIME(3) NULL,
    `revokedReason` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_sessions_tokenHash_key`(`tokenHash`),
    INDEX `user_sessions_userId_idx`(`userId`),
    INDEX `user_sessions_tokenHash_idx`(`tokenHash`),
    INDEX `user_sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_tokenHash_key`(`tokenHash`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    INDEX `refresh_tokens_tokenHash_idx`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teams_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `team_members` (
    `teamId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `isLead` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`teamId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `defaultPriority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `defaultTeamId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routing_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('CATEGORY', 'KEYWORD', 'PRIORITY', 'FALLBACK') NOT NULL,
    `categoryId` INTEGER NULL,
    `keyword` VARCHAR(191) NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NULL,
    `targetTeamId` INTEGER NOT NULL,
    `priorityOverride` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NULL,
    `order` INTEGER NOT NULL DEFAULT 100,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `routing_rules_isActive_order_idx`(`isActive`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sla_policies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL,
    `responseTimeHours` DOUBLE NOT NULL,
    `resolutionTimeHours` DOUBLE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `sla_policies_priority_key`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tickets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketNumber` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('NEW', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'NEW',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `type` ENUM('BUG', 'FEATURE', 'QUESTION', 'INCIDENT', 'TASK') NOT NULL DEFAULT 'QUESTION',
    `customerId` INTEGER NOT NULL,
    `teamId` INTEGER NULL,
    `assignedToId` INTEGER NULL,
    `categoryId` INTEGER NULL,
    `slaResponseDueAt` DATETIME(3) NULL,
    `slaResolutionDueAt` DATETIME(3) NULL,
    `firstRespondedAt` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `closedAt` DATETIME(3) NULL,
    `slaResponseBreached` BOOLEAN NOT NULL DEFAULT false,
    `slaResolutionBreached` BOOLEAN NOT NULL DEFAULT false,
    `isSpamFlagged` BOOLEAN NOT NULL DEFAULT false,
    `aiClassificationScore` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tickets_ticketNumber_key`(`ticketNumber`),
    INDEX `tickets_status_idx`(`status`),
    INDEX `tickets_priority_idx`(`priority`),
    INDEX `tickets_customerId_idx`(`customerId`),
    INDEX `tickets_assignedToId_idx`(`assignedToId`),
    INDEX `tickets_teamId_idx`(`teamId`),
    INDEX `tickets_slaResolutionDueAt_idx`(`slaResolutionDueAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#94a3b8',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_tags` (
    `ticketId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,

    PRIMARY KEY (`ticketId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `body` TEXT NOT NULL,
    `type` ENUM('REPLY', 'INTERNAL_NOTE', 'SYSTEM_EVENT') NOT NULL DEFAULT 'REPLY',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ticket_messages_ticketId_idx`(`ticketId`),
    INDEX `ticket_messages_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `messageId` INTEGER NULL,
    `filename` VARCHAR(191) NOT NULL,
    `storagePath` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `uploadedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `attachments_ticketId_idx`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routing_decisions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `ruleId` INTEGER NULL,
    `assignedTeamId` INTEGER NOT NULL,
    `assignedUserId` INTEGER NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `routing_decisions_ticketId_key`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knowledge_articles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `visibility` ENUM('PUBLIC', 'INTERNAL') NOT NULL DEFAULT 'PUBLIC',
    `categoryId` INTEGER NULL,
    `authorId` INTEGER NOT NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `knowledge_articles_visibility_isPublished_idx`(`visibility`, `isPublished`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knowledge_chunks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `articleId` INTEGER NOT NULL,
    `body` TEXT NOT NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `contentHash` VARCHAR(191) NOT NULL,
    `licenseNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `knowledge_chunks_articleId_idx`(`articleId`),
    UNIQUE INDEX `knowledge_chunks_articleId_contentHash_key`(`articleId`, `contentHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consult_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NULL,
    `actorId` INTEGER NULL,
    `engine` ENUM('OLLAMA', 'RETRIEVAL') NOT NULL,
    `confidence` DOUBLE NOT NULL,
    `chunkIds` JSON NOT NULL,
    `answer` TEXT NOT NULL,
    `latencyMs` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `consult_attempts_ticketId_createdAt_idx`(`ticketId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `csat_surveys` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `customerId` INTEGER NOT NULL,
    `rating` INTEGER NULL,
    `comment` TEXT NULL,
    `status` ENUM('PENDING', 'SUBMITTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `csat_surveys_ticketId_key`(`ticketId`),
    INDEX `csat_surveys_customerId_status_idx`(`customerId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` ENUM('TICKET_CREATED', 'TICKET_ASSIGNED', 'TICKET_REPLIED', 'TICKET_RESOLVED', 'TICKET_CLOSED', 'SLA_WARNING', 'SLA_BREACHED', 'CSAT_REQUEST', 'SYSTEM') NOT NULL,
    `ticketId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhooks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `secret` VARCHAR(191) NOT NULL,
    `events` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_deliveries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `webhookId` INTEGER NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `httpStatus` INTEGER NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `lastAttemptAt` DATETIME(3) NULL,
    `nextRetryAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `webhook_deliveries_webhookId_status_idx`(`webhookId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `category` ENUM('AUTH', 'ACCESS', 'TICKET', 'MODERATION', 'SECURITY', 'ADMIN', 'FAIR_USAGE') NOT NULL,
    `severity` ENUM('INFO', 'WARN', 'ERROR', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    `actorId` INTEGER NULL,
    `actorIp` VARCHAR(191) NULL,
    `actorAgent` TEXT NULL,
    `targetType` VARCHAR(191) NULL,
    `targetId` INTEGER NULL,
    `message` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_category_idx`(`category`),
    INDEX `audit_logs_severity_idx`(`severity`),
    INDEX `audit_logs_actorId_idx`(`actorId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blocked_ips` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ip` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `blockedById` INTEGER NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `blocked_ips_ip_key`(`ip`),
    INDEX `blocked_ips_ip_idx`(`ip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rate_limit_violations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ip` VARCHAR(191) NOT NULL,
    `userId` INTEGER NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `violationType` VARCHAR(191) NOT NULL,
    `requestCount` INTEGER NOT NULL DEFAULT 1,
    `windowStart` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `rate_limit_violations_ip_idx`(`ip`),
    INDEX `rate_limit_violations_userId_idx`(`userId`),
    INDEX `rate_limit_violations_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cooldown_periods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `cooldownMs` INTEGER NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cooldown_periods_userId_action_idx`(`userId`, `action`),
    INDEX `cooldown_periods_endsAt_idx`(`endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usage_quotas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `ticketsThisHour` INTEGER NOT NULL DEFAULT 0,
    `ticketsToday` INTEGER NOT NULL DEFAULT 0,
    `messagesThisHour` INTEGER NOT NULL DEFAULT 0,
    `messagesToday` INTEGER NOT NULL DEFAULT 0,
    `apiCallsThisMinute` INTEGER NOT NULL DEFAULT 0,
    `apiCallsToday` INTEGER NOT NULL DEFAULT 0,
    `hourWindowStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dayWindowStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `minuteWindowStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `quotaViolations` INTEGER NOT NULL DEFAULT 0,
    `lastViolationAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usage_quotas_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spam_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` INTEGER NOT NULL,
    `reportedById` INTEGER NULL,
    `reason` ENUM('SPAM_CONTENT', 'SCAM', 'BOT_BEHAVIOR', 'ABUSE', 'DUPLICATE', 'FAKE_ACCOUNT', 'OTHER') NOT NULL,
    `aiScore` DOUBLE NOT NULL DEFAULT 0,
    `aiFlags` JSON NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'DISMISSED', 'AUTO_BLOCKED') NOT NULL DEFAULT 'PENDING',
    `reviewedById` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `spam_reports_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `spam_reports_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permission_overrides` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `permission` VARCHAR(191) NOT NULL,
    `granted` BOOLEAN NOT NULL,
    `grantedById` INTEGER NULL,
    `reason` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `permission_overrides_userId_idx`(`userId`),
    UNIQUE INDEX `permission_overrides_userId_permission_key`(`userId`, `permission`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_queries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `query` TEXT NOT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `variables` JSON NULL,
    `isBookmarked` BOOLEAN NOT NULL DEFAULT false,
    `tags` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `saved_queries_hash_key`(`hash`),
    INDEX `saved_queries_userId_idx`(`userId`),
    INDEX `saved_queries_hash_idx`(`hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookmarked_nodes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `nodeType` VARCHAR(191) NOT NULL,
    `nodeId` INTEGER NOT NULL,
    `label` VARCHAR(191) NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bookmarked_nodes_userId_idx`(`userId`),
    UNIQUE INDEX `bookmarked_nodes_userId_nodeType_nodeId_key`(`userId`, `nodeType`, `nodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ui_preferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `colorMode` VARCHAR(191) NOT NULL DEFAULT 'SYSTEM',
    `accentHex` VARCHAR(191) NOT NULL DEFAULT '#7C5CFC',
    `shade` INTEGER NOT NULL DEFAULT 0,
    `finish` VARCHAR(191) NOT NULL DEFAULT 'GLOSSY',
    `fontFamily` VARCHAR(191) NOT NULL DEFAULT 'OUTFIT',
    `fontSize` VARCHAR(191) NOT NULL DEFAULT 'M',
    `density` VARCHAR(191) NOT NULL DEFAULT 'COMFORTABLE',
    `ticketView` VARCHAR(191) NOT NULL DEFAULT 'LIST',
    `ticketSort` VARCHAR(191) NOT NULL DEFAULT 'UPDATED',
    `soundsMuted` BOOLEAN NOT NULL DEFAULT false,
    `logoDataUrl` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ui_preferences_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_sessions` ADD CONSTRAINT `user_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routing_rules` ADD CONSTRAINT `routing_rules_targetTeamId_fkey` FOREIGN KEY (`targetTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routing_rules` ADD CONSTRAINT `routing_rules_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_tags` ADD CONSTRAINT `ticket_tags_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_tags` ADD CONSTRAINT `ticket_tags_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_messages` ADD CONSTRAINT `ticket_messages_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket_messages` ADD CONSTRAINT `ticket_messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attachments` ADD CONSTRAINT `attachments_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `ticket_messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routing_decisions` ADD CONSTRAINT `routing_decisions_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routing_decisions` ADD CONSTRAINT `routing_decisions_assignedTeamId_fkey` FOREIGN KEY (`assignedTeamId`) REFERENCES `teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledge_articles` ADD CONSTRAINT `knowledge_articles_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledge_chunks` ADD CONSTRAINT `knowledge_chunks_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `knowledge_articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consult_attempts` ADD CONSTRAINT `consult_attempts_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consult_attempts` ADD CONSTRAINT `consult_attempts_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `csat_surveys` ADD CONSTRAINT `csat_surveys_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `csat_surveys` ADD CONSTRAINT `csat_surveys_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webhook_deliveries` ADD CONSTRAINT `webhook_deliveries_webhookId_fkey` FOREIGN KEY (`webhookId`) REFERENCES `webhooks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `permission_overrides` ADD CONSTRAINT `permission_overrides_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_queries` ADD CONSTRAINT `saved_queries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookmarked_nodes` ADD CONSTRAINT `bookmarked_nodes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ui_preferences` ADD CONSTRAINT `ui_preferences_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

