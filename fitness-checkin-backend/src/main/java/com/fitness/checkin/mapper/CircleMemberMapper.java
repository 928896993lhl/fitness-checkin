package com.fitness.checkin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness.checkin.entity.CircleMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 圈子成员Mapper接口
 * 提供圈子成员数据的数据库操作
 * 
 * @author Kou
 * @version 1.0.0
 */
@Mapper
public interface CircleMemberMapper extends BaseMapper<CircleMember> {

    /**
     * 查询圈子成员列表
     * 
     * @param circleId 圈子ID
     * @return 成员列表
     */
    @Select("SELECT * FROM circle_members WHERE circle_id = #{circleId} ORDER BY joined_at ASC")
    List<CircleMember> selectByCircleId(Long circleId);

    /**
     * 查询用户加入的圈子ID列表
     * 
     * @param userId 用户ID
     * @return 圈子ID列表
     */
    @Select("SELECT circle_id FROM circle_members WHERE user_id = #{userId}")
    List<Long> selectCircleIdsByUserId(Long userId);

    /**
     * 检查用户是否是圈子成员
     * 
     * @param circleId 圈子ID
     * @param userId   用户ID
     * @return 是否是成员
     */
    @Select("SELECT COUNT(*) > 0 FROM circle_members WHERE circle_id = #{circleId} AND user_id = #{userId}")
    boolean existsByCircleIdAndUserId(@Param("circleId") Long circleId, @Param("userId") Long userId);

    /**
     * 查询用户在圈子中的角色
     * 
     * @param circleId 圈子ID
     * @param userId   用户ID
     * @return 角色值
     */
    @Select("SELECT role FROM circle_members WHERE circle_id = #{circleId} AND user_id = #{userId} LIMIT 1")
    Integer selectRoleByCircleIdAndUserId(@Param("circleId") Long circleId, @Param("userId") Long userId);

    /**
     * 查询圈子成员数量
     * 
     * @param circleId 圈子ID
     * @return 成员数量
     */
    @Select("SELECT COUNT(*) FROM circle_members WHERE circle_id = #{circleId}")
    int countByCircleId(Long circleId);
}