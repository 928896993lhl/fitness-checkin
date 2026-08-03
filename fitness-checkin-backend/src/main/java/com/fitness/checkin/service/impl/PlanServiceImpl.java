package com.fitness.checkin.service.impl;

import com.fitness.checkin.common.BusinessException;
import com.fitness.checkin.entity.Circle;
import com.fitness.checkin.entity.CheckinRecord;
import com.fitness.checkin.entity.Plan;
import com.fitness.checkin.mapper.CheckinRecordMapper;
import com.fitness.checkin.mapper.PlanMapper;
import com.fitness.checkin.service.CircleService;
import com.fitness.checkin.service.PlanService;
import com.fitness.checkin.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 计划服务实现类
 * 实现计划相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
@Service
@Transactional
public class PlanServiceImpl implements PlanService {

    private static final Logger logger = LoggerFactory.getLogger(PlanServiceImpl.class);

    private final PlanMapper planMapper;
    private final CheckinRecordMapper checkinRecordMapper;
    private final CircleService circleService;
    private final UserService userService;

    public PlanServiceImpl(PlanMapper planMapper,
                          CheckinRecordMapper checkinRecordMapper,
                          CircleService circleService,
                          UserService userService) {
        this.planMapper = planMapper;
        this.checkinRecordMapper = checkinRecordMapper;
        this.circleService = circleService;
        this.userService = userService;
    }

    @Override
    public Plan createPlan(Long circleId, Long userId, String name, String description,
                          LocalDate startDate, LocalDate endDate,
                          Integer totalDurationGoal, Integer dailyDurationGoal,
                          Integer circleTotalGoal, Integer minDurationPerCheckin) {
        // 验证圈子存在且用户是管理员
        Circle circle = circleService.getCircleById(circleId);
        if (!circleService.isCircleAdmin(circleId, userId)) {
            throw BusinessException.forbidden("只有圈子管理员可以创建计划");
        }

        // 验证日期
        if (startDate.isBefore(LocalDate.now())) {
            throw BusinessException.badRequest("开始日期不能早于今天");
        }
        if (endDate.isBefore(startDate)) {
            throw BusinessException.badRequest("结束日期不能早于开始日期");
        }

        // 检查圈子是否有进行中的计划
        Plan activePlan = getActivePlan(circleId);
        if (activePlan != null) {
            throw BusinessException.conflict("圈子已有进行中的计划");
        }

        // 创建计划
        Plan plan = new Plan();
        plan.setCircleId(circleId);
        plan.setName(name);
        plan.setDescription(description != null ? description : "");
        plan.setStartDate(startDate);
        plan.setEndDate(endDate);
        plan.setTotalDurationGoal(totalDurationGoal != null ? totalDurationGoal : 0);
        plan.setDailyDurationGoal(dailyDurationGoal != null ? dailyDurationGoal : 30);
        plan.setCircleTotalGoal(circleTotalGoal != null ? circleTotalGoal : 0);
        plan.setMinDurationPerCheckin(minDurationPerCheckin != null ? minDurationPerCheckin : 10);
        plan.setStatus(0); // 0-未开始
        plan.setCreatedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());

        planMapper.insert(plan);
        logger.info("创建计划: {} - {}", plan.getPlanId(), name);

