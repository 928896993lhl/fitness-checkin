package com.fitness.checkin.service;

import com.fitness.checkin.entity.User;

/**
 * 用户服务接口
 * 提供用户相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
public interface UserService {

    /**
     * 根据用户ID获取用户信息
     * 
     * @param userId 用户ID
     * @return 用户实体
     */
    User getUserById(Long userId);

    /**
     * 根据openid获取用户信息
     * 
     * @param openid 微信openid
     * @return 用户实体
     */
    User getUserByOpenid(String openid);

    /**
     * 创建或获取用户
     * 如果用户不存在则创建新用户，否则返回现有用户
     * 
     * @param openid    微信openid
     * @param nickname  昵称
     * @param avatarUrl 头像URL
     * @return 用户实体
     */
    User createOrGetUser(String openid, String nickname, String avatarUrl);

    /**
     * 更新用户信息
     * 
     * @param userId    用户ID
     * @param nickname  昵称
     * @param avatarUrl 头像URL
     * @return 更新后的用户实体
     */
    User updateUser(Long userId, String nickname, String avatarUrl);

    /**
     * 检查用户是否存在
     * 
     * @param openid 微信openid
     * @return 是否存在
     */
    boolean existsByOpenid(String openid);
}