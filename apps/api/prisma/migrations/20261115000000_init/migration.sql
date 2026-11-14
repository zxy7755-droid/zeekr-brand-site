-- 由 prisma migrate diff --from-empty 生成；已在 staging 库执行，deploy.sh 不重复执行。
-- CreateTable
CREATE TABLE `Vehicle` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `series` VARCHAR(191) NOT NULL,
    `tagline` VARCHAR(255) NULL,
    `priceMin` INTEGER NULL,
    `priceMax` INTEGER NULL,
    `rangeKm` INTEGER NULL,
    `batteryKwh` INTEGER NULL,
    `zeroToHundred` DOUBLE NULL,
    `seats` INTEGER NULL DEFAULT 5,
    `driveType` VARCHAR(32) NULL,
    `imageKey` VARCHAR(255) NULL,
    `badge` VARCHAR(64) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vehicle_slug_key`(`slug`),
    INDEX `Vehicle_status_sortOrder_idx`(`status`, `sortOrder`),
    INDEX `Vehicle_series_idx`(`series`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestDriveLead` (
    `id` VARCHAR(191) NOT NULL,
    `vehicleSlug` VARCHAR(64) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `city` VARCHAR(32) NULL,
    `storeId` VARCHAR(64) NULL,
    `preferredAt` DATETIME(3) NULL,
    `consent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TestDriveLead_vehicleSlug_createdAt_idx`(`vehicleSlug`, `createdAt`),
    INDEX `TestDriveLead_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Store` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(32) NOT NULL,
    `district` VARCHAR(64) NULL,
    `address` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(32) NULL,
    `businessHours` VARCHAR(64) NULL,
    `latitude` DECIMAL(9, 6) NULL,
    `longitude` DECIMAL(9, 6) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Store_city_idx`(`city`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsArticle` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(512) NULL,
    `body` TEXT NULL,
    `coverKey` VARCHAR(255) NULL,
    `tag` ENUM('BRAND', 'TECH', 'EVENT') NOT NULL DEFAULT 'BRAND',
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `NewsArticle_slug_key`(`slug`),
    INDEX `NewsArticle_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `NewsArticle_tag_idx`(`tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

