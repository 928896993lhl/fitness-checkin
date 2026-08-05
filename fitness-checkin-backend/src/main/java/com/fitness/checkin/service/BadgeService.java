package com.fitness.checkin.service;

import java.util.List;
import java.util.Map;

/**
 * 徽章服务接口
 * 提供徽章解锁判定与查询能力
 *
 * @author Kou
 * @version 1.0.0
 */
public interface BadgeService {

    /**
     * 校验并解锁新徽章
     * 对 8 个徽章逐一判定：未解锁且满足条件 → 插入 user_badges → 收集 newlyUnlocked 列表
     *
     * @param userId 用户ID
     * @param stats  用户统计 Map（含 totalCheckins/checkinDays/totalDuration/longestStreak/estimatedDistanceKm 等）
     * @return 本次新解锁徽章列表 [{code, name, icon}, ...]（可能为空列表）
     */
    List<Map<String, Object>> checkAndUnlock(Long userId, Map<String, Object> stats);

    /**
     * 获取我的全部徽章（8 条固定顺序）
     *
     * @param userId 用户ID
     * @return 徽章信息列表 [{code, name, icon, conditionText, unlocked, unlockedAt, progressText}, ...]
     */
    List<Map<String, Object>> getMyBadges(Long userId);
}
