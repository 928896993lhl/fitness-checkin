package com.fitness.checkin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness.checkin.common.BusinessException;
import com.fitness.checkin.entity.CheckinRecord;
import com.fitness.checkin.entity.Plan;
import com.fitness.checkin.mapper.CheckinRecordMapper;
import com.fitness.checkin.service.CheckinService;
import com.fitness.checkin.service.CircleService;
import com.fitness.checkin.service.PlanService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 打卡服务实现类
 * 实现打卡相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
@Service
@Transactional
public class CheckinServiceImpl implements CheckinService {

    private static final Logger logger = LoggerFactory.getLogger(CheckinServiceImpl.class);

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
    public CheckinRecord checkin(Long planId, Long userId, Integer duration,
                                String exerciseType, String photoUrl, String remark) {
        // 获取计划信息
        Plan plan = planService.getPlanById(planId);

        // 验证用户是圈子成员
        if (!circleService.isCircleMember(plan.getCircleId(), userId)) {
            throw BusinessException.forbidden("没有权限执行打卡操作");
        }

        // 验证计划状态
        if (plan.getStatus() != 1) {
            throw BusinessException.badRequest("计划未进行中");
        }

        // 验证打卡时长
        if (duration < plan.getMinDurationPerCheckin()) {
            throw BusinessException.badRequest("打卡时长不能少于" + plan.getMinDurationPerCheckin() + "分钟");
        }

        // 检查今日是否已打卡（可选：允许一天多次打卡）
        // 这里允许一天多次打卡，但可以添加限制

        // 创建打卡记录
        CheckinRecord record = new CheckinRecord();
        record.setPlanId(planId);
        record.setUserId(userId);
        record.setDuration(duration);
        record.setExerciseType(exerciseType);
        record.setPhotoUrl(photoUrl != null ? photoUrl : "");
        record.setRemark(remark != null ? remark : "");
        record.setCheckinTime(LocalDateTime.now());
        record.setCreatedAt(LocalDateTime.now());

        checkinRecordMapper.insert(record);
        logger.info("用户 {} 在计划 {} 打卡: {} 分钟", userId, planId, duration);

        return record;
    }

    @Override
    public List<CheckinRecord> getUserCheckinRecords(Long planId, Long userId, int page, int size) {
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

        return checkinRecordMapper.selectPage(pageParam, queryWrapper).getRecords();
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
    public List<CheckinRecord> getPlanCheckinRecords(Long planId, int page, int size) {
        // 分页查询
        Page<CheckinRecord> pageParam = new Page<>(page, size);
        QueryWrapper<CheckinRecord> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("plan_id", planId)
                   .orderByDesc("checkin_time");

        return checkinRecordMapper.selectPage(pageParam, queryWrapper).getRecords();
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
}