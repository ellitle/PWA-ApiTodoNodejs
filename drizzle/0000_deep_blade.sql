CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `lastname` VARCHAR(255) NOT NULL,
    `firstname` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `users_email_unique` (`email`)
);

CREATE TABLE `account` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 10000.00,
    `opened_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    CONSTRAINT `account_user_fk`
        FOREIGN KEY (`userId`)
        REFERENCES `users` (`id`)
        ON DELETE RESTRICT
);