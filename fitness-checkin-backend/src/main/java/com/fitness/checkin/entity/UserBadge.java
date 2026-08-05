package com.fitness.checkin.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 用户徽章解锁记录实体类
 * 对应数据库 user_badges 表（复合主键：user_id + badge_code）
 * 注：复合主键不使用 @TableId（MyBatis-Plus 不支持多主键），
 * 数据操作走 UserBadgeMapper 自定义 SQL（insertIgnore/selectByUserId）
 *
 * @author Kou
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("user_badges")
public class UserBadge implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 用户ID（复合主键之一）
     */
    @TableField(value = "user_id")
    private Long userId;

    /**
     * 徽章编码（复合主键之一，对应 BadgeCode.code）
     */
    @TableField(value = "badge_code")
    private String badgeCode;

    /**
     * 解锁时间
     */
    @TableField(value = "unlocked_at", fill = FieldFill.INSERT)
    private LocalDateTime unlockedAt;
}
