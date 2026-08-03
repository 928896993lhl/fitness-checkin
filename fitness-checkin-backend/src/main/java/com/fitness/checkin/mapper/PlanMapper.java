package com.fitness.checkin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness.checkin.entity.Plan;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 计划Mapper接口
 * 提供计划数据的数据库操作
 * 
 * @author Kou
 * @version 1.0.0
 */
@Mapper
public interface PlanMapper extends BaseMapper<Plan> {

    /**
     * 查询圈子的计划列表
     * 
     * @param circleId 圈子ID
     * @return 计划列表
     */
    @Select("SELECT * FROM plans WHERE circle_id = #{circleId} ORDER BY created_at DESC")
    List<Plan> selectByCircleId(Long circleId);

    /**
     * 查询圈子的进行中计划
     * 
     * @param circleId 圈子ID
     * @return 计划列表
     */
    @Select("SELECT * FROM plans WHERE circle_id = #{circleId} AND status = 1 ORDER BY start_date ASC")
    List<Plan> selectActiveByCircleId(Long circleId);

    /**
     * 查询需要结束的计划
     * 
     * @param date 当前日期
     * @return 计划列表
     */
    @Select("SELECT * FROM plans WHERE status = 1 AND end_date < #{date}")
    List<Plan> selectExpiredPlans(String date);

    /**
     * 查询所有进行中的计划
     * 
     * @return 计划列表
     */
    @Select("SELECT * FROM plans WHERE status = 1 ORDER BY start_date ASC")
    List<Plan> selectAllActivePlans();

    /**
     * 查询圈子的进行中计划数量
     * 
     * @param circleId 圈子ID
     * @return 计划数量
     */
    @Select("SELECT COUNT(*) FROM plans WHERE circle_id = #{circleId} AND status = 1")
    int countActiveByCircleId(Long circleId);
}