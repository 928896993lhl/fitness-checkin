package com.fitness.checkin.task;

import com.fitness.checkin.entity.CheckinRecord;
import com.fitness.checkin.entity.Plan;
import com.fitness.checkin.mapper.CheckinRecordMapper;
import com.fitness.checkin.mapper.PlanMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

/**
 * 每日汇总定时任务
 * 每天20:00执行，生成每日打卡汇总
 * 
 * @author Kou
 * @version 1.0.0
 */
@Component
public class DailySummaryTask {

    private static final Logger logger = LoggerFactory.getLogger(DailySummaryTask.class);

    private final PlanMapper planMapper;
    private final CheckinRecordMapper checkinRecordMapper;

    public DailySummaryTask(PlanMapper planMapper, CheckinRecordMapper checkinRecordMapper) {
        this.planMapper = planMapper;
        this.checkinRecordMapper = checkinRecordMapper;
    }

    /**
     * 每日汇总任务
     * 每天20:00执行
     */
    @Scheduled(cron = "0 0 20 * * ?")
    public void executeDailySummary() {
        logger.info("开始执行每日汇总任务");

        try {
            // 获取所有进行中的计划
            List<Plan> activePlans = planMapper.selectAllActivePlans();

            for (Plan plan : activePlans) {
                try {
                    generateDailySummary(plan);
                } catch (Exception e) {
                    logger.error("计划 {} 每日汇总失败", plan.getPlanId(), e);
                }
            }

            logger.info("每日汇总任务完成，处理了 {} 个计划", activePlans.size());
        } catch (Exception e) {
            logger.error("每日汇总任务执行失败", e);
        }
    }

    /**
     * 生成单个计划的每日汇总
     * 
     * @param plan 计划
     */
    private void generateDailySummary(Plan plan) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        // 获取今日打卡统计
        Map<String, Object> todayStats = checkinRecordMapper.selectStatsByPlanId(plan.getPlanId());

        // 获取今日打卡用户数
        int todayCheckinUsers = todayStats.get("userCount") != null ? 
                ((Number) todayStats.get("userCount")).intValue() : 0;

        // 获取今日总时长
        int todayTotalDuration = todayStats.get("totalDuration") != null ? 
                ((Number) todayStats.get("totalDuration")).intValue() : 0;

        // 计算完成率
        double completionRate = 0;
        if (plan.getDailyDurationGoal() > 0) {
            completionRate = (double) todayTotalDuration / plan.getDailyDurationGoal() * 100;
        }

        // 记录日志（实际项目中可以发送通知）
        logger.info("计划 {} 今日汇总: 打卡人数={}, 总时长={}分钟, 完成率={}%", 
                plan.getPlanId(), todayCheckinUsers, todayTotalDuration, completionRate);

        // 这里可以添加发送通知的逻辑
        // 例如：发送微信模板消息、短信通知等
    }
}