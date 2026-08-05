package com.fitness.checkin.service.impl;

import com.fitness.checkin.common.BusinessException;
import com.fitness.checkin.entity.Circle;
import com.fitness.checkin.entity.CircleMember;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.mapper.CircleMapper;
import com.fitness.checkin.mapper.CircleMemberMapper;
import com.fitness.checkin.service.CircleService;
import com.fitness.checkin.service.UserService;
import org.apache.commons.lang3.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 圈子服务实现类
 * 实现圈子相关的业务逻辑
 * 
 * @author Kou
 * @version 1.0.0
 */
@Service
@Transactional
public class CircleServiceImpl implements CircleService {

    private static final Logger logger = LoggerFactory.getLogger(CircleServiceImpl.class);

    private final CircleMapper circleMapper;
    private final CircleMemberMapper circleMemberMapper;
    private final UserService userService;

    public CircleServiceImpl(CircleMapper circleMapper, 
                           CircleMemberMapper circleMemberMapper,
                           UserService userService) {
        this.circleMapper = circleMapper;
        this.circleMemberMapper = circleMemberMapper;
        this.userService = userService;
    }

    @Override
    public Circle createCircle(Long creatorId, String name, String description, Integer maxMembers) {
        // 验证用户存在
        userService.getUserById(creatorId);

        // 生成唯一邀请码
        String inviteCode = generateUniqueInviteCode();

        // 创建圈子
        Circle circle = new Circle();
        circle.setName(name);
        circle.setDescription(description != null ? description : "");
        circle.setCreatorId(creatorId);
        circle.setMaxMembers(maxMembers != null ? maxMembers : 50);
        circle.setInviteCode(inviteCode);
        circle.setStatus(1);
        circle.setCreatedAt(LocalDateTime.now());
        circle.setUpdatedAt(LocalDateTime.now());

        circleMapper.insert(circle);
        logger.info("创建圈子: {} - {}", circle.getCircleId(), name);

        // 将创建者添加为圈子成员（角色为创建者）
        CircleMember creatorMember = new CircleMember();
        creatorMember.setCircleId(circle.getCircleId());
        creatorMember.setUserId(creatorId);
        creatorMember.setJoinedAt(LocalDateTime.now());
        creatorMember.setRole(2); // 2-创建者

        circleMemberMapper.insert(creatorMember);
        logger.info("创建者 {} 加入圈子 {}", creatorId, circle.getCircleId());

        return circle;
    }

    @Override
    public CircleMember joinCircle(Long userId, String inviteCode) {
        // 验证用户存在
        userService.getUserById(userId);

        // 根据邀请码查找圈子
        Circle circle = circleMapper.selectByInviteCode(inviteCode);
        if (circle == null) {
            throw BusinessException.notFound("圈子不存在或邀请码无效");
        }

        // 检查圈子状态
        if (circle.getStatus() != 1) {
            throw BusinessException.badRequest("圈子已归档");
        }

        // 检查用户是否已经是成员
        if (circleMemberMapper.existsByCircleIdAndUserId(circle.getCircleId(), userId)) {
            throw BusinessException.conflict("已经是圈子成员");
        }

        // 检查圈子是否已满
        int currentMembers = circleMemberMapper.countByCircleId(circle.getCircleId());
        if (currentMembers >= circle.getMaxMembers()) {
            throw BusinessException.badRequest("圈子已满员");
        }

        // 添加成员
        CircleMember member = new CircleMember();
        member.setCircleId(circle.getCircleId());
        member.setUserId(userId);
        member.setJoinedAt(LocalDateTime.now());
        member.setRole(0); // 0-普通成员

        circleMemberMapper.insert(member);
        logger.info("用户 {} 加入圈子 {}", userId, circle.getCircleId());

        return member;
    }

    @Override
    public Map<String, Object> getCircleDetail(Long circleId, Long userId) {
        // 获取圈子信息
        Circle circle = getCircleById(circleId);

        // 检查用户是否是成员
        boolean isMember = circleMemberMapper.existsByCircleIdAndUserId(circleId, userId);
        if (!isMember) {
            throw BusinessException.forbidden("没有权限查看此圈子");
        }

        // 获取成员数量
        int memberCount = circleMemberMapper.countByCircleId(circleId);

        // 获取用户角色
        Integer role = circleMemberMapper.selectRoleByCircleIdAndUserId(circleId, userId);

        // 构建返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("circleId", circle.getCircleId());
        result.put("name", circle.getName());
        result.put("description", circle.getDescription());
        result.put("creatorId", circle.getCreatorId());
        result.put("maxMembers", circle.getMaxMembers());
        result.put("inviteCode", circle.getInviteCode());
        result.put("status", circle.getStatus());
        result.put("createdAt", circle.getCreatedAt());
        result.put("memberCount", memberCount);
        result.put("isMember", isMember);
        result.put("userRole", role);

        // 获取创建者信息
        User creator = userService.getUserById(circle.getCreatorId());
        Map<String, Object> creatorInfo = new HashMap<>();
        creatorInfo.put("userId", creator.getUserId());
        creatorInfo.put("nickname", creator.getNickname());
        creatorInfo.put("avatarUrl", creator.getAvatarUrl());
        result.put("creator", creatorInfo);

        return result;
    }

    @Override
    public List<Map<String, Object>> getCircleMembers(Long circleId) {
        // 获取圈子成员列表
        List<CircleMember> members = circleMemberMapper.selectByCircleId(circleId);

        // 获取每个成员的用户信息
        return members.stream().map(member -> {
            Map<String, Object> memberInfo = new HashMap<>();
            memberInfo.put("id", member.getId());
            memberInfo.put("circleId", member.getCircleId());
            memberInfo.put("userId", member.getUserId());
            memberInfo.put("joinedAt", member.getJoinedAt());
            memberInfo.put("role", member.getRole());

            // 获取用户信息
            User user = userService.getUserById(member.getUserId());
            memberInfo.put("nickname", user.getNickname());
            memberInfo.put("avatarUrl", user.getAvatarUrl());

            return memberInfo;
        }).collect(Collectors.toList());
    }

    @Override
    public List<Circle> getUserCircles(Long userId) {
        // 获取用户加入的圈子ID列表
        List<Long> circleIds = circleMemberMapper.selectCircleIdsByUserId(userId);
        if (circleIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 查询圈子信息
        return circleMapper.selectBatchIds(circleIds);
    }

    @Override
    public boolean isCircleMember(Long circleId, Long userId) {
        return circleMemberMapper.existsByCircleIdAndUserId(circleId, userId);
    }

    @Override
    public boolean isCircleAdmin(Long circleId, Long userId) {
        Integer role = circleMemberMapper.selectRoleByCircleIdAndUserId(circleId, userId);
        return role != null && role >= 1; // 1-管理员，2-创建者
    }

    @Override
    public Circle getCircleById(Long circleId) {
        Circle circle = circleMapper.selectById(circleId);
        if (circle == null) {
            throw BusinessException.notFound("圈子不存在");
        }
        return circle;
    }

    @Override
    public void archiveCircle(Long circleId, Long userId) {
        Circle circle = getCircleById(circleId);

        // 仅创建者可归档
        if (!circle.getCreatorId().equals(userId)) {
            throw BusinessException.forbidden("只有创建者可以归档圈子");
        }

        if (circle.getStatus() == 0) {
            throw BusinessException.badRequest("圈子已归档");
        }

        circle.setStatus(0); // 0-已归档
        circle.setUpdatedAt(LocalDateTime.now());
        circleMapper.updateById(circle);
        logger.info("圈子 {} 已归档，操作人 {}", circleId, userId);
    }

    @Override
    public void restoreCircle(Long circleId, Long userId) {
        Circle circle = getCircleById(circleId);

        // 仅创建者可恢复
        if (!circle.getCreatorId().equals(userId)) {
            throw BusinessException.forbidden("只有创建者可以恢复圈子");
        }

        if (circle.getStatus() == 1) {
            throw BusinessException.badRequest("圈子已是活跃状态");
        }

        circle.setStatus(1); // 1-活跃
        circle.setUpdatedAt(LocalDateTime.now());
        circleMapper.updateById(circle);
        logger.info("圈子 {} 已恢复，操作人 {}", circleId, userId);
    }

    /**
     * 生成唯一邀请码
     * 
     * @return 8位随机邀请码
     */
    private String generateUniqueInviteCode() {
        String inviteCode;
        do {
            inviteCode = RandomStringUtils.randomAlphanumeric(8).toUpperCase();
        } while (circleMapper.existsByInviteCode(inviteCode));
        return inviteCode;
    }
}