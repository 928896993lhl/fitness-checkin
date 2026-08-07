package com.fitness.checkin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness.checkin.common.BusinessException;
import com.fitness.checkin.constant.BadgeCode;
import com.fitness.checkin.entity.CheckinRecord;
import com.fitness.checkin.entity.Circle;
import com.fitness.checkin.entity.Plan;
import com.fitness.checkin.mapper.CheckinRecordMapper;
import com.fitness.checkin.service.CheckinService;
import com.fitness.checkin.service.CircleService;
import com.fitness.checkin.service.PlanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 打卡服务实现类
 * 实现打卡相关的业务逻辑（宽松打卡：planId/circleId 均可空）
 * 
 * @author Kou
 * @version 1.0.0
 */
@Service
@Transactional
public class CheckinServiceImpl implements CheckinService {

    private static final Logger logger = LoggerFactory.getLogger(CheckinServiceImpl.class);

    /** 全局打卡时长上下限（分钟） */
    private static final int MIN_DURATION = 1;
    private static final int MAX_DURATION = 480;

    private final CheckinRecordMapper checkinRecordMapper;
    private final PlanService planService;
    private final CircleService circleService;

    public CheckinServiceImpl(CheckinRecordMapper checkinRecordMapper,
                             PlanService planService,
                             CircleService circleService) {
        this.checkinRecordMapper = checkinRecordMapper;
        this.planService = planService;
        this.circleService = circleService;
    }

    @Override
    public CheckinRecord checkin(Long planId, Long circleId, Long userId, Integer duration,
                                String exerciseType, String photoUrl, String remark) {
        // 1. 全局时长校验 1-480（DTO 已校验，此处防御性兜底）
        if (duration == null || duration < MIN_DURATION || duration > MAX_DURATION) {
            throw BusinessException.badRequest("打卡时长必须在" + MIN_DURATION + "-" + MAX_DURATION + "分钟之间");
        }

        // 2. planId 非空 → 原计划校验 + 圈子未归档校验；planId 空 → 宽松打卡跳过计划校验
        Long effectiveCircleId = circleId;
        if (planId != null) {
            Plan plan = planService.getPlanById(planId);

            // 验证计划状态
            if (plan.getStatus() != 1) {
                throw BusinessException.badRequest("计划未进行中");
            }

            // 验证打卡时长 >= 计划最低时长
            if (duration < plan.getMinDurationPerCheckin()) {
                throw BusinessException.badRequest("打卡时长不能少于" + plan.getMinDurationPerCheckin() + "分钟");
            }

            // 验证用户是圈子成员
            if (!circleService.isCircleMember(plan.getCircleId(), userId)) {
                throw BusinessException.forbidden("没有权限执行打卡操作");
            }

            // 校验计划所属圈子未归档
            Circle planCircle = circleService.getCircleById(plan.getCircleId());
            if (planCircle.getStatus() != 1) {
                throw BusinessException.badRequest("圈子已归档，无法打卡");
            }

            // planId 非空且 circleId 空 → 默认记 plan 所属圈子
            if (effectiveCircleId == null) {
                effectiveCircleId = plan.getCircleId();
            }
        }

        // 3. circleId 非空 → 校验用户是该圈成员
        if (effectiveCircleId != null && !circleService.isCircleMember(effectiveCircleId, userId)) {
            throw BusinessException.forbidden("您不是该圈子成员，无法打卡");
        }

        // 创建打卡记录
        CheckinRecord record = new CheckinRecord();
        record.setPlanId(planId);
        record.setCircleId(effectiveCircleId);
        record.setUserId(userId);
        record.setDuration(duration);
        record.setExerciseType(exerciseType);
        record.setPhotoUrl(photoUrl != null ? photoUrl : "");
        record.setRemark(remark != null ? remark : "");
        record.setCheckinTime(LocalDateTime.now());
        record.setCreatedAt(LocalDateTime.now());

        checkinRecordMapper.insert(record);
        logger.info("用户 {} 打卡: {} 分钟 (planId={}, circleId={})", userId, duration, planId, effectiveCircleId);

        return record;
    }

