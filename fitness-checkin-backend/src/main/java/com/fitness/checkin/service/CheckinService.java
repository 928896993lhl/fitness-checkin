package com.fitness.checkin.service;

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
     * 用户打卡
     * 
     * @param planId       计划ID
     * @param userId       用户ID
     * @param duration     运动时长（分钟）
     * @param exerciseType 运动类型
     * @param photoUrl     打卡照片URL
     * @param remark       备注
     * @return 打卡记录
     */
    CheckinRecord checkin(Long planId, Long userId, Integer duration, 
                         String exerciseType, String photoUrl, String remark);

    /**
     * 获取用户在计划中的打卡记录
     * 
     * @param planId 计划ID
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页大小
     * @return 打卡记录列表
     */
    List<CheckinRecord> getUserCheckinRecords(Long planId, Long userId, int page, int size);

    /**
     * 获取用户在计划中的打卡统计
     * 
     * @param planId 计划ID
     * @param userId 用户ID
     * @return 统计信息
     */
    Map<String, Object> getUserCheckinStats(Long planId, Long userId);

    /**
     * 获取计划的所有打卡记录
     * 
     * @param planId 计划ID
     * @param page   页码
     * @param size   每页大小
     * @return 打卡记录列表
     */
    List<CheckinRecord> getPlanCheckinRecords(Long planId, int page, int size);

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
}