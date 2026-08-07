package com.fitness.checkin.constant;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 徽章编码枚举
 * 集中管理 19 个徽章的定义（code/name/icon/conditionText/category/sort）、解锁判定与进度文本。
 *
 * <p>stats 约定（Map 键）：totalCheckins / checkinDays / totalDuration / longestStreak /
 * estimatedDistanceKm / estimatedKcal / exerciseTypeBreakdown（List&lt;Map&gt;，元素含 type、duration）。</p>
 *
 * <p>枚举定义顺序 = 全局 sort 升序（1~19）= GET /badges/mine 返回顺序。
 * 新增徽章必须按 sort 递增追加，禁止乱序插入。</p>
 *
 * <p>里程系数表（km/h）：running 8 / walking 5 / cycling 15 / swimming 3 / 其余 0，
 * 与前端 EXERCISE_SPEED_KMH 必须保持同步（见 system_design_r3 §8）。</p>
 *
 * <p>消耗系数表（kcal/分钟）：running 10 / walking 5 / cycling 8 / swimming 11 / yoga 4 / gym 7 / other 5，
 * 与前端 constants.KCAL_PER_MIN 必须保持同步（见 system_design_r3 §8）。</p>
 *
 * @author Kou
 * @version 2.0.0
 */
public enum BadgeCode {

    /**
     * 初次打卡：累计打卡 1 次
     */
    FIRST_CHECKIN("first_checkin", "初次打卡", "🎉", "累计打卡 1 次", "days", 1) {
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
    DAYS_7("days_7", "坚持7天", "📅", "累计打卡 7 天", "days", 2) {
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
    DAYS_30("days_30", "坚持30天", "🗓️", "累计打卡 30 天", "days", 3) {
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
    DAYS_100("days_100", "百日坚持", "🏆", "累计打卡 100 天", "days", 4) {
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
     * 全年坚持：累计打卡 365 天
     */
    DAYS_365("days_365", "全年坚持", "📆", "累计打卡 365 天", "days", 5) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "checkinDays") >= 365;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "checkinDays") + "/365天";
        }
    },

    /**
     * 连续7天：最长连续打卡 7 天
     */
    STREAK_7("streak_7", "连续7天", "🔥", "最长连续打卡 7 天", "streak", 6) {
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
    STREAK_30("streak_30", "连续30天", "🌟", "最长连续打卡 30 天", "streak", 7) {
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
     * 连续百天：最长连续打卡 100 天
     */
    STREAK_100("streak_100", "连续百天", "💯", "最长连续打卡 100 天", "streak", 8) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "longestStreak") >= 100;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "longestStreak") + "/100天";
        }
    },

    /**
     * 千分俱乐部：累计运动 1000 分钟
     */
    MINUTES_1000("minutes_1000", "千分俱乐部", "⏱️", "累计运动 1000 分钟", "duration", 9) {
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
     * 百次打卡：累计打卡 100 次
     */
    CHECKINS_100("checkins_100", "百次打卡", "🎯", "累计打卡 100 次", "duration", 10) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "totalCheckins") >= 100;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "totalCheckins") + "/100次";
        }
    },

    /**
     * 五千分钟：累计运动 5000 分钟
     */
    MINUTES_5000("minutes_5000", "五千分钟", "⏰", "累计运动 5000 分钟", "duration", 11) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "totalDuration") >= 5000;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "totalDuration") + "/5000分钟";
        }
    },

    /**
     * 万分钟俱乐部：累计运动 10000 分钟
     */
    MINUTES_10000("minutes_10000", "万分钟俱乐部", "⌛", "累计运动 10000 分钟", "duration", 12) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return getInt(stats, "totalDuration") >= 10000;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return getInt(stats, "totalDuration") + "/10000分钟";
        }
    },

    /**
     * 万卡燃烧：累计消耗 10000 千卡
     */
    KCAL_10000("kcal_10000", "万卡燃烧", "🔋", "累计消耗 10000 千卡", "kcal", 13) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return estimateKcalFromStats(stats) >= 10000;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return Math.round(estimateKcalFromStats(stats)) + "/10000kcal";
        }
    },

    /**
     * 五万卡达人：累计消耗 50000 千卡
     */
    KCAL_50000("kcal_50000", "五万卡达人", "🔥", "累计消耗 50000 千卡", "kcal", 14) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return estimateKcalFromStats(stats) >= 50000;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return Math.round(estimateKcalFromStats(stats)) + "/50000kcal";
        }
    },

    /**
     * 十万卡传奇：累计消耗 100000 千卡
     */
    KCAL_100000("kcal_100000", "十万卡传奇", "⚡", "累计消耗 100000 千卡", "kcal", 15) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return estimateKcalFromStats(stats) >= 100000;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return Math.round(estimateKcalFromStats(stats)) + "/100000kcal";
        }
    },

    /**
     * 里程达人：累计运动里程 50 公里
     */
    DISTANCE_50("distance_50", "里程达人", "🚴", "累计运动里程 50 公里", "distance", 16) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return estimateDistanceKmFromStats(stats) >= 50;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return Math.round(estimateDistanceKmFromStats(stats)) + "/50公里";
        }
    },

    /**
     * 百公里勇士：累计运动里程 100 公里
     */
    DISTANCE_100("distance_100", "百公里勇士", "🏃", "累计运动里程 100 公里", "distance", 17) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return estimateDistanceKmFromStats(stats) >= 100;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return Math.round(estimateDistanceKmFromStats(stats)) + "/100公里";
        }
    },

    /**
     * 五百公里远征：累计运动里程 500 公里
     */
    DISTANCE_500("distance_500", "五百公里远征", "🚀", "累计运动里程 500 公里", "distance", 18) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return estimateDistanceKmFromStats(stats) >= 500;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return Math.round(estimateDistanceKmFromStats(stats)) + "/500公里";
        }
    },

    /**
     * 全能选手：累计参与 3 种运动（exerciseTypeBreakdown 中 duration &gt; 0 的类型数 ≥ 3）
     */
    TYPES_3("types_3", "全能选手", "🎨", "累计参与 3 种运动", "distance", 19) {
        @Override
        public boolean isUnlocked(Map<String, Object> stats) {
            return countActiveTypes(stats) >= 3;
        }

        @Override
        public String progressText(Map<String, Object> stats) {
            return countActiveTypes(stats) + "/3种";
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

    /** 徽章分类：days坚持天数 / streak连续成就 / duration运动时长 / kcal能量消耗 / distance里程全能 */
    private final String category;

    /** 全局排序（1~19，= 枚举定义顺序 = 返回顺序） */
    private final int sort;

    BadgeCode(String code, String name, String icon, String conditionText, String category, int sort) {
        this.code = code;
        this.name = name;
        this.icon = icon;
        this.conditionText = conditionText;
        this.category = category;
        this.sort = sort;
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

    public String getCategory() {
        return category;
    }

    public int getSort() {
        return sort;
    }

    /** 里程系数表（km/h）：running 8 / walking 5 / cycling 15 / swimming 3，其余 0 */
    private static final Map<String, Double> EXERCISE_SPEED_KMH = new HashMap<>();

    /** 消耗系数表（kcal/分钟）：running 10 / walking 5 / cycling 8 / swimming 11 / yoga 4 / gym 7 / other 5，与前端 constants.KCAL_PER_MIN 必须同步 */
    private static final Map<String, Double> KCAL_PER_MIN = new HashMap<>();

    static {
        EXERCISE_SPEED_KMH.put("running", 8.0);
        EXERCISE_SPEED_KMH.put("walking", 5.0);
        EXERCISE_SPEED_KMH.put("cycling", 15.0);
        EXERCISE_SPEED_KMH.put("swimming", 3.0);

        KCAL_PER_MIN.put("running", 10.0);
        KCAL_PER_MIN.put("walking", 5.0);
        KCAL_PER_MIN.put("cycling", 8.0);
        KCAL_PER_MIN.put("swimming", 11.0);
        KCAL_PER_MIN.put("yoga", 4.0);
        KCAL_PER_MIN.put("gym", 7.0);
        KCAL_PER_MIN.put("other", 5.0);
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
     * 获取运动类型对应消耗系数（kcal/分钟），未列入的类型系数为 0
     *
     * @param type 运动类型
     * @return 消耗系数
     */
    private static double kcalPerMin(String type) {
        return KCAL_PER_MIN.getOrDefault(type == null ? "" : type, 0.0);
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
     * 根据运动类型分布估算累计消耗（千卡）
     * 口径：Σ(duration × 系数)，系数见 KCAL_PER_MIN
     *
     * @param exerciseTypeBreakdown 运动类型分布 [{type, duration}, ...]
     * @return 估算消耗（千卡）
     */
    public static double estimateKcal(List<Map<String, Object>> exerciseTypeBreakdown) {
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
            total += getDouble(item, "duration") * kcalPerMin(type);
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
     * 从 stats 中读取消耗估算值；缺失时降级用 exerciseTypeBreakdown 现场计算
     *
     * @param stats 统计 Map
     * @return 估算消耗（千卡）
     */
    @SuppressWarnings("unchecked")
    private static double estimateKcalFromStats(Map<String, Object> stats) {
        Object cached = stats.get("estimatedKcal");
        if (cached instanceof Number) {
            return ((Number) cached).doubleValue();
        }
        Object breakdown = stats.get("exerciseTypeBreakdown");
        if (breakdown instanceof List) {
            return estimateKcal((List<Map<String, Object>>) breakdown);
        }
        return 0.0;
    }

    /**
     * 统计 exerciseTypeBreakdown 中 duration &gt; 0 的运动类型种类数（types_3 徽章判定）
     *
     * @param stats 统计 Map
     * @return 参与运动种类数
     */
    @SuppressWarnings("unchecked")
    private static int countActiveTypes(Map<String, Object> stats) {
        Object breakdown = stats.get("exerciseTypeBreakdown");
        if (!(breakdown instanceof List)) {
            return 0;
        }
        int count = 0;
        for (Object item : (List<Object>) breakdown) {
            if (item instanceof Map) {
                if (getDouble((Map<String, Object>) item, "duration") > 0) {
                    count++;
                }
            }
        }
        return count;
    }

    /** progressText 统一格式：cur/target单位，如 "3/7天"、"1250/10000kcal" */
    private static final Pattern PROGRESS_TEXT_PATTERN = Pattern.compile("^(\\d+)/(\\d+)(.*)$");

    /**
     * 统一解析 progressText "cur/target单位" → "还差 N单位 解锁"；已达标或格式非法返回 null
     *
     * @param progressText 进度文本，如 "3/7天"
     * @return 未解锁提示文本，如 "还差 4天 解锁"
     */
    public static String remainText(String progressText) {
        if (progressText == null) {
            return null;
        }
        Matcher matcher = PROGRESS_TEXT_PATTERN.matcher(progressText.trim());
        if (!matcher.matches()) {
            return null;
        }
        long cur = Long.parseLong(matcher.group(1));
        long target = Long.parseLong(matcher.group(2));
        long remain = target - cur;
        if (remain <= 0) {
            return null;
        }
        return "还差 " + remain + matcher.group(3) + " 解锁";
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
