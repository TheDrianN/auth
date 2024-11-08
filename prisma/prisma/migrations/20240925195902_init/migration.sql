-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chapter_id` INTEGER NOT NULL,
    `document` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `status` CHAR(1) NOT NULL,
    `rol` CHAR(1) NOT NULL,
    `names` VARCHAR(255) NOT NULL,
    `surnames` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(10) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `date_of_birth` DATE NOT NULL,
    `code_access` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chapter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `status` CHAR(1) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `Chapter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
