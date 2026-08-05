package com.fitness.checkin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness.checkin.entity.CheckinRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 打卡记录Mapper接口
 * 提供打卡记录数据的数据库操作
 * 
 * @author Kou
 * @version 1.0.0
 */
@Mapper
public interface CheckinRecordMapper extends BaseMapper<CheckinRecord> {

    /**
     * 查询用户在计划中的打卡记录
     * 
     * @param planId 计划ID
     * @param userId 用户ID
     * @return 打卡记录列表
     */
    @Select("SELECT * FROM checkin_records WHERE plan_id = #{planId} AND user_id = #{userId} ORDER BY checkin_time DESC")
    List<CheckinRecord> selectByPlanIdAndUserId(@Param("planId") Long planId, @Param("userId") Long userId);

    /**
     * 查询用户在计划中的总打卡时长
     * 
     * @param planId 计划ID
     * @param userId 用户ID
     * @return 总时长（分钟）
     */
    @Select("SELECT COALESCE(SUM(duration), 0) FROM checkin_records WHERE plan_id = #{planId} AND user_id = #{userId}")
    Integer selectTotalDurationByPlanIdAndUserId(@Param("planId") Long planId, @Param("userId") Long userId);

    /**
     * 查询用户在计划中的打卡天数
     * 
     * @param planId 计划ID
     * @param userId 用户ID
     * @return 打卡天数
     */
    @Select("SELECT COUNT(DISTINCT DATE(checkin_time)) FROM checkin_records WHERE plan_id = #{planId} AND user_id = #{userId}")
    Integer selectCheckinDaysByPlanIdAndUserId(@Param("planId") Long planId, @Param("userId") Long userId);

    /**
     * 查询用户在指定日期是否已打卡
     * 
     * @param planId 计划ID
     * @param userId 用户ID
     * @param date   日期
     * @return 是否已打卡
     */
    @Select("SELECT COUNT(*) > 0 FROM checkin_records WHERE plan_id = #{planId} AND user_id = #{userId} AND DATE(checkin_time) = #{date}")
    boolean existsByPlanIdAndUserIdAndDate(@Param("planId") Long planId, @Param("userId") Long userId, @Param("date") String date);

    /**
     * 查询计划的总打卡时长
     * 
     * @param planId 计划ID
     * @return 总时长（分钟）
     */
    @Select("SELECT COALESCE(SUM(duration), 0) FROM checkin_records WHERE plan_id = #{planId}")
    Integer selectTotalDurationByPlanId(Long planId);

    /**
     * 查询计划的打卡统计
     * 
     * @param planId 计划ID
     * @return 统计信息
     */
    @Select("SELECT " +
            "COUNT(DISTINCT user_id) as userCount, " +
            "COUNT(*) as recordCount, " +
            "COALESCE(SUM(duration), 0) as totalDuration " +
            "FROM checkin_records WHERE plan_id = #{planId}")
    Map<String, Object> selectStatsByPlanId(Long planId);

    /**
     * 查询计划的每日打卡统计
     * 
     * @param planId 计划ID
     * @param startDate 开始日期
     * @param endDate   结束日期
     * @return 每日统计列表
     */
    @Select("SELECT " +
            "DATE(checkin_time) as date, " +
            "COUNT(DISTINCT user_id) as userCount, " +
            "COUNT(*) as recordCount, " +
            "COALESCE(SUM(duration), 0) as totalDuration " +
            "FROM checkin_records " +
            "WHERE plan_id = #{planId} AND checkin_time BETWEEN #{startDate} AND #{endDate} " +
            "GROUP BY DATE(checkin_time) " +
            "ORDER BY date ASC")
    List<Map<String, Object>> selectDailyStatsByPlanId(@Param("planId") Long planId, 
                                                      @Param("startDate") LocalDateTime startDate, 
                                                      @Param("endDate") LocalDateTime endDate);

    /**
     * 查询用户指定日期的总打卡时长（用户维度，跨计划/宽松打卡）
     * 
     * @param userId 用户ID
     * @param date   日期（yyyy-MM-dd）
     * @return 总时长（分钟）
     */
    @Select("SELECT COALESCE(SUM(duration), 0) FROM checkin_records WHERE user_id = #{userId} AND DATE(checkin_time) = #{date}")
    Integer selectTodayDurationByUserId(@Param("userId") Long userId, @Param("date") String date);

    /**
     * 查询用户总打卡时长（用户维度）
     * 
     * @param userId 用户ID
     * @return 总时长（分钟）
     */
    @Select("SELECT COALESCE(SUM(duration), 0) FROM checkin_records WHERE user_id = #{userId}")
    Integer selectTotalDurationByUserId(@Param("userId") Long userId);

    /**
     * 查询用户累计打卡天数（用户维度）
     * 
     * @param userId 用户ID
     * @return 打卡天数
     */
    @Select("SELECT COUNT(DISTINCT DATE(checkin_time)) FROM checkin_records WHERE user_id = #{userId}")
    Integer selectCheckinDaysByUserId(@Param("userId") Long userId);

    /**
     * 查询用户总打卡次数（用户维度）
     * 
     * @param userId 用户ID
     * @return 打卡次数
     */
    @Select("SELECT COUNT(*) FROM checkin_records WHERE user_id = #{userId}")
    Integer selectTotalCheckinsByUserId(@Param("userId") Long userId);

    /**
     * 查询用户全部打卡日期（去重、倒序，用于连续打卡 Java 计算）
     * 
     * @param userId 用户ID
     * @return 打卡日期列表（yyyy-MM-dd）
     */
    @Select("SELECT DISTINCT DATE_FORMAT(checkin_time, '%Y-%m-%d') " +
            "FROM checkin_records WHERE user_id = #{userId} " +
            "ORDER BY DATE_FORMAT(checkin_time, '%Y-%m-%d') DESC")
    List<String> selectDistinctCheckinDatesByUserId(@Param("userId") Long userId);
}