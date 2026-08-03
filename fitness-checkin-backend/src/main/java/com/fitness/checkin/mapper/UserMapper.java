package com.fitness.checkin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.fitness.checkin.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 用户Mapper接口
 * 提供用户数据的数据库操作
 * 
 * @author Kou
 * @version 1.0.0
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 根据openid查询用户
     * 
     * @param openid 微信openid
     * @return 用户实体
     */
    @Select("SELECT * FROM users WHERE openid = #{openid} LIMIT 1")
    User selectByOpenid(String openid);

    /**
     * 检查openid是否存在
     * 
     * @param openid 微信openid
     * @return 是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM users WHERE openid = #{openid}")
    boolean existsByOpenid(String openid);
}