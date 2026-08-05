package com.fitness.checkin.controller;

import com.fitness.checkin.common.Result;
import com.fitness.checkin.dto.LoginRequest;
import com.fitness.checkin.dto.UpdateUserInfoRequest;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.service.AuthService;
import com.fitness.checkin.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 认证控制器
 * 处理微信登录和用户信息相关的请求
 * 
 * @author Kou
 * @version 1.0.0
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    /**
     * 微信登录
     * 
     * @param request 登录请求
     * @return 登录结果（包含token和用户信息）
     */
    @PostMapping("/login")
    public Result<?> wxLogin(@Valid @RequestBody LoginRequest request) {
        logger.info("微信登录请求: {}", request.getCode());
        Map<String, Object> result = authService.wxLogin(request.getCode());
        return Result.success(result);
    }

    /**
     * 获取当前用户信息
     * 
     * @param userDetails Spring Security用户详情
     * @return 用户信息
     */
    @GetMapping("/userinfo")
    public Result<?> getUserInfo(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return Result.unauthorized();
        }

        String openid = userDetails.getUsername();
        User user = userService.getUserByOpenid(openid);
        if (user == null) {
            return Result.notFound();
        }

        return Result.success(authService.getUserInfo(user.getUserId()));
    }

    /**
     * 更新当前用户信息（部分字段：nickname / avatarUrl 至少一个）
     * avatarUrl 传空字符串表示清空头像
     * 
     * @param request     更新请求
     * @param userDetails Spring Security用户详情
     * @return 更新后的用户信息（与 GET /auth/userinfo 形状一致）
     */
    @PutMapping("/userinfo")
    public Result<?> updateUserInfo(@Valid @RequestBody UpdateUserInfoRequest request,
                                    @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return Result.unauthorized();
        }

        // 至少一个字段非空，否则 400
        if (request.getNickname() == null && request.getAvatarUrl() == null) {
            return Result.badRequest("至少提供一个需要修改的字段");
        }

        String openid = userDetails.getUsername();
        User user = userService.getUserByOpenid(openid);
        if (user == null) {
            return Result.notFound();
        }

        User updated = userService.updateUser(user.getUserId(), request.getNickname(), request.getAvatarUrl());
        return Result.success(authService.getUserInfo(updated.getUserId()));
    }

    /**
     * 刷新token
     * 
     * @param userDetails Spring Security用户详情
     * @return 新的token
     */
    @PostMapping("/refresh-token")
    public Result<?> refreshToken(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return Result.unauthorized();
        }

        String openid = userDetails.getUsername();
        User user = userService.getUserByOpenid(openid);
        if (user == null) {
            return Result.notFound();
        }

        String newToken = authService.refreshToken(user.getUserId());
        return Result.success(Map.of("token", newToken));
    }
}