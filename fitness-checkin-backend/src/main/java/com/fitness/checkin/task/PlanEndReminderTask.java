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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * 计划结束提醒定时任务
 * 在计划结束前2天提醒未完成目标的成员
 * 
 * @author Kou
 * @version 1.0.0
 */
@Component
public class PlanEndReminderTask {

    private static final Logger logger = LoggerFactory.getLogger(PlanEndReminderTask.class);

    private final PlanMapper planMapper;
    private final CheckinRecordMapper checkinRecordMapper;

    public PlanEndReminderTask(PlanMapper planMapper, CheckinRecordMapper checkinRecordMapper) {
        this.planMapper = planMapper;
        this.checkinRecordMapper = checkinRecordMapper;
    }

    /**
     * 计划结束提醒任务
     * 每天10:00执行
     */
    @Scheduled(cron = "0 0 10 * * ?")
    public void executePlanEndReminder() {
        logger.info("开始执行计划结束提醒任务");

        try {
            // 获取所有进行中的计划
            List<Plan> activePlans = planMapper.selectAllActivePlans();

            LocalDate today = LocalDate.now();

            for (Plan plan : activePlans) {
                try {
                    // 计算距离结束的天数
                    long daysUntilEnd = ChronoUnit.DAYS.between(today, plan.getEndDate());

                    // 如果距离结束还有2天，发送提醒
                    if (daysUntilEnd == 2) {
                        sendPlanEndReminder(plan);
                    }
                } catch (Exception e) {
                    logger.error("计划 {} 结束提醒失败", plan.getPlanId(), e);
                }
            }

            logger.info("计划结束提醒任务完成");
        } catch (Exception e) {
            logger.error("计划结束提醒任务执行失败", e);
        }
    }

    /**
     * 发送计划结束提醒
     * 
     * @param plan 计划
     */
    private void sendPlanEndReminder(Plan plan) {
        // 获取计划统计信息
        Map<String, Object> stats = checkinRecordMapper.selectStatsByPlanId(plan.getPlanId());

        // 获取总打卡人数
        int totalUsers = stats.get("userCount") != null ? 
                ((Number) stats.get("userCount")).intValue() : 0;

        // 获取总时长
        int totalDuration = stats.get("totalDuration") != null ? 
                ((Number) stats.get("totalDuration")).intValue() : 0;

        // 计算完成率
        double completionRate = 0;
        if (plan.getTotalDurationGoal() > 0) {
            completionRate = (double) totalDuration / plan.getTotalDurationGoal() * 100;
        }

        // 记录日志（实际项目中可以发送通知）
        logger.info("计划 {} 即将结束提醒: 距离结束还有2天, 总打卡人数={}, 总时长={}分钟, 完成率={}%", 
                plan.getPlanId(), totalUsers, totalDuration, completionRate);

        // 这里可以添加发送通知的逻辑
        // 例如：发送微信模板消息、短信通知等
        // 可以针对未完成目标的成员发送个性化提醒
    }
}