package com.fitness.checkin.controller;

import com.fitness.checkin.common.Result;
import com.fitness.checkin.dto.CreateCircleRequest;
import com.fitness.checkin.dto.JoinCircleRequest;
import com.fitness.checkin.entity.Circle;
import com.fitness.checkin.entity.CircleMember;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.service.CircleService;
import com.fitness.checkin.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 圈子控制器
 * 处理圈子相关的请求
 * 
 * @author Kou
 * @version 1.0.0
 */
@RestController
@RequestMapping("/circles")
public class CircleController {

    private static final Logger logger = LoggerFactory.getLogger(CircleController.class);

    private final CircleService circleService;
    private final UserService userService;

    public CircleController(CircleService circleService, UserService userService) {
        this.circleService = circleService;
        this.userService = userService;
    }

    /**
     * 创建圈子
     * 
     * @param request     创建圈子请求
     * @param userDetails Spring Security用户详情
     * @return 创建的圈子
     */
    @PostMapping
    public Result<?> createCircle(@Valid @RequestBody CreateCircleRequest request,
                                 @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        Circle circle = circleService.createCircle(
                user.getUserId(),
                request.getName(),
                request.getDescription(),
                request.getMaxMembers()
        );
        return Result.success(circle);
    }

    /**
     * 加入圈子
     * 
     * @param request     加入圈子请求
     * @param userDetails Spring Security用户详情
     * @return 加入的成员信息
     */
    @PostMapping("/join")
    public Result<?> joinCircle(@Valid @RequestBody JoinCircleRequest request,
                               @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        CircleMember member = circleService.joinCircle(user.getUserId(), request.getInviteCode());
        return Result.success(member);
    }

    /**
     * 获取圈子详情
     * 
     * @param circleId    圈子ID
     * @param userDetails Spring Security用户详情
     * @return 圈子详情
     */
    @GetMapping("/{circleId}")
    public Result<?> getCircleDetail(@PathVariable Long circleId,
                                    @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        Map<String, Object> detail = circleService.getCircleDetail(circleId, user.getUserId());
        return Result.success(detail);
    }

    /**
     * 获取圈子成员列表
     * 
     * @param circleId    圈子ID
     * @param userDetails Spring Security用户详情
     * @return 成员列表
     */
    @GetMapping("/{circleId}/members")
    public Result<?> getCircleMembers(@PathVariable Long circleId,
                                     @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        // 验证用户是圈子成员
        if (!circleService.isCircleMember(circleId, user.getUserId())) {
            return Result.forbidden();
        }
        List<Map<String, Object>> members = circleService.getCircleMembers(circleId);
        return Result.success(members);
    }

    /**
     * 获取用户加入的圈子列表
     * 
     * @param userDetails Spring Security用户详情
     * @return 圈子列表
     */
    @GetMapping("/my")
    public Result<?> getUserCircles(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<Circle> circles = circleService.getUserCircles(user.getUserId());
        return Result.success(circles);
    }

    /**
     * 获取当前用户信息
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