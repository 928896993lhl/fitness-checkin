package com.fitness.checkin.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitness.checkin.common.BusinessException;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.service.AuthService;
import com.fitness.checkin.service.UserService;
import com.fitness.checkin.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 认证服务实现类
 * 实现微信登录认证相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Value("${wechat.appid}")
    private String appid;

    @Value("${wechat.secret}")
    private String secret;

    @Value("${wechat.api-url}")
    private String apiUrl;

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public AuthServiceImpl(UserService userService, JwtUtil jwtUtil, 
                          ObjectMapper objectMapper, RestTemplate restTemplate) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    @Override
    public Map<String, Object> wxLogin(String code) {
        try {
            // 调用微信API获取openid
            String url = String.format("%s?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                    apiUrl, appid, secret, code);

            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, null, String.class);
            JsonNode jsonNode = objectMapper.readTree(response.getBody());

            // 检查是否有错误
            if (jsonNode.has("errcode") && jsonNode.get("errcode").asInt() != 0) {
                String errMsg = jsonNode.has("errmsg") ? jsonNode.get("errmsg").asText() : "未知错误";
                logger.error("微信登录失败: {}", errMsg);
                throw BusinessException.badRequest("微信登录失败: " + errMsg);
            }

            // 获取openid
            String openid = jsonNode.get("openid").asText();

            // 创建或获取用户
            User user = userService.createOrGetUser(openid, null, null);

            // 生成JWT令牌
            String token = jwtUtil.generateToken(openid);

            // 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            result.put("userId", user.getUserId());
            result.put("openid", openid);
            result.put("nickname", user.getNickname());
            result.put("avatarUrl", user.getAvatarUrl());

            logger.info("用户登录成功: {}", openid);
            return result;

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            logger.error("微信登录异常", e);
            throw BusinessException.error("微信登录失败");
        }
    }

    @Override
    public Map<String, Object> getUserInfo(Long userId) {
        User user = userService.getUserById(userId);

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("userId", user.getUserId());
        userInfo.put("openid", user.getOpenid());
        userInfo.put("nickname", user.getNickname());
        userInfo.put("avatarUrl", user.getAvatarUrl());
        userInfo.put("createdAt", user.getCreatedAt());

        return userInfo;
    }

    @Override
    public String refreshToken(Long userId) {
        User user = userService.getUserById(userId);
        return jwtUtil.generateToken(user.getOpenid());
    }
}