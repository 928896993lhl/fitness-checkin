package com.fitness.checkin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness.checkin.entity.UserBadge;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 用户徽章Mapper接口
 * 提供 user_badges 表的数据操作
 *
 * @author Kou
 * @version 1.0.0
 */
@Mapper
public interface UserBadgeMapper extends BaseMapper<UserBadge> {

    /**
     * 查询用户已解锁的徽章记录
     *
     * @param userId 用户ID
     * @return 徽章解锁记录列表
     */
    @Select("SELECT * FROM user_badges WHERE user_id = #{userId} ORDER BY badge_code ASC")
    List<UserBadge> selectByUserId(@Param("userId") Long userId);

    /**
     * 忽略重复插入徽章解锁记录
     * 复合主键(user_id, badge_code)冲突时静默忽略，避免重复解锁
     *
     * @param userBadge 徽章解锁记录
     * @return 影响行数（0 表示已存在被忽略）
     */
    @Insert("INSERT IGNORE INTO user_badges (user_id, badge_code, unlocked_at) " +
            "VALUES (#{userId}, #{badgeCode}, #{unlockedAt})")
    int insertIgnore(UserBadge userBadge);
}
