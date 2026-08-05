package com.fitness.checkin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 圈子实体类
 * 对应数据库 circles 表
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("circles")
public class Circle implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 圈子ID
     */
    @TableId(value = "circle_id", type = IdType.AUTO)
    private Long circleId;

    /**
     * 圈子名称
     */
    private String name;

    /**
     * 圈子描述
     */
    private String description;

    /**
     * 创建者用户ID
     */
    private Long creatorId;

    /**
     * 最大成员数
     */
    private Integer maxMembers;

    /**
     * 邀请码
     */
    private String inviteCode;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 状态：0-禁用，1-正常
     */
    private Integer status;

    /**
     * 成员数量（瞬态字段，不入库；用于圈子列表展示，避免前端逐圈请求）
     */
    @TableField(exist = false)
    private Integer memberCount;
}