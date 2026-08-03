package com.fitness.checkin.service;

import com.fitness.checkin.entity.Plan;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 计划服务接口
 * 提供计划相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
public interface PlanService {

    /**
     * 创建计划
     * 
     * @param circleId             圈子ID
     * @param userId               创建者用户ID
     * @param name                 计划名称
     * @param description          计划描述
     * @param startDate            开始日期
     * @param endDate              结束日期
     * @param totalDurationGoal    总时长目标（分钟）
     * @param dailyDurationGoal    每日时长目标（分钟）
     * @param circleTotalGoal      圈子总目标（分钟）
     * @param minDurationPerCheckin 每次打卡最小时间（分钟）
     * @return 创建的计划
     */
    Plan createPlan(Long circleId, Long userId, String name, String description,
                   LocalDate startDate, LocalDate endDate,
                   Integer totalDurationGoal, Integer dailyDurationGoal,
                   Integer circleTotalGoal, Integer minDurationPerCheckin);

    /**
     * 启动计划
     * 
     * @param planId 计划ID
     * @param userId 操作者用户ID
     * @return 更新后的计划
     */
    Plan startPlan(Long planId, Long userId);

    /**
     * 获取计划详情
     * 
     * @param planId 计划ID
     * @param userId 当前用户ID
     * @return 计划详情（包含统计信息）
     */
    Map<String, Object> getPlanDetail(Long planId, Long userId);

    /**
     * 获取圈子的计划列表
     * 
     * @param circleId 圈子ID
     * @param userId   当前用户ID
     * @return 计划列表
     */
    List<Map<String, Object>> getCirclePlans(Long circleId, Long userId);

    /**
     * 获取计划信息
     * 
     * @param planId 计划ID
     * @return 计划实体
     */
    Plan getPlanById(Long planId);

    /**
     * 结束过期计划
     * 
     * @return 结束的计划数量
     */
    int finishExpiredPlans();

    /**
     * 获取圈子的进行中计划
     * 
     * @param circleId 圈子ID
     * @return 进行中的计划
     */
    Plan getActivePlan(Long circleId);
}