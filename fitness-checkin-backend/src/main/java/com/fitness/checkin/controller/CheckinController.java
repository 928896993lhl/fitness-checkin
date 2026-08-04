package com.fitness.checkin.controller;

import com.fitness.checkin.common.Result;
import com.fitness.checkin.dto.CheckinRequest;
import com.fitness.checkin.entity.CheckinRecord;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.service.CheckinService;
import com.fitness.checkin.service.UserService;
import com.fitness.checkin.service.PlanService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/**
 * 打卡控制器
 * 统一返回Result结构，查询为空时返回空集合而非报错
 */
@RestController
@RequestMapping("/checkin")
public class CheckinController {

    private static final Logger logger = LoggerFactory.getLogger(CheckinController.class);

    private final CheckinService checkinService;
    private final UserService userService;
    private final PlanService planService;

    public CheckinController(CheckinService checkinService, UserService userService, PlanService planService) {
        this.checkinService = checkinService;
        this.userService = userService;
        this.planService = planService;
    }

    /**
     * 用户打卡
     */
    @PostMapping
    public Result<?> checkin(@Valid @RequestBody CheckinRequest request,
                            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            CheckinRecord record = checkinService.checkin(
                    request.getPlanId(),
                    user.getUserId(),
                    request.getDuration(),
                    request.getExerciseType(),
                    request.getPhotoUrl(),
                    request.getRemark()
            );
            return Result.success(record);
        } catch (Exception e) {
            logger.error("打卡失败: {}", e.getMessage());
            return Result.error(500, e.getMessage());
        }
    }

    /**
     * 获取用户打卡记录 - 分页接口
     */
    @GetMapping("/records/{planId}")
    public Result<?> getUserCheckinRecords(
            @PathVariable Long planId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            List<CheckinRecord> records = checkinService.getUserCheckinRecords(
                    planId, user.getUserId(), page, size);
            return Result.success(buildPageResult(records, page, size));
        } catch (Exception e) {
            logger.warn("查询打卡记录失败，返回空列表: {}", e.getMessage());
            return Result.success(buildEmptyPageResult(page, size));
        }
    }

    /**
     * 获取用户打卡统计
     */
    @GetMapping("/stats/{planId}")
    public Result<?> getUserCheckinStats(
            @PathVariable Long planId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Map<String, Object> stats = checkinService.getUserCheckinStats(planId, user.getUserId());
            return Result.success(stats);
        } catch (Exception e) {
            logger.warn("查询打卡统计失败，返回空统计: {}", e.getMessage());
            return Result.success(buildEmptyStats());
        }
    }

    /**
     * 获取计划的打卡记录 - 分页接口
     */
    @GetMapping("/plan/{planId}/records")
    public Result<?> getPlanCheckinRecords(
            @PathVariable Long planId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            List<CheckinRecord> records = checkinService.getPlanCheckinRecords(planId, page, size);
            return Result.success(buildPageResult(records, page, size));
        } catch (Exception e) {
            logger.warn("查询计划打卡记录失败，返回空列表: {}", e.getMessage());
            return Result.success(buildEmptyPageResult(page, size));
        }
    }

    /**
     * 获取计划打卡统计
     */
    @GetMapping("/plan/{planId}/stats")
    public Result<?> getPlanCheckinStats(
            @PathVariable Long planId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Map<String, Object> stats = checkinService.getPlanCheckinStats(planId);
            return Result.success(stats);
        } catch (Exception e) {
            logger.warn("查询计划统计失败，返回空统计: {}", e.getMessage());
            return Result.success(buildEmptyStats());
        }
    }

    /**
     * 获取计划每日统计
     */
    @GetMapping("/plan/{planId}/daily-stats")
    public Result<?> getPlanDailyStats(
            @PathVariable Long planId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            if (date == null) {
                date = LocalDate.now();
            }
            Map<String, Object> stats = new HashMap<>();
            stats.put("date", date.toString());
            stats.put("records", checkinService.getPlanDailyStats(planId, date, date));
            return Result.success(stats);
        } catch (Exception e) {
            logger.warn("查询每日统计失败，返回空统计: {}", e.getMessage());
            Map<String, Object> emptyData = new HashMap<>();
            emptyData.put("date", LocalDate.now().toString());
            emptyData.put("totalCheckins", 0);
            emptyData.put("totalDuration", 0);
            emptyData.put("records", new ArrayList<>());
            return Result.success(emptyData);
        }
    }

    /**
     * 检查今日是否已打卡
     */
    @GetMapping("/check-today/{planId}")
    public Result<?> checkTodayCheckin(
            @PathVariable Long planId,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            boolean checked = checkinService.hasCheckedInToday(planId, user.getUserId());
            Map<String, Object> data = new HashMap<>();
            data.put("checked", checked);
            data.put("planId", planId);
            return Result.success(data);
        } catch (Exception e) {
            logger.warn("查询今日打卡失败，返回未打卡: {}", e.getMessage());
            Map<String, Object> data = new HashMap<>();
            data.put("checked", false);
            data.put("planId", planId);
            return Result.success(data);
        }
    }

    /**
     * 构建分页结果
     */
    private Map<String, Object> buildPageResult(List<?> records, int page, int size) {
        Map<String, Object> data = new HashMap<>();
        data.put("records", records);
        data.put("total", records.size());
        data.put("page", page);
        data.put("size", size);
        return data;
    }

    /**
     * 构建空分页结果
     */
    private Map<String, Object> buildEmptyPageResult(int page, int size) {
        Map<String, Object> data = new HashMap<>();
        data.put("records", new ArrayList<>());
        data.put("total", 0);
        data.put("page", page);
        data.put("size", size);
        return data;
    }

    /**
     * 构建空统计
     */
    private Map<String, Object> buildEmptyStats() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalDuration", 0);
        data.put("checkinDays", 0);
        data.put("totalDays", 0);
        data.put("passedDays", 0);
        data.put("progress", 0);
        data.put("totalCheckins", 0);
        data.put("totalMembers", 0);
        return data;
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
