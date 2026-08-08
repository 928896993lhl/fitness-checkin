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
     * r5：新增 totalMemberDays（全员打卡人天，同人同日去重），供圈子整体进度副文本展示
     * 
     * @param planId 计划ID
     * @return 统计信息 {userCount, recordCount, totalDuration, totalMemberDays}
     */
    @Select("SELECT " +
            "COUNT(DISTINCT user_id) as userCount, " +
            "COUNT(*) as recordCount, " +
            "COALESCE(SUM(duration), 0) as totalDuration, " +
            "COUNT(DISTINCT user_id, DATE_FORMAT(checkin_time, '%Y-%m-%d')) as totalMemberDays " +
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

    /**
     * 查询用户运动类型分布（用户维度，跨计划/宽松打卡）
     * 
     * @param userId 用户ID
     * @return 运动类型分布列表 [{type, duration}, ...]
     */
    @Select("SELECT exercise_type AS type, COALESCE(SUM(duration), 0) AS duration " +
            "FROM checkin_records WHERE user_id = #{userId} " +
            "GROUP BY exercise_type")
    List<Map<String, Object>> selectExerciseTypeBreakdownByUserId(@Param("userId") Long userId);

    /**
     * 查询用户热力图数据（按天聚合，用户维度）
     * 仅返回有打卡记录的日期
     * 
     * @param userId    用户ID
     * @param startDate 起始时间（含）
     * @return 按天聚合列表 [{date, minutes, count}, ...]
     */
    @Select("SELECT DATE_FORMAT(checkin_time, '%Y-%m-%d') AS date, COALESCE(SUM(duration), 0) AS minutes, COUNT(*) AS count " +
            "FROM checkin_records WHERE user_id = #{userId} AND checkin_time >= #{startDate} " +
            "GROUP BY DATE_FORMAT(checkin_time, '%Y-%m-%d') " +
            "ORDER BY date ASC")
    List<Map<String, Object>> selectHeatmapByUserId(@Param("userId") Long userId,
                                                    @Param("startDate") LocalDateTime startDate);

    /**
     * 查询圈子热力图数据（按天聚合，圈子维度）
     * 仅返回有打卡记录的日期；count=当日去重打卡人数，totalMinutes=当日总分钟
     *
     * @param circleId  圈子ID
     * @param startDate 起始时间（含）
     * @return 按天聚合列表 [{date, count, totalMinutes}, ...]
     */
    @Select("SELECT DATE_FORMAT(checkin_time, '%Y-%m-%d') AS date, " +
            "COUNT(DISTINCT user_id) AS count, " +
            "COALESCE(SUM(duration), 0) AS totalMinutes " +
            "FROM checkin_records WHERE circle_id = #{circleId} AND checkin_time >= #{startDate} " +
            "GROUP BY DATE_FORMAT(checkin_time, '%Y-%m-%d') " +
            "ORDER BY date ASC")
    List<Map<String, Object>> selectHeatmapByCircleId(@Param("circleId") Long circleId,
                                                      @Param("startDate") LocalDateTime startDate);

    /**
     * 查询圈子累计打卡统计（圈子维度）
     *
     * @param circleId 圈子ID
     * @return {totalCheckins, totalDuration}
     */
    @Select("SELECT COUNT(*) AS totalCheckins, COALESCE(SUM(duration), 0) AS totalDuration " +
            "FROM checkin_records WHERE circle_id = #{circleId}")
    Map<String, Object> selectCircleStats(@Param("circleId") Long circleId);

    /**
     * 查询圈子本周活跃人数（本周一 00:00 起去重打卡用户数，圈子维度）
     *
     * @param circleId  圈子ID
     * @param weekStart 本周起始时间（含）
     * @return 本周去重打卡用户数
     */
    @Select("SELECT COUNT(DISTINCT user_id) FROM checkin_records " +
            "WHERE circle_id = #{circleId} AND checkin_time >= #{weekStart}")
    Integer selectActiveMembersByCircleId(@Param("circleId") Long circleId,
                                          @Param("weekStart") LocalDateTime weekStart);

    /**
     * 查询圈子今日活跃人数（今日 00:00 起去重打卡用户数，圈子维度）
     *
     * @param circleId   圈子ID
     * @param todayStart 今日起始时间（含）
     * @return 今日去重打卡用户数
     */
    @Select("SELECT COUNT(DISTINCT user_id) FROM checkin_records " +
            "WHERE circle_id = #{circleId} AND checkin_time >= #{todayStart}")
    Integer selectTodayActiveCountByCircleId(@Param("circleId") Long circleId,
                                             @Param("todayStart") LocalDateTime todayStart);

    /**
     * 圈子×成员批量聚合（一次 SQL 取回所有成员在该圈子的总时长/次数/天数）
     *
     * @param circleId 圈子ID
     * @return 聚合列表 [{userId, totalDuration, totalCheckins, checkinDays}, ...]
     */
    @Select("SELECT user_id AS userId, " +
            "COALESCE(SUM(duration), 0) AS totalDuration, " +
            "COUNT(*) AS totalCheckins, " +
            "COUNT(DISTINCT DATE_FORMAT(checkin_time, '%Y-%m-%d')) AS checkinDays " +
            "FROM checkin_records WHERE circle_id = #{circleId} " +
            "GROUP BY user_id")
    List<Map<String, Object>> selectCircleMemberAggByCircleId(@Param("circleId") Long circleId);

    /**
     * 圈子×成员×计划 打卡天数（用于计算已完成计划数）
     *
     * @param circleId 圈子ID
     * @return 计划打卡天数列表 [{userId, planId, checkinDays}, ...]
     */
    @Select("SELECT user_id AS userId, plan_id AS planId, " +
            "COUNT(DISTINCT DATE_FORMAT(checkin_time, '%Y-%m-%d')) AS checkinDays " +
            "FROM checkin_records " +
            "WHERE circle_id = #{circleId} AND plan_id IS NOT NULL " +
            "GROUP BY user_id, plan_id")
    List<Map<String, Object>> selectCircleMemberPlanDaysByCircleId(@Param("circleId") Long circleId);

    /**
     * 查询圈子内各成员在指定时间范围内的去重打卡天数（不区分是否绑定计划）
     * 宽松打卡（plan_id 为 null）同样计入，用于"当前进行中计划"进度统计
     *
     * @param circleId 圈子ID
     * @param start    时间范围起始（含）
     * @param end      时间范围结束（不含）
     * @return 打卡天数列表 [{userId, checkinDays}, ...]
     */
    @Select("SELECT user_id AS userId, " +
            "COUNT(DISTINCT DATE_FORMAT(checkin_time, '%Y-%m-%d')) AS checkinDays " +
            "FROM checkin_records " +
            "WHERE circle_id = #{circleId} AND checkin_time >= #{start} AND checkin_time < #{end} " +
            "GROUP BY user_id")
    List<Map<String, Object>> selectCircleMemberDaysInRange(@Param("circleId") Long circleId,
                                                            @Param("start") LocalDateTime start,
                                                            @Param("end") LocalDateTime end);
}