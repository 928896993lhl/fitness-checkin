package com.fitness.checkin.controller;

import com.fitness.checkin.common.Result;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.service.BadgeService;
import com.fitness.checkin.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 徽章控制器
 * 提供徽章相关查询接口
 *
 * @author Kou
 * @version 1.0.0
 */
@RestController
@RequestMapping("/badges")
public class BadgeController {

    private static final Logger logger = LoggerFactory.getLogger(BadgeController.class);

    private final BadgeService badgeService;
    private final UserService userService;

    public BadgeController(BadgeService badgeService, UserService userService) {
        this.badgeService = badgeService;
        this.userService = userService;
    }

    /**
     * 获取我的徽章（8 条固定顺序，含解锁状态与进度文本）
     */
    @GetMapping("/mine")
    public Result<?> getMyBadges(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            User user = getCurrentUser(userDetails);
            List<Map<String, Object>> badges = badgeService.getMyBadges(user.getUserId());
            return Result.success(badges != null ? badges : new ArrayList<>());
        } catch (Exception e) {
            logger.warn("查询我的徽章失败，返回空列表: {}", e.getMessage());
            return Result.success(new ArrayList<>());
        }
    }

    /**
     * 获取当前用户
     */
    private User getCurrentUser(UserDetails userDetails) {
        String openid = userDetails.getUsername();
        User user = userService.getUserByOpenid(openid);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        return user;
    }
}
