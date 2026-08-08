package com.fitness.checkin.service.impl;

import com.fitness.checkin.common.BusinessException;
import com.fitness.checkin.entity.Circle;
import com.fitness.checkin.entity.CircleMember;
import com.fitness.checkin.entity.Plan;
import com.fitness.checkin.entity.User;
import com.fitness.checkin.mapper.CircleMapper;
import com.fitness.checkin.mapper.CircleMemberMapper;
import com.fitness.checkin.mapper.CheckinRecordMapper;
import com.fitness.checkin.mapper.PlanMapper;
import com.fitness.checkin.service.CircleService;
import com.fitness.checkin.service.UserService;
import org.apache.commons.lang3.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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
    private final CheckinRecordMapper checkinRecordMapper;
    private final PlanMapper planMapper;
    private final UserService userService;

    public CircleServiceImpl(CircleMapper circleMapper,
                           CircleMemberMapper circleMemberMapper,
                           CheckinRecordMapper checkinRecordMapper,
                           PlanMapper planMapper,
                           UserService userService) {
        this.circleMapper = circleMapper;
        this.circleMemberMapper = circleMemberMapper;
        this.checkinRecordMapper = checkinRecordMapper;
        this.planMapper = planMapper;
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

        // 同事务生成初始计划（类级 @Transactional：圈子/成员/初始计划三插入同事务）
        // 直插 PlanMapper，避免注入 PlanService 造成 CircleService↔PlanService 循环引用（Boot 3 默认禁止）
        planMapper.insert(buildInitialPlan(circle));
        logger.info("圈子 {} 已生成初始计划", circle.getCircleId());

        // 创建者本人即圈子当前唯一成员
        circle.setMemberCount(1);

        return circle;
    }

    /**
     * 构建圈子初始计划（固定值，唯一来源）
     * name=`{圈子名} · 7天挑战`、startDate=当天、endDate=+6天、status=0
     *
     * @param circle 圈子实体（须已生成 circleId）
     * @return 初始计划实体
     */
    private Plan buildInitialPlan(Circle circle) {
        LocalDate today = LocalDate.now();
        Plan plan = new Plan();
        plan.setCircleId(circle.getCircleId());
        plan.setName(circle.getName() + " · 7天挑战");
        plan.setDescription("系统生成的初始计划，可在圈子详情中调整后启动");
        plan.setStartDate(today);
        plan.setEndDate(today.plusDays(6));
        plan.setTotalDurationGoal(210);
        plan.setDailyDurationGoal(30);
        plan.setCircleTotalGoal(420);
        plan.setMinDurationPerCheckin(10);
        plan.setStatus(0); // 0-未开始
        plan.setCreatedAt(LocalDateTime.now());
        plan.setUpdatedAt(LocalDateTime.now());
        return plan;
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

        // 批量聚合（3 条固定 SQL，避免逐成员 N+1）：
        // 1) 圈子×成员打卡聚合（总时长/次数/天数）2) 圈子×成员×计划打卡天数 3) 圈子计划列表
        List<Map<String, Object>> aggRows = checkinRecordMapper.selectCircleMemberAggByCircleId(circleId);
        List<Map<String, Object>> planDayRows = checkinRecordMapper.selectCircleMemberPlanDaysByCircleId(circleId);
        List<Plan> fetchedPlans = planMapper.selectByCircleId(circleId);
        final List<Plan> plans = fetchedPlans != null ? fetchedPlans : Collections.emptyList();

        Map<Long, Map<String, Object>> aggMap = toAggMap(aggRows);
        Map<Long, Map<Long, Integer>> planDays = toPlanDaysMap(planDayRows);

        // 当前进行中计划：status=1 且 startDate 最早（业务假设一个圈子至多 1 个进行中计划）
        Plan activePlan = plans.stream()
                .filter(p -> p.getStatus() != null && p.getStatus() == 1)
                .min(Comparator.comparing(Plan::getStartDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);

        // 获取每个成员的用户信息，并附加圈子维度运动进展统计（向后兼容，仅新增 stats 键）
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

            // r4：成员运动进展统计（圈子维度）
            memberInfo.put("stats", buildMemberStats(member.getUserId(), aggMap, planDays, plans, activePlan));

            return memberInfo;
        }).collect(Collectors.toList());
    }

    /**
     * 组装单个成员的运动进展统计（圈子维度）
     * 口径（全部限定在圈内：checkin_records.circle_id = 圈子ID AND user_id = 成员ID）：
     * - totalDuration / totalCheckins / checkinDays：来自圈子×成员聚合，无记录为 0
     * - currentPlanProgress：该成员在"当前进行中计划"的打卡天数 / (endDate-startDate+1) × 100，
     *   四舍五入保留 1 位小数并 clamp 0~100；无进行中计划为 0
     * - completedPlans：该圈 status=2 已结束计划中、该成员有打卡记录的去重计划数
     * - totalFinishedPlans：该圈 status=2 已结束计划总数（前端展示"已完成 X/X 计划"分母）
     *
     * @param userId      成员用户ID
     * @param aggMap      圈子×成员聚合：userId -> {totalDuration,totalCheckins,checkinDays}
     * @param planDays    圈子×成员×计划打卡天数：userId -> (planId -> checkinDays)
     * @param plans       圈子计划列表（含 status/startDate/endDate）
     * @param activePlan  当前进行中计划（status=1 且 startDate 最早），可能为 null
     * @return stats Map
     */
    private Map<String, Object> buildMemberStats(Long userId,
                                                 Map<Long, Map<String, Object>> aggMap,
                                                 Map<Long, Map<Long, Integer>> planDays,
                                                 List<Plan> plans,
                                                 Plan activePlan) {
        Map<String, Object> stats = new HashMap<>();
        Map<String, Object> agg = aggMap.get(userId);

        // 基础聚合：该圈总时长/打卡次数/打卡天数，无记录为 0
        double totalDuration = agg == null ? 0d : toDouble(agg.get("totalDuration"));
        int totalCheckins = agg == null ? 0 : toInt(agg.get("totalCheckins"));
        int checkinDays = agg == null ? 0 : toInt(agg.get("checkinDays"));
        stats.put("totalDuration", (long) totalDuration);
        stats.put("totalCheckins", totalCheckins);
        stats.put("checkinDays", checkinDays);

        // 当前进行中计划完成率（口径与 getUserCheckinStats 完全一致：打卡天数 / 计划总天数 × 100）
        if (activePlan != null && activePlan.getStartDate() != null && activePlan.getEndDate() != null) {
            stats.put("currentPlanId", activePlan.getPlanId());
            stats.put("currentPlanName", activePlan.getName());
            long totalDays = ChronoUnit.DAYS.between(activePlan.getStartDate(), activePlan.getEndDate()) + 1;
            int days = planDays.getOrDefault(userId, Collections.emptyMap())
                    .getOrDefault(activePlan.getPlanId(), 0);
            double progress = totalDays > 0 ? round1(days * 100.0 / totalDays) : 0d;
            stats.put("currentPlanProgress", clamp(progress, 0d, 100d));
        } else {
            stats.put("currentPlanId", null);
            stats.put("currentPlanName", null);
            stats.put("currentPlanProgress", 0d);
        }

        // 已完成计划数 + 圈子已结束计划总数
        int completedPlans = 0;
        int totalFinishedPlans = 0;
        if (plans != null) {
            Map<Long, Integer> memberPlanDays = planDays.getOrDefault(userId, Collections.emptyMap());
            for (Plan plan : plans) {
                if (plan.getStatus() != null && plan.getStatus() == 2) {
                    totalFinishedPlans++;
                    if (memberPlanDays.containsKey(plan.getPlanId())) {
                        completedPlans++;
                    }
                }
            }
        }
        stats.put("completedPlans", completedPlans);
        stats.put("totalFinishedPlans", totalFinishedPlans);

        return stats;
    }

    /**
     * 圈子×成员聚合行 -> Map<userId, row>（key 统一转 Long，规避 MySQL 返回类型差异）
     *
     * @param aggRows 聚合行列表
     * @return userId -> 聚合行
     */
    private Map<Long, Map<String, Object>> toAggMap(List<Map<String, Object>> aggRows) {
        Map<Long, Map<String, Object>> aggMap = new HashMap<>();
        if (aggRows == null) {
            return aggMap;
        }
        for (Map<String, Object> row : aggRows) {
            Object userIdObj = row.get("userId");
            if (userIdObj == null) {
                continue;
            }
            aggMap.put(Long.valueOf(userIdObj.toString()), row);
        }
        return aggMap;
    }

    /**
     * 圈子×成员×计划打卡天数行 -> Map<userId, Map<planId, checkinDays>>
     *
     * @param planDayRows 计划打卡天数行列表
     * @return 两级嵌套 Map
     */
    private Map<Long, Map<Long, Integer>> toPlanDaysMap(List<Map<String, Object>> planDayRows) {
        Map<Long, Map<Long, Integer>> planDays = new HashMap<>();
        if (planDayRows == null) {
            return planDays;
        }
        for (Map<String, Object> row : planDayRows) {
            Object userIdObj = row.get("userId");
            Object planIdObj = row.get("planId");
            if (userIdObj == null || planIdObj == null) {
                continue;
            }
            Long userId = Long.valueOf(userIdObj.toString());
            Long planId = Long.valueOf(planIdObj.toString());
            planDays.computeIfAbsent(userId, k -> new HashMap<>()).put(planId, toInt(row.get("checkinDays")));
        }
        return planDays;
    }

    /**
     * Object -> int（MySQL COUNT/SUM 可能返回 Long/BigDecimal/Integer）
     *
     * @param value 数值对象
     * @return int 值，null 为 0
     */
    private int toInt(Object value) {
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return Integer.parseInt(value.toString());
    }

    /**
     * Object -> double（MySQL SUM 可能返回 BigDecimal）
     *
     * @param value 数值对象
     * @return double 值，null 为 0
     */
    private double toDouble(Object value) {
        if (value == null) {
            return 0d;
        }
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return Double.parseDouble(value.toString());
    }

    /**
     * 四舍五入保留 1 位小数
     *
     * @param value 原始值
     * @return 保留 1 位小数的值
     */
    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    /**
     * 数值 clamp 到 [min, max]
     *
     * @param value 原始值
     * @param min   下限
     * @param max   上限
     * @return clamp 后的值
     */
    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    @Override
    public List<Circle> getUserCircles(Long userId) {
        // 获取用户加入的圈子ID列表
        List<Long> circleIds = circleMemberMapper.selectCircleIdsByUserId(userId);
        if (circleIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 查询圈子信息
        List<Circle> circles = circleMapper.selectBatchIds(circleIds);

        // 附加成员数量（瞬态字段），避免前端逐圈请求造成 N+1
        for (Circle circle : circles) {
            circle.setMemberCount(circleMemberMapper.countByCircleId(circle.getCircleId()));
        }

        return circles;
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