        return plan;
    }

    @Override
    public Plan startPlan(Long planId, Long userId) {
        Plan plan = getPlanById(planId);

        // 验证用户是圈子管理员
        if (!circleService.isCircleAdmin(plan.getCircleId(), userId)) {
            throw BusinessException.forbidden("只有圈子管理员可以启动计划");
        }

        // 验证计划状态
        if (plan.getStatus() != 0) {
            throw BusinessException.badRequest("计划已启动或已结束");
        }

        // 更新计划状态为进行中
        plan.setStatus(1);
        plan.setUpdatedAt(LocalDateTime.now());
        planMapper.updateById(plan);

        logger.info("启动计划: {}", planId);
        return plan;
    }

    @Override
    public Map<String, Object> getPlanDetail(Long planId, Long userId) {
        Plan plan = getPlanById(planId);

        // 验证用户是圈子成员
        if (!circleService.isCircleMember(plan.getCircleId(), userId)) {
            throw BusinessException.forbidden("没有权限查看此计划");
        }

        // 获取计划统计信息
        Map<String, Object> stats = checkinRecordMapper.selectStatsByPlanId(planId);

        // 获取用户个人统计
        Integer userTotalDuration = checkinRecordMapper.selectTotalDurationByPlanIdAndUserId(planId, userId);
        Integer userCheckinDays = checkinRecordMapper.selectCheckinDaysByPlanIdAndUserId(planId, userId);

        // 计算进度
        int totalDays = plan.getStartDate().until(plan.getEndDate()).getDays() + 1;
        int passedDays = plan.getStartDate().until(LocalDate.now()).getDays() + 1;
        if (passedDays > totalDays) passedDays = totalDays;

        // 构建返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("planId", plan.getPlanId());
        result.put("circleId", plan.getCircleId());
        result.put("name", plan.getName());
        result.put("description", plan.getDescription());
        result.put("startDate", plan.getStartDate());
        result.put("endDate", plan.getEndDate());
        result.put("totalDurationGoal", plan.getTotalDurationGoal());
        result.put("dailyDurationGoal", plan.getDailyDurationGoal());
        result.put("circleTotalGoal", plan.getCircleTotalGoal());
        result.put("minDurationPerCheckin", plan.getMinDurationPerCheckin());
        result.put("status", plan.getStatus());
        result.put("createdAt", plan.getCreatedAt());

        // 圈子统计
        result.put("circleStats", stats);

        // 用户个人统计
        result.put("userTotalDuration", userTotalDuration);
        result.put("userCheckinDays", userCheckinDays);

        // 进度信息
        result.put("totalDays", totalDays);
        result.put("passedDays", passedDays);
        result.put("progress", totalDays > 0 ? (double) passedDays / totalDays * 100 : 0);

        // 今日是否已打卡
        boolean todayChecked = checkinRecordMapper.existsByPlanIdAndUserIdAndDate(
                planId, userId, LocalDate.now().toString());
        result.put("todayChecked", todayChecked);

        return result;
    }

    @Override
    public List<Map<String, Object>> getCirclePlans(Long circleId, Long userId) {
        // 验证用户是圈子成员
        if (!circleService.isCircleMember(circleId, userId)) {
            throw BusinessException.forbidden("没有权限查看圈子计划");
        }

        // 获取圈子计划列表
        List<Plan> plans = planMapper.selectByCircleId(circleId);

        return plans.stream().map(plan -> {
            Map<String, Object> planInfo = new HashMap<>();
            planInfo.put("planId", plan.getPlanId());
            planInfo.put("name", plan.getName());
            planInfo.put("description", plan.getDescription());
            planInfo.put("startDate", plan.getStartDate());
            planInfo.put("endDate", plan.getEndDate());
            planInfo.put("status", plan.getStatus());
            planInfo.put("createdAt", plan.getCreatedAt());

            // 获取计划统计
            Map<String, Object> stats = checkinRecordMapper.selectStatsByPlanId(plan.getPlanId());
            planInfo.put("stats", stats);

            return planInfo;
        }).collect(Collectors.toList());
    }

    @Override
    public Plan getPlanById(Long planId) {
        Plan plan = planMapper.selectById(planId);
        if (plan == null) {
            throw BusinessException.notFound("计划不存在");
        }
        return plan;
    }

    @Override
    public int finishExpiredPlans() {
        // 查询所有过期的进行中计划
        List<Plan> expiredPlans = planMapper.selectExpiredPlans(LocalDate.now().toString());

        int count = 0;
        for (Plan plan : expiredPlans) {
            plan.setStatus(2); // 2-已结束
            plan.setUpdatedAt(LocalDateTime.now());
            planMapper.updateById(plan);
            count++;
            logger.info("结束过期计划: {}", plan.getPlanId());
        }

        return count;
    }

    @Override
    public Plan getActivePlan(Long circleId) {
        List<Plan> activePlans = planMapper.selectActiveByCircleId(circleId);
        return activePlans.isEmpty() ? null : activePlans.get(0);
    }
}