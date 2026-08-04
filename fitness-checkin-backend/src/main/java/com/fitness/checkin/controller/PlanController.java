package com.fitness.checkin.controller;

import com.fitness.checkin.common.Result;
import com.fitness.checkin.dto.CreatePlanRequest;
import com.fitness.checkin.entity.Plan;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.service.PlanService;
import com.fitness.checkin.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 计划控制器
 * 统一返回Result结构，查询为空时返回空集合
 */
@RestController
@RequestMapping("/plans")
public class PlanController {

    private static final Logger logger = LoggerFactory.getLogger(PlanController.class);

    private final PlanService planService;
    private final UserService userService;

    public PlanController(PlanService planService, UserService userService) {
        this.planService = planService;
        this.userService = userService;
    }

    /**
     * 创建计划
     */
    @PostMapping
    public Result<?> createPlan(@Valid @RequestBody CreatePlanRequest request,
                               @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Plan plan = planService.createPlan(
                    request.getCircleId(),
                    user.getUserId(),
                    request.getName(),
                    request.getDescription(),
                    request.getStartDate(),
                    request.getEndDate(),
                    request.getTotalDurationGoal(),
                    request.getDailyDurationGoal(),
                    request.getCircleTotalGoal(),
                    request.getMinDurationPerCheckin()
            );
            return Result.success(plan);
        } catch (Exception e) {
            logger.error("创建计划失败: {}", e.getMessage());
            return Result.error(500, e.getMessage());
        }
    }

    /**
     * 启动计划
     */
    @PostMapping("/{planId}/start")
    public Result<?> startPlan(@PathVariable Long planId,
                              @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Plan plan = planService.startPlan(planId, user.getUserId());
            return Result.success(plan);
        } catch (Exception e) {
            logger.error("启动计划失败: {}", e.getMessage());
            return Result.error(500, e.getMessage());
        }
    }

    /**
     * 获取计划详情
     */
    @GetMapping("/{planId}")
    public Result<?> getPlanDetail(@PathVariable Long planId,
                                  @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Map<String, Object> detail = planService.getPlanDetail(planId, user.getUserId());
            return Result.success(detail);
        } catch (Exception e) {
            logger.warn("获取计划详情失败: {}", e.getMessage());
            return Result.success(new HashMap<>());
        }
    }

    /**
     * 获取圈子的计划列表
     */
    @GetMapping("/circle/{circleId}")
    public Result<?> getCirclePlans(@PathVariable Long circleId,
                                   @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            List<Map<String, Object>> plans = planService.getCirclePlans(circleId, user.getUserId());
            return Result.success(plans != null ? plans : new ArrayList<>());
        } catch (Exception e) {
            logger.warn("获取圈子计划列表失败: {}", e.getMessage());
            return Result.success(new ArrayList<>());
        }
    }

    /**
     * 获取当前用户
     */
    private User getCurrentUser(UserDetails userDetails) {
        String openid = userDetails.getUsername();
        User user = userService.getUserByOpenid(openid);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        return user;
    }
}