    @Override
    public Page<CheckinRecord> getUserCheckinRecords(Long planId, Long userId, int page, int size) {
        // 验证用户是圈子成员
        Plan plan = planService.getPlanById(planId);
        if (!circleService.isCircleMember(plan.getCircleId(), userId)) {
            throw BusinessException.forbidden("没有权限查看打卡记录");
        }

        // 分页查询
        Page<CheckinRecord> pageParam = new Page<>(page, size);
        QueryWrapper<CheckinRecord> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("plan_id", planId)
                   .eq("user_id", userId)
                   .orderByDesc("checkin_time");

        return checkinRecordMapper.selectPage(pageParam, queryWrapper);
    }

    @Override
    public Map<String, Object> getUserCheckinStats(Long planId, Long userId) {
        // 验证用户是圈子成员
        Plan plan = planService.getPlanById(planId);
        if (!circleService.isCircleMember(plan.getCircleId(), userId)) {
            throw BusinessException.forbidden("没有权限查看打卡统计");
        }

        // 获取用户统计
        Integer totalDuration = checkinRecordMapper.selectTotalDurationByPlanIdAndUserId(planId, userId);
        Integer checkinDays = checkinRecordMapper.selectCheckinDaysByPlanIdAndUserId(planId, userId);

        // 计算进度
        int totalDays = plan.getStartDate().until(plan.getEndDate()).getDays() + 1;
        int passedDays = plan.getStartDate().until(LocalDate.now()).getDays() + 1;
        if (passedDays > totalDays) passedDays = totalDays;

        // 构建返回结果
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDuration", totalDuration);
        stats.put("checkinDays", checkinDays);
        stats.put("totalDays", totalDays);
        stats.put("passedDays", passedDays);
        stats.put("completionRate", totalDays > 0 ? (double) checkinDays / totalDays * 100 : 0);

        // 今日是否已打卡
        boolean todayChecked = hasCheckedInToday(planId, userId);
        stats.put("todayChecked", todayChecked);

        return stats;
    }

    @Override
    public Map<String, Object> getUserCheckinStatsMine(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("todayDuration", checkinRecordMapper.selectTodayDurationByUserId(userId, LocalDate.now().toString()));
        stats.put("totalDuration", checkinRecordMapper.selectTotalDurationByUserId(userId));
        stats.put("checkinDays", checkinRecordMapper.selectCheckinDaysByUserId(userId));
        stats.put("totalCheckins", checkinRecordMapper.selectTotalCheckinsByUserId(userId));
        stats.put("currentStreak", calcCurrentStreak(userId));
        stats.put("completionRate", calcCompletionRate(userId));

        // 扩展：历史最长连续 + 运动类型分布 + 里程估算 + 消耗估算（徽章判定与运动生涯页共用口径）
        stats.put("longestStreak", calcLongestStreak(userId));
        List<Map<String, Object>> exerciseTypeBreakdown =
                checkinRecordMapper.selectExerciseTypeBreakdownByUserId(userId);
        stats.put("exerciseTypeBreakdown",
                exerciseTypeBreakdown != null ? exerciseTypeBreakdown : new ArrayList<>());
        stats.put("estimatedDistanceKm", BadgeCode.estimateDistanceKm(exerciseTypeBreakdown));
        // r3 新增：估算累计消耗（千卡），复用已查的 exerciseTypeBreakdown，零额外 SQL
        stats.put("estimatedKcal", BadgeCode.estimateKcal(exerciseTypeBreakdown));

        return stats;
    }

