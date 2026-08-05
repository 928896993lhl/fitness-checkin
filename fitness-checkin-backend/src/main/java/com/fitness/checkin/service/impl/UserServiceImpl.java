package com.fitness.checkin.service.impl;

import com.fitness.checkin.common.BusinessException;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.mapper.UserMapper;
import com.fitness.checkin.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 用户服务实现类
 * 实现用户相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
@Service
@Transactional
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserMapper userMapper;

    public UserServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public User getUserById(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw BusinessException.notFound("用户不存在");
        }
        return user;
    }

    @Override
    public User getUserByOpenid(String openid) {
        return userMapper.selectByOpenid(openid);
    }

    @Override
    public User createOrGetUser(String openid, String nickname, String avatarUrl) {
        // 检查用户是否已存在
        User existingUser = userMapper.selectByOpenid(openid);
        if (existingUser != null) {
            logger.debug("用户已存在: {}", openid);
            return existingUser;
        }

        // 创建新用户
        User newUser = new User();
        newUser.setOpenid(openid);
        newUser.setNickname(nickname != null ? nickname : "微信用户");
        newUser.setAvatarUrl(avatarUrl != null ? avatarUrl : "");
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());

        userMapper.insert(newUser);
        logger.info("创建新用户: {}", openid);

        return newUser;
    }

    @Override
    public User updateUser(Long userId, String nickname, String avatarUrl) {
        User user = getUserById(userId);

        // 空串判断改为 null 判断：
        // nickname 空串由 DTO @Size(2,20) 拦截，不会误放行；
        // avatarUrl 空串用于清空头像（需求：头像可清除）
        if (nickname != null) {
            user.setNickname(nickname);
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }
        user.setUpdatedAt(LocalDateTime.now());

        userMapper.updateById(user);
        logger.info("更新用户信息: {}", userId);

        return user;
    }

    @Override
    public boolean existsByOpenid(String openid) {
        return userMapper.existsByOpenid(openid);
    }
}