package com.fitness.checkin.service.impl;

import com.fitness.checkin.constant.BadgeCode;
import com.fitness.checkin.entity.UserBadge;
import com.fitness.checkin.mapper.UserBadgeMapper;
import com.fitness.checkin.service.BadgeService;
import com.fitness.checkin.service.CheckinService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 徽章服务实现类
 * 实现徽章解锁判定、插入与查询。
 *
 * <p>依赖方向：BadgeService → CheckinService（单向），
 * CheckinServiceImpl 不注入 BadgeService，由 CheckinController 编排，避免循环依赖。</p>
 *
 * @author Kou
 * @version 1.0.0
 */
@Service
@Transactional
public class BadgeServiceImpl implements BadgeService {

    private static final Logger logger = LoggerFactory.getLogger(BadgeServiceImpl.class);

    private final UserBadgeMapper userBadgeMapper;
    private final CheckinService checkinService;

    public BadgeServiceImpl(UserBadgeMapper userBadgeMapper, CheckinService checkinService) {
        this.userBadgeMapper = userBadgeMapper;
        this.checkinService = checkinService;
    }

    @Override
    public List<Map<String, Object>> checkAndUnlock(Long userId, Map<String, Object> stats) {
        // 防御：stats 为空时自行取统计（Controller 编排时通常已传入）
        if (stats == null) {
            stats = checkinService.getUserCheckinStatsMine(userId);
        }

        // 已解锁徽章编码集合
        Set<String> unlockedCodes = new HashSet<>();
        List<UserBadge> existing = userBadgeMapper.selectByUserId(userId);
        if (existing != null) {
            for (UserBadge ub : existing) {
                unlockedCodes.add(ub.getBadgeCode());
            }
        }

        List<Map<String, Object>> newlyUnlocked = new ArrayList<>();
        for (BadgeCode badge : BadgeCode.values()) {
            if (unlockedCodes.contains(badge.getCode())) {
                continue;
            }
            if (!badge.isUnlocked(stats)) {
                continue;
            }

            UserBadge userBadge = new UserBadge();
            userBadge.setUserId(userId);
            userBadge.setBadgeCode(badge.getCode());
            userBadge.setUnlockedAt(LocalDateTime.now());
            int affected = userBadgeMapper.insertIgnore(userBadge);

            if (affected > 0) {
                Map<String, Object> item = new HashMap<>();
                item.put("code", badge.getCode());
                item.put("name", badge.getName());
                item.put("icon", badge.getIcon());
                newlyUnlocked.add(item);
                logger.info("用户 {} 解锁徽章: {} ({})", userId, badge.getName(), badge.getCode());
            }
        }
        return newlyUnlocked;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyBadges(Long userId) {
        Map<String, Object> stats = checkinService.getUserCheckinStatsMine(userId);

        Map<String, LocalDateTime> unlockedAtMap = new HashMap<>();
        List<UserBadge> existing = userBadgeMapper.selectByUserId(userId);
        if (existing != null) {
            for (UserBadge ub : existing) {
                unlockedAtMap.put(ub.getBadgeCode(), ub.getUnlockedAt());
            }
        }

        List<Map<String, Object>> badges = new ArrayList<>();
        for (BadgeCode badge : BadgeCode.values()) {
            LocalDateTime unlockedAt = unlockedAtMap.get(badge.getCode());
            String progressText = badge.progressText(stats);
            Map<String, Object> item = new HashMap<>();
            item.put("code", badge.getCode());
            item.put("name", badge.getName());
            item.put("icon", badge.getIcon());
            item.put("conditionText", badge.getConditionText());
            item.put("unlocked", unlockedAt != null);
            item.put("unlockedAt", unlockedAt);
            item.put("progressText", progressText);
            // 徽章扩展（r3）：category 分类 / sort 全局排序 / remainText 未解锁"还差 N 解锁"（已解锁为 null）
            item.put("category", badge.getCategory());
            item.put("sort", badge.getSort());
            item.put("remainText", unlockedAt != null ? null : BadgeCode.remainText(progressText));
            badges.add(item);
        }
        return badges;
    }
}
