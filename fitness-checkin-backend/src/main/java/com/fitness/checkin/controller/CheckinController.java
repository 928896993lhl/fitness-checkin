package com.fitness.checkin.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness.checkin.common.BusinessException;
import com.fitness.checkin.common.Result;
import com.fitness.checkin.dto.CheckinRequest;
import com.fitness.checkin.entity.CheckinRecord;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.service.BadgeService;
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
    private final BadgeService badgeService;

    public CheckinController(CheckinService checkinService, UserService userService,
                             PlanService planService, BadgeService badgeService) {
        this.checkinService = checkinService;
        this.userService = userService;
        this.planService = planService;
        this.badgeService = badgeService;
    }

    /**
     * 用户打卡（宽松打卡：planId/circleId 均可空）
     * 打卡成功后由 Controller 编排徽章判定（避免 CheckinService↔BadgeService 循环依赖）
     */
    @PostMapping
    public Result<?> checkin(@Valid @RequestBody CheckinRequest request,
                            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            CheckinRecord record = checkinService.checkin(
                    request.getPlanId(),
                    request.getCircleId(),
                    user.getUserId(),
                    request.getDuration(),
                    request.getExerciseType(),
                    request.getPhotoUrl(),
                    request.getRemark()
            );

            // 徽章判定：先取统计（含本次打卡），再 checkAndUnlock，结果挂到记录瞬态字段
            // 徽章异常不影响打卡主流程，降级为空列表
            try {
                Map<String, Object> stats = checkinService.getUserCheckinStatsMine(user.getUserId());
                List<Map<String, Object>> newlyUnlocked = badgeService.checkAndUnlock(user.getUserId(), stats);
                record.setNewlyUnlockedBadges(newlyUnlocked != null ? newlyUnlocked : new ArrayList<>());
            } catch (Exception badgeEx) {
                logger.warn("徽章判定失败，忽略: {}", badgeEx.getMessage());
                record.setNewlyUnlockedBadges(new ArrayList<>());
            }

            return Result.success(record);
        } catch (Exception e) {
            logger.error("打卡失败: {}", e.getMessage());
            return Result.error(500, e.getMessage());
        }
    }

    /**
     * 获取我的活跃度热力图（按天聚合）
     */
    @GetMapping("/heatmap/mine")
    public Result<?> getHeatmapMine(@RequestParam(defaultValue = "365") int days,
                                    @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Map<String, Object> data = checkinService.getHeatmapMine(user.getUserId(), days);
            return Result.success(data);
        } catch (Exception e) {
            logger.warn("查询热力图失败，返回空数据: {}", e.getMessage());
            Map<String, Object> emptyData = new HashMap<>();
            emptyData.put("startDate", LocalDate.now().toString());
            emptyData.put("endDate", LocalDate.now().toString());
            emptyData.put("days", new ArrayList<>());
            return Result.success(emptyData);
        }
    }

    /**
     * 获取圈子活跃度热力图（圈子维度，按天聚合）
     * 权限：仅圈子成员可查，非成员 403（BusinessException 原样透出，不降级掩盖）
     */
    @GetMapping("/heatmap/circle/{circleId}")
    public Result<?> getHeatmapCircle(@PathVariable Long circleId,
                                      @RequestParam(defaultValue = "365") int days,
                                      @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Map<String, Object> data = checkinService.getHeatmapCircle(circleId, user.getUserId(), days);
            return Result.success(data);
        } catch (BusinessException e) {
            // 权限校验失败（403 等）必须透出，禁止降级为空结构掩盖
            logger.warn("查询圈子热力图被拒绝: {} - {}", e.getCode(), e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.warn("查询圈子热力图失败，返回空数据: {}", e.getMessage());
            Map<String, Object> emptyData = new HashMap<>();
            emptyData.put("circleId", circleId);
            emptyData.put("startDate", LocalDate.now().toString());
            emptyData.put("endDate", LocalDate.now().toString());
            emptyData.put("days", new ArrayList<>());
            return Result.success(emptyData);
        }
    }

    /**
     * 获取圈子打卡统计（圈子维度）
     * 权限：仅圈子成员可查，非成员 403（BusinessException 原样透出，不降级掩盖）
     */
    @GetMapping("/stats/circle/{circleId}")
    public Result<?> getCircleCheckinStats(@PathVariable Long circleId,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Map<String, Object> data = checkinService.getCircleCheckinStats(circleId, user.getUserId());
            return Result.success(data);
        } catch (BusinessException e) {
            // 权限校验失败（403 等）必须透出，禁止降级为空结构掩盖
            logger.warn("查询圈子统计被拒绝: {} - {}", e.getCode(), e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.warn("查询圈子统计失败，返回空统计: {}", e.getMessage());
            Map<String, Object> emptyData = new HashMap<>();
            emptyData.put("circleId", circleId);
            emptyData.put("totalDuration", 0);
            emptyData.put("totalCheckins", 0);
            emptyData.put("activeMembers", 0);
            emptyData.put("avgDurationPerCheckin", 0);
            emptyData.put("todayActiveCount", 0);
            return Result.success(emptyData);
        }
    }

    /**
     * 获取我的打卡统计（用户维度，跨计划/宽松打卡）
     */
    @GetMapping("/stats/mine")
    public Result<?> getUserCheckinStatsMine(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Map<String, Object> stats = checkinService.getUserCheckinStatsMine(user.getUserId());
            return Result.success(stats);
        } catch (Exception e) {
            logger.warn("查询我的打卡统计失败，返回空统计: {}", e.getMessage());
            return Result.success(buildEmptyMineStats());
        }
    }

    /**
     * 获取我的打卡记录（用户维度，分页 + 可选筛选）
     */
    @GetMapping("/records/mine")
    public Result<?> getUserCheckinRecordsMine(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false) String exerciseType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            Map<String, Object> data = checkinService.getUserCheckinRecordsMine(
                    user.getUserId(), planId, exerciseType, startDate, endDate, page, size);
            return Result.success(data);
        } catch (Exception e) {
            logger.warn("查询我的打卡记录失败，返回空列表: {}", e.getMessage());
            return Result.success(buildEmptyPageResult(page, size));
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
            Page<CheckinRecord> records = checkinService.getUserCheckinRecords(
                    planId, user.getUserId(), page, size);
            return Result.success(buildPageResult(records.getRecords(), records.getTotal(), page, size));
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
            Page<CheckinRecord> records = checkinService.getPlanCheckinRecords(planId, page, size);
            return Result.success(buildPageResult(records.getRecords(), records.getTotal(), page, size));
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
     * 构建分页结果（total 用数据库总数而非 records.size()）
     */
    private Map<String, Object> buildPageResult(List<?> records, long total, int page, int size) {
        Map<String, Object> data = new HashMap<>();
        data.put("records", records);
        data.put("total", total);
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
     * 构建我的空统计（对齐 /stats/mine 字段）
     */
    private Map<String, Object> buildEmptyMineStats() {
        Map<String, Object> data = new HashMap<>();
        data.put("todayDuration", 0);
        data.put("totalDuration", 0);
        data.put("checkinDays", 0);
        data.put("totalCheckins", 0);
        data.put("currentStreak", 0);
        data.put("completionRate", 0);
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
