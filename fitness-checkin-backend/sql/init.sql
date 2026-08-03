-- 健身打卡小程序数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS fitness_checkin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fitness_checkin;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    `openid` VARCHAR(64) NOT NULL COMMENT '微信openid',
    `nickname` VARCHAR(50) DEFAULT '' COMMENT '昵称',
    `avatar_url` VARCHAR(500) DEFAULT '' COMMENT '头像URL',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY `uk_openid` (`openid`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 圈子表
CREATE TABLE IF NOT EXISTS `circles` (
    `circle_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '圈子ID',
    `name` VARCHAR(100) NOT NULL COMMENT '圈子名称',
    `description` VARCHAR(500) DEFAULT '' COMMENT '圈子描述',
    `creator_id` BIGINT NOT NULL COMMENT '创建者用户ID',
    `max_members` INT NOT NULL DEFAULT 50 COMMENT '最大成员数',
    `invite_code` VARCHAR(32) NOT NULL COMMENT '邀请码',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    UNIQUE KEY `uk_invite_code` (`invite_code`),
    INDEX `idx_creator_id` (`creator_id`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`creator_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='圈子表';

-- 圈子成员表
CREATE TABLE IF NOT EXISTS `circle_members` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `circle_id` BIGINT NOT NULL COMMENT '圈子ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    `role` TINYINT NOT NULL DEFAULT 0 COMMENT '角色：0-普通成员，1-管理员，2-创建者',
    UNIQUE KEY `uk_circle_user` (`circle_id`, `user_id`),
    INDEX `idx_user_id` (`user_id`),
    FOREIGN KEY (`circle_id`) REFERENCES `circles`(`circle_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='圈子成员表';

-- 计划表
CREATE TABLE IF NOT EXISTS `plans` (
    `plan_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '计划ID',
    `circle_id` BIGINT NOT NULL COMMENT '圈子ID',
    `name` VARCHAR(100) NOT NULL COMMENT '计划名称',
    `description` VARCHAR(500) DEFAULT '' COMMENT '计划描述',
    `start_date` DATE NOT NULL COMMENT '开始日期',
    `end_date` DATE NOT NULL COMMENT '结束日期',
    `total_duration_goal` INT NOT NULL DEFAULT 0 COMMENT '总时长目标（分钟）',
    `daily_duration_goal` INT NOT NULL DEFAULT 0 COMMENT '每日时长目标（分钟）',
    `circle_total_goal` INT NOT NULL DEFAULT 0 COMMENT '圈子总目标（分钟）',
    `min_duration_per_checkin` INT NOT NULL DEFAULT 10 COMMENT '每次打卡最小时间（分钟）',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-未开始，1-进行中，2-已结束',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_circle_id` (`circle_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_start_date` (`start_date`),
    INDEX `idx_end_date` (`end_date`),
    FOREIGN KEY (`circle_id`) REFERENCES `circles`(`circle_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计划表';

-- 打卡记录表
CREATE TABLE IF NOT EXISTS `checkin_records` (
    `record_id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    `plan_id` BIGINT NOT NULL COMMENT '计划ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `duration` INT NOT NULL COMMENT '运动时长（分钟）',
    `exercise_type` VARCHAR(50) NOT NULL COMMENT '运动类型',
    `photo_url` VARCHAR(500) DEFAULT '' COMMENT '打卡照片URL',
    `remark` VARCHAR(500) DEFAULT '' COMMENT '备注',
    `checkin_time` DATETIME NOT NULL COMMENT '打卡时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX `idx_plan_id` (`plan_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_checkin_time` (`checkin_time`),
    INDEX `idx_plan_user_time` (`plan_id`, `user_id`, `checkin_time`),
    FOREIGN KEY (`plan_id`) REFERENCES `plans`(`plan_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡记录表';

-- 插入测试数据（可选）
-- INSERT INTO `users` (`openid`, `nickname`, `avatar_url`) VALUES 
-- ('test_openid_1', '测试用户1', 'https://example.com/avatar1.jpg'),
-- ('test_openid_2', '测试用户2', 'https://example.com/avatar2.jpg');

-- 创建索引
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_circles_invite_code ON circles(invite_code);
CREATE INDEX idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX idx_plans_circle_id ON plans(circle_id);
CREATE INDEX idx_checkin_records_plan_user ON checkin_records(plan_id, user_id);