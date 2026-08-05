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
 * 打卡记录实体类
 * 对应数据库 checkin_records 表
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("checkin_records")
public class CheckinRecord implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 记录ID
     */
    @TableId(value = "record_id", type = IdType.AUTO)
    private Long recordId;

    /**
     * 计划ID（可空，宽松打卡）
     */
    private Long planId;

    /**
     * 圈子ID（可空，宽松打卡；planId 非空时默认取计划所属圈子）
     */
    private Long circleId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 运动时长（分钟）
     */
    private Integer duration;

    /**
     * 运动类型
     */
    private String exerciseType;

    /**
     * 打卡照片URL
     */
    private String photoUrl;

    /**
     * 备注
     */
    private String remark;

    /**
     * 打卡时间
     */
    private LocalDateTime checkinTime;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}