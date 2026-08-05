package com.fitness.checkin.constant;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 徽章编码枚举
 * 集中管理 8 个徽章的定义（code/name/icon/conditionText）、解锁判定与进度文本。
 *
 * <p>stats 约定（Map 键）：totalCheckins / checkinDays / totalDuration / longestStreak /
 * estimatedDistanceKm / exerciseTypeBreakdown（List&lt;Map&gt;，元素含 type、duration）。</p>
 *
 * <p>里程系数表（km/h）：running 8 / walking 5 / cycling 15 / swimming 3 / 其余 0，
 * 与前端 EXERCISE_SPEED_KMH 必须保持同步（见 system_design_r2 §8）。</p>
 *
 * @author Kou
 * @version 1.0.0
 */
public enum BadgeCode {

    /**
     * 初次打卡：累计打卡 1 次
     */
    FIRST_CHECKIN("first_checkin", "初次打卡", "🎉", "累计打卡 1 次") {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "totalCheckins") >= 1;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "totalCheckins") + "/1次";
        }
    },

    /**
     * 坚持7天：累计打卡 7 天
     */
    DAYS_7("days_7", "坚持7天", "📅", "累计打卡 7 天") {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "checkinDays") >= 7;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "checkinDays") + "/7天";
        }
    },

    /**
     * 坚持30天：累计打卡 30 天
     */
    DAYS_30("days_30", "坚持30天", "🗓️", "累计打卡 30 天") {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "checkinDays") >= 30;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "checkinDays") + "/30天";
        }
    },

    /**
     * 百日坚持：累计打卡 100 天
     */
    DAYS_100("days_100", "百日坚持", "🏆", "累计打卡 100 天") {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "checkinDays") >= 100;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "checkinDays") + "/100天";
        }
    },

    /**
     * 千分俱乐部：累计运动 1000 分钟
     */
    MINUTES_1000("minutes_1000", "千分俱乐部", "⏱️", "累计运动 1000 分钟") {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "totalDuration") >= 1000;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "totalDuration") + "/1000分钟";
        }
    },

    /**
     * 连续7天：最长连续打卡 7 天
     */
    STREAK_7("streak_7", "连续7天", "🔥", "最长连续打卡 7 天") {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "longestStreak") >= 7;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "longestStreak") + "/7天";
        }
    },

    /**
     * 连续30天：最长连续打卡 30 天
     */
    STREAK_30("streak_30", "连续30天", "🌟", "最长连续打卡 30 天") {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "longestStreak") >= 30;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "longestStreak") + "/30天";
        }
    },

    /**
     * 里程达人：累计运动里程 50 公里
     */
    DISTANCE_50("distance_50", "里程达人", "🚴", "累计运动里程 50 公里") {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return estimateDistanceKmFromStats(stats) >= 50;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return Math.round(estimateDistanceKmFromStats(stats)) + "/50公里";
        }
    };

    /** 徽章编码 */
    private final String code;

    /** 徽章名称 */
    private final String name;

    /** 徽章图标（emoji） */
    private final String icon;

    /** 解锁条件描述文本 */
    private final String conditionText;

    BadgeCode(String code, String name, String icon, String conditionText) {
        this.code = code;
        this.name = name;
        this.icon = icon;
        this.conditionText = conditionText;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getIcon() {
        return icon;
    }

    public String getConditionText() {
        return conditionText;
    }

    /** 里程系数表（km/h）：running 8 / walking 5 / cycling 15 / swimming 3，其余 0 */
    private static final Map<String, Double> EXERCISE_SPEED_KMH = new HashMap<>();

    static {
        EXERCISE_SPEED_KMH.put("running", 8.0);
        EXERCISE_SPEED_KMH.put("walking", 5.0);
        EXERCISE_SPEED_KMH.put("cycling", 15.0);
        EXERCISE_SPEED_KMH.put("swimming", 3.0);
    }

    /**
     * 获取运动类型对应速度系数（km/h），未列入的类型系数为 0
     *
     * @param type 运动类型
     * @return 速度系数
     */
    private static double speedKmh(String type) {
        return EXERCISE_SPEED_KMH.getOrDefault(type == null ? "" : type, 0.0);
    }

    /**
     * 根据运动类型分布估算累计里程（公里）
     * 口径：Σ(duration / 60 × 系数)，系数见 EXERCISE_SPEED_KMH
     *
     * @param exerciseTypeBreakdown 运动类型分布 [{type, duration}, ...]
     * @return 估算里程（公里）
     */
    public static double estimateDistanceKm(List<Map<String, Object>> exerciseTypeBreakdown) {
        double total = 0.0;
        if (exerciseTypeBreakdown == null) {
            return total;
        }
        for (Map<String, Object> item : exerciseTypeBreakdown) {
            if (item == null) {
                continue;
            }
            Object typeObj = item.get("type");
            String type = typeObj == null ? "" : String.valueOf(typeObj);
            total += getDouble(item, "duration") / 60.0 * speedKmh(type);
        }
        return total;
    }

    /**
     * 从 stats 中读取里程估算值；缺失时降级用 exerciseTypeBreakdown 现场计算
     *
     * @param stats 统计 Map
     * @return 估算里程（公里）
     */
    @SuppressWarnings("unchecked")
    private static double estimateDistanceKmFromStats(Map<String, Object> stats) {
        Object cached = stats.get("estimatedDistanceKm");
        if (cached instanceof Number) {
            return ((Number) cached).doubleValue();
        }
        Object breakdown = stats.get("exerciseTypeBreakdown");
        if (breakdown instanceof List) {
            return estimateDistanceKm((List<Map<String, Object>>) breakdown);
        }
        return 0.0;
    }

    /**
     * 解锁判定（由各徽章实现）
     *
     * @param stats 用户统计
     * @return 是否满足解锁条件
     */
    public abstract boolean isUnlocked(Map<String, Object> stats);

    /**
     * 进度文本（由各徽章实现），如 "3/7天"
     *
     * @param stats 用户统计
     * @return 进度文本
     */
    public abstract String progressText(Map<String, Object> stats);

    /**
     * 安全读取整数（兼容 Integer/Long/Double 等 Number）
     *
     * @param map 数据 Map
     * @param key 键
     * @return 整数值，缺失或非数字时为 0
     */
    static int getInt(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return 0;
    }

    /**
     * 安全读取双精度（兼容 Integer/Long/Double 等 Number）
     *
     * @param map 数据 Map
     * @param key 键
     * @return 双精度值，缺失或非数字时为 0
     */
    static double getDouble(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }
}
