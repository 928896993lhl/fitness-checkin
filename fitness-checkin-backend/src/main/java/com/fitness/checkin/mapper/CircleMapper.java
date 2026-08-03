package com.fitness.checkin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness.checkin.entity.Circle;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 圈子Mapper接口
 * 提供圈子数据的数据库操作
 * 
 * @author Kou
 * @version 1.0.0
 */
@Mapper
public interface CircleMapper extends BaseMapper<Circle> {

    /**
     * 根据邀请码查询圈子
     * 
     * @param inviteCode 邀请码
     * @return 圈子实体
     */
    @Select("SELECT * FROM circles WHERE invite_code = #{inviteCode} AND status = 1 LIMIT 1")
    Circle selectByInviteCode(String inviteCode);

    /**
     * 查询用户创建的圈子
     * 
     * @param creatorId 创建者用户ID
     * @return 圈子列表
     */
    @Select("SELECT * FROM circles WHERE creator_id = #{creatorId} AND status = 1 ORDER BY created_at DESC")
    List<Circle> selectByCreatorId(Long creatorId);

    /**
     * 检查邀请码是否存在
     * 
     * @param inviteCode 邀请码
     * @return 是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM circles WHERE invite_code = #{inviteCode}")
    boolean existsByInviteCode(String inviteCode);
}