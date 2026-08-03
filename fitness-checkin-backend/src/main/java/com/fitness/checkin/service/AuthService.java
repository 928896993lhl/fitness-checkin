package com.fitness.checkin.service;

import java.util.Map;

/**
 * 认证服务接口
 * 提供微信登录认证相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
public interface AuthService {

    /**
     * 微信登录
     * 
     * @param code 微信登录code
     * @return 包含token和用户信息的Map
     */
    Map<String, Object> wxLogin(String code);

    /**
     * 获取用户信息
     * 
     * @param userId 用户ID
     * @return 用户信息Map
     */
    Map<String, Object> getUserInfo(Long userId);

    /**
     * 刷新token
     * 
     * @param userId 用户ID
     * @return 新的token
     */
    String refreshToken(Long userId);
}