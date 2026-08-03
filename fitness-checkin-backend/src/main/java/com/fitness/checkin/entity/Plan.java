package com.fitness.checkin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 计划实体类
 * 对应数据库 plans 表
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("plans")
public class Plan implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 计划ID
     */
    @TableId(value = "plan_id", type = IdType.AUTO)
    private Long planId;

    /**
     * 圈子ID
     */
    private Long circleId;

    /**
     * 计划名称
     */
    private String name;

    /**
     * 计划描述
     */
    private String description;

    /**
     * 开始日期
     */
    private LocalDate startDate;

    /**
     * 结束日期
     */
    private LocalDate endDate;

    /**
     * 总时长目标（分钟）
     */
    private Integer totalDurationGoal;

    /**
     * 每日时长目标（分钟）
     */
    private Integer dailyDurationGoal;

    /**
     * 圈子总目标（分钟）
     */
    private Integer circleTotalGoal;

    /**
     * 每次打卡最小时间（分钟）
     */
    private Integer minDurationPerCheckin;

    /**
     * 状态：0-未开始，1-进行中，2-已结束
     */
    private Integer status;

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
}