package com.fitness.checkin.service;

import com.fitness.checkin.entity.Circle;
import com.fitness.checkin.entity.CircleMember;

import java.util.List;
import java.util.Map;

/**
 * 圈子服务接口
 * 提供圈子相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
public interface CircleService {

    /**
     * 创建圈子
     * 
     * @param creatorId   创建者用户ID
     * @param name        圈子名称
     * @param description 圈子描述
     * @param maxMembers  最大成员数
     * @return 创建的圈子
     */
    Circle createCircle(Long creatorId, String name, String description, Integer maxMembers);

    /**
     * 加入圈子
     * 
     * @param userId     用户ID
     * @param inviteCode 邀请码
     * @return 加入的圈子成员信息
     */
    CircleMember joinCircle(Long userId, String inviteCode);

    /**
     * 获取圈子详情
     * 
     * @param circleId 圈子ID
     * @param userId   当前用户ID（用于检查是否成员）
     * @return 圈子详情（包含成员信息）
     */
    Map<String, Object> getCircleDetail(Long circleId, Long userId);

    /**
     * 获取圈子成员列表
     * 
     * @param circleId 圈子ID
     * @return 成员列表（包含用户信息）
     */
    List<Map<String, Object>> getCircleMembers(Long circleId);

    /**
     * 获取用户加入的圈子列表
     * 
     * @param userId 用户ID
     * @return 圈子列表
     */
    List<Circle> getUserCircles(Long userId);

    /**
     * 检查用户是否是圈子成员
     * 
     * @param circleId 圈子ID
     * @param userId   用户ID
     * @return 是否是成员
     */
    boolean isCircleMember(Long circleId, Long userId);

    /**
     * 检查用户是否是圈子管理员或创建者
     * 
     * @param circleId 圈子ID
     * @param userId   用户ID
     * @return 是否是管理员或创建者
     */
    boolean isCircleAdmin(Long circleId, Long userId);

    /**
     * 获取圈子信息
     * 
     * @param circleId 圈子ID
     * @return 圈子实体
     */
    Circle getCircleById(Long circleId);

    /**
     * 归档圈子（仅创建者，status 1→0）
     * 
     * @param circleId 圈子ID
     * @param userId   操作人用户ID
     */
    void archiveCircle(Long circleId, Long userId);

    /**
     * 恢复圈子（仅创建者，status 0→1）
     * 
     * @param circleId 圈子ID
     * @param userId   操作人用户ID
     */
    void restoreCircle(Long circleId, Long userId);
}