package com.fitness.checkin.controller;

import com.fitness.checkin.common.Result;
import com.fitness.checkin.dto.CheckinRequest;
import com.fitness.checkin.entity.CheckinRecord;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.service.CheckinService;
import com.fitness.checkin.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 打卡控制器
 * 处理打卡相关的请求
 * 
 * @author Kou
 * @version 1.0.0
 */
@RestController
@RequestMapping("/checkin")
public class CheckinController {

    private static final Logger logger = LoggerFactory.getLogger(CheckinController.class);

    private final CheckinService checkinService;
    private final UserService userService;

    public CheckinController(CheckinService checkinService, UserService userService) {
        this.checkinService = checkinService;
        this.userService = userService;
    }

    /**
     * 用户打卡
     * 
     * @param request     打卡请求
     * @param userDetails Spring Security用户详情
     * @return 打卡记录
     */
    @PostMapping
    public Result<?> checkin(@Valid @RequestBody CheckinRequest request,
                            @AuthenticationPrincipal UserDetails userDetails) {
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
    }

    /**
     * 获取用户打卡记录
     * 
     * @param planId      计划ID
     * @param page        页码
     * @param size        每页大小
     * @param userDetails Spring Security用户详情
     * @return 打卡记录列表
     */
    @GetMapping("/records/{planId}")
    public Result<?> getUserCheckinRecords(
            @PathVariable Long planId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<CheckinRecord> records = checkinService.getUserCheckinRecords(
                planId, user.getUserId(), page, size);
        return Result.success(records);
    }

    /**
     * 获取用户打卡统计
     * 
     * @param planId      计划ID
     * @param userDetails Spring Security用户详情
     * @return 打卡统计
     */
    @GetMapping("/stats/{planId}")
    public Result<?> getUserCheckinStats(
            @PathVariable Long planId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        Map<String, Object> stats = checkinService.getUserCheckinStats(
                planId, user.getUserId());
        return Result.success(stats);
    }

    /**
     * 获取计划的所有打卡记录
     * 
     * @param planId      计划ID
     * @param page        页码
     * @param size        每页大小
     * @param userDetails Spring Security用户详情
     * @return 打卡记录列表
     */
    @GetMapping("/plan/{planId}/records")
    public Result<?> getPlanCheckinRecords(
            @PathVariable Long planId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<CheckinRecord> records = checkinService.getPlanCheckinRecords(planId, page, size);
        return Result.success(records);
    }

    /**
     * 获取计划打卡统计
     * 
     * @param planId      计划ID
     * @param userDetails Spring Security用户详情
     * @return 打卡统计
     */
    @GetMapping("/plan/{planId}/stats")
    public Result<?> getPlanCheckinStats(
            @PathVariable Long planId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        Map<String, Object> stats = checkinService.getPlanCheckinStats(planId);
        return Result.success(stats);
    }

    /**
     * 获取计划每日打卡统计
     * 
     * @param planId      计划ID
     * @param startDate   开始日期
     * @param endDate     结束日期
     * @param userDetails Spring Security用户详情
     * @return 每日统计列表
     */
    @GetMapping("/plan/{planId}/daily-stats")
    public Result<?> getPlanDailyStats(
            @PathVariable Long planId,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<Map<String, Object>> stats = checkinService.getPlanDailyStats(
                planId, startDate, endDate);
        return Result.success(stats);
    }

    /**
     * 检查用户今日是否已打卡
     * 
     * @param planId      计划ID
     * @param userDetails Spring Security用户详情
     * @return 是否已打卡
     */
    @GetMapping("/check-today/{planId}")
    public Result<?> checkTodayCheckin(
            @PathVariable Long planId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        boolean hasChecked = checkinService.hasCheckedInToday(planId, user.getUserId());
        return Result.success(Map.of("hasChecked", hasChecked));
    }

    /**
     * 获取当前用户信息
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