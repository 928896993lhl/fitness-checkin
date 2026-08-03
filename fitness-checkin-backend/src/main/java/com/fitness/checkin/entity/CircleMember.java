package com.fitness.checkin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 圈子成员实体类
 * 对应数据库 circle_members 表
 * 
 * @author Kou
 * @version 1.0.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("circle_members")
public class CircleMember implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 圈子ID
     */
    private Long circleId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 加入时间
     */
    private LocalDateTime joinedAt;

    /**
     * 角色：0-普通成员，1-管理员，2-创建者
     */
    private Integer role;
}