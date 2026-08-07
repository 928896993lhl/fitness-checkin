package com.fitness.checkin.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fitness.checkin.entity.CheckinRecord;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 打卡服务接口
 * 提供打卡相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
public interface CheckinService {

    /**
     * 用户打卡（宽松打卡：planId/circleId 均可空）
     * 
     * @param planId       计划ID（可空）
     * @param circleId     圈子ID（可空）
     * @param userId       用户ID
     * @param duration     运动时长（分钟，全局 1-480）
     * @param exerciseType 运动类型
     * @param photoUrl     打卡照片URL
     * @param remark       备注
     * @return 打卡记录
     */
    CheckinRecord checkin(Long planId, Long circleId, Long userId, Integer duration,
                         String exerciseType, String photoUrl, String remark);

    /**
     * 获取用户在计划中的打卡记录
     * 
     * @param planId 计划ID
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页大小
     * @return 分页打卡记录（Page 实现 List，total 用 getTotal()）
     */
    Page<CheckinRecord> getUserCheckinRecords(Long planId, Long userId, int page, int size);

    /**
     * 获取用户在计划中的打卡统计
     * 
     * @param planId 计划ID
     * @param userId 用户ID
     * @return 统计信息
     */
    Map<String, Object> getUserCheckinStats(Long planId, Long userId);

    /**
     * 获取我的打卡统计（用户维度，跨计划/宽松打卡）
     * 
     * @param userId 用户ID
     * @return {todayDuration, totalDuration, checkinDays, totalCheckins, currentStreak, completionRate,
     *          longestStreak, exerciseTypeBreakdown, estimatedDistanceKm}
     */
    Map<String, Object> getUserCheckinStatsMine(Long userId);

    /**
     * 获取我的打卡记录（用户维度，分页 + 可选筛选）
     * 
     * @param userId       用户ID
     * @param planId       计划ID（可空）
     * @param exerciseType 运动类型（可空）
     * @param startDate    开始日期 yyyy-MM-dd（可空）
     * @param endDate      结束日期 yyyy-MM-dd（可空）
     * @param page         页码
     * @param size         每页大小
     * @return {records, total, page, size}
     */
    Map<String, Object> getUserCheckinRecordsMine(Long userId, Long planId, String exerciseType,
                                                  String startDate, String endDate, int page, int size);

    /**
     * 获取计划的所有打卡记录
     * 
     * @param planId 计划ID
     * @param page   页码
     * @param size   每页大小
     * @return 分页打卡记录（Page 实现 List，total 用 getTotal()）
     */
    Page<CheckinRecord> getPlanCheckinRecords(Long planId, int page, int size);

    /**
     * 获取计划的打卡统计
     * 
     * @param planId 计划ID
     * @return 统计信息
     */
    Map<String, Object> getPlanCheckinStats(Long planId);

    /**
     * 获取计划的每日打卡统计
     * 
     * @param planId    计划ID
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 每日统计列表
     */
    List<Map<String, Object>> getPlanDailyStats(Long planId, LocalDate startDate, LocalDate endDate);

    /**
     * 检查用户今日是否已打卡
     * 
     * @param planId 计划ID
     * @param userId 用户ID
     * @return 是否已打卡
     */
    boolean hasCheckedInToday(Long planId, Long userId);

    /**
     * 获取我的活跃度热力图（用户维度，按天聚合）
     * 
     * @param userId 用户ID
     * @param days   天数（默认365，下限7，上限365，超界截断）
     * @return {startDate, endDate, days:[{date, minutes, count}]}（days 仅含有打卡记录的日期）
     */
    Map<String, Object> getHeatmapMine(Long userId, int days);

    /**
     * 获取圈子活跃度热力图（圈子维度，按天聚合）
     * 权限：仅圈子成员可查，非成员抛 BusinessException.forbidden（403）
     * 
     * @param circleId 圈子ID
     * @param userId   当前用户ID
     * @param days     天数（默认365，下限7，上限365，超界截断）
     * @return {circleId, startDate, endDate, days:[{date, count, totalMinutes}]}（days 仅含有打卡记录的日期）
     */
    Map<String, Object> getHeatmapCircle(Long circleId, Long userId, int days);

    /**
     * 获取圈子打卡统计（圈子维度）
     * 权限：仅圈子成员可查，非成员抛 BusinessException.forbidden（403）
     * 
     * @param circleId 圈子ID
     * @param userId   当前用户ID
     * @return {circleId, totalDuration, totalCheckins, activeMembers, avgDurationPerCheckin, todayActiveCount}
     */
    Map<String, Object> getCircleCheckinStats(Long circleId, Long userId);
}