    @Override
    public Map<String, Object> getHeatmapMine(Long userId, int days) {
        // 天数截断：默认 365，下限 7，上限 365
        if (days < 7) {
            days = 7;
        }
        if (days > 365) {
            days = 365;
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(days - 1);

        List<Map<String, Object>> dayRows =
                checkinRecordMapper.selectHeatmapByUserId(userId, startDate.atStartOfDay());

        Map<String, Object> result = new HashMap<>();
        result.put("startDate", startDate.toString());
        result.put("endDate", today.toString());
        result.put("days", dayRows != null ? dayRows : new ArrayList<>());
        return result;
    }

    @Override
    public Map<String, Object> getHeatmapCircle(Long circleId, Long userId, int days) {
        // 权限：仅圈子成员可查，非成员 403（Controller 不得降级掩盖）
        if (!circleService.isCircleMember(circleId, userId)) {
            throw BusinessException.forbidden("您不是该圈子成员，无法查看圈子热力图");
        }

        // 天数截断：默认 365，下限 7，上限 365
        if (days < 7) {
            days = 7;
        }
        if (days > 365) {
            days = 365;
        }

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(days - 1);

        List<Map<String, Object>> dayRows =
                checkinRecordMapper.selectHeatmapByCircleId(circleId, startDate.atStartOfDay());

        Map<String, Object> result = new HashMap<>();
        result.put("circleId", circleId);
        result.put("startDate", startDate.toString());
        result.put("endDate", today.toString());
        result.put("days", dayRows != null ? dayRows : new ArrayList<>());
        return result;
    }

    @Override
    public Map<String, Object> getCircleCheckinStats(Long circleId, Long userId) {
        // 权限：仅圈子成员可查，非成员 403（Controller 不得降级掩盖）
        if (!circleService.isCircleMember(circleId, userId)) {
            throw BusinessException.forbidden("您不是该圈子成员，无法查看圈子统计");
        }

        Map<String, Object> circleStats = checkinRecordMapper.selectCircleStats(circleId);
        long totalCheckins = getLong(circleStats, "totalCheckins");
        long totalDuration = getLong(circleStats, "totalDuration");

        // 本周活跃：本周一 00:00 起的自然周（口径与热力图 days 无耦合）
        LocalDateTime weekStart = LocalDate.now().with(DayOfWeek.MONDAY).atStartOfDay();
        Integer activeMembers = checkinRecordMapper.selectActiveMembersByCircleId(circleId, weekStart);

        // 今日活跃：今日 00:00 起
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        Integer todayActiveCount = checkinRecordMapper.selectTodayActiveCountByCircleId(circleId, todayStart);

        Map<String, Object> result = new HashMap<>();
        result.put("circleId", circleId);
        result.put("totalDuration", totalDuration);
        result.put("totalCheckins", totalCheckins);
        result.put("activeMembers", activeMembers != null ? activeMembers : 0);
        result.put("avgDurationPerCheckin", totalCheckins > 0 ? Math.round((double) totalDuration / totalCheckins) : 0);
        result.put("todayActiveCount", todayActiveCount != null ? todayActiveCount : 0);
        return result;
    }

    @Override
    public Map<String, Object> getUserCheckinRecordsMine(Long userId, Long planId, String exerciseType,
                                                         String startDate, String endDate, int page, int size) {
        Page<CheckinRecord> pageParam = new Page<>(page, size);
        QueryWrapper<CheckinRecord> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("user_id", userId);

        if (planId != null) {
            queryWrapper.eq("plan_id", planId);
        }
        if (exerciseType != null && !exerciseType.isBlank()) {
            queryWrapper.eq("exercise_type", exerciseType);
        }
        if (startDate != null && !startDate.isBlank()) {
            try {
                queryWrapper.ge("checkin_time", LocalDate.parse(startDate).atStartOfDay());
            } catch (DateTimeParseException e) {
                throw BusinessException.badRequest("开始日期格式不正确");
            }
        }
        if (endDate != null && !endDate.isBlank()) {
            try {
                queryWrapper.le("checkin_time", LocalDate.parse(endDate).atTime(LocalTime.MAX));
            } catch (DateTimeParseException e) {
                throw BusinessException.badRequest("结束日期格式不正确");
            }
        }
        queryWrapper.orderByDesc("checkin_time");

        Page<CheckinRecord> result = checkinRecordMapper.selectPage(pageParam, queryWrapper);

        Map<String, Object> data = new HashMap<>();
        data.put("records", result.getRecords());
        data.put("total", result.getTotal());
        data.put("page", page);
        data.put("size", size);
        return data;
    }

    @Override
    public Page<CheckinRecord> getPlanCheckinRecords(Long planId, int page, int size) {
        // 分页查询
        Page<CheckinRecord> pageParam = new Page<>(page, size);
        QueryWrapper<CheckinRecord> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("plan_id", planId)
                   .orderByDesc("checkin_time");

        return checkinRecordMapper.selectPage(pageParam, queryWrapper);
    }

    @Override
    public Map<String, Object> getPlanCheckinStats(Long planId) {
        // 获取计划统计
        return checkinRecordMapper.selectStatsByPlanId(planId);
    }

    @Override
    public List<Map<String, Object>> getPlanDailyStats(Long planId, LocalDate startDate, LocalDate endDate) {
        // 转换为LocalDateTime
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        return checkinRecordMapper.selectDailyStatsByPlanId(planId, startDateTime, endDateTime);
    }

    @Override
    public boolean hasCheckedInToday(Long planId, Long userId) {
        return checkinRecordMapper.existsByPlanIdAndUserIdAndDate(
                planId, userId, LocalDate.now().toString());
    }

    /**
     * 计算当前连续打卡天数
     * 规则：从今天（若今天未打卡则从昨天）往前连续计数
     * 
     * @param userId 用户ID
     * @return 连续打卡天数
     */
    private int calcCurrentStreak(Long userId) {
        List<String> dateStrs = checkinRecordMapper.selectDistinctCheckinDatesByUserId(userId);
        if (dateStrs == null || dateStrs.isEmpty()) {
            return 0;
        }

        Set<LocalDate> dates = new HashSet<>();
        for (String dateStr : dateStrs) {
            try {
                dates.add(LocalDate.parse(dateStr));
            } catch (DateTimeParseException ignored) {
                // 忽略无法解析的日期
            }
        }

        LocalDate today = LocalDate.now();
        // 今天已打卡 → 从今天往前数；今天未打卡 → 从昨天往前数
        LocalDate anchor = dates.contains(today) ? today : today.minusDays(1);
        if (!dates.contains(anchor)) {
            return 0;
        }

        int streak = 0;
        LocalDate cursor = anchor;
        while (dates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    /**
     * 计算历史最长连续打卡天数
     * 规则：对全部去重打卡日期排序后，统计最长的连续（相邻日）天数
     *
     * @param userId 用户ID
     * @return 历史最长连续打卡天数
     */
    private int calcLongestStreak(Long userId) {
        List<String> dateStrs = checkinRecordMapper.selectDistinctCheckinDatesByUserId(userId);
        if (dateStrs == null || dateStrs.isEmpty()) {
            return 0;
        }

        Set<LocalDate> dates = new HashSet<>();
        for (String dateStr : dateStrs) {
            try {
                dates.add(LocalDate.parse(dateStr));
            } catch (DateTimeParseException ignored) {
                // 忽略无法解析的日期
            }
        }

        List<LocalDate> sortedDates = new ArrayList<>(dates);
        Collections.sort(sortedDates);

        int longest = 0;
        int current = 0;
        LocalDate prev = null;
        for (LocalDate date : sortedDates) {
            if (prev != null && date.equals(prev.plusDays(1))) {
                current++;
            } else {
                current = 1;
            }
            if (current > longest) {
                longest = current;
            }
            prev = date;
        }
        return longest;
    }

    /**
     * 计算完成率（仅针对进行中计划）
     * 口径：所有进行中计划的（用户打卡天数合计 ÷ 计划总天数合计）× 100；无进行中计划时为 0
     * 
     * @param userId 用户ID
     * @return 完成率（0-100）
     */
    private double calcCompletionRate(Long userId) {
        List<Circle> circles = circleService.getUserCircles(userId);
        if (circles == null || circles.isEmpty()) {
            return 0.0;
        }

        long checkinDaysSum = 0;
        long totalDaysSum = 0;
        for (Circle circle : circles) {
            Plan activePlan = planService.getActivePlan(circle.getCircleId());
            if (activePlan == null) {
                continue;
            }
            long totalDays = activePlan.getStartDate().until(activePlan.getEndDate()).getDays() + 1;
            if (totalDays <= 0) {
                continue;
            }
            Integer days = checkinRecordMapper.selectCheckinDaysByPlanIdAndUserId(activePlan.getPlanId(), userId);
            checkinDaysSum += days != null ? days : 0;
            totalDaysSum += totalDays;
        }

        return totalDaysSum > 0 ? (double) checkinDaysSum / totalDaysSum * 100 : 0.0;
    }

    /**
     * 安全读取长整型（兼容 Integer/Long/BigInteger 等 Number）
     *
     * @param map 数据 Map
     * @param key 键
     * @return 长整型值，缺失或非数字时为 0
     */
    private long getLong(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return 0L;
    }
}
