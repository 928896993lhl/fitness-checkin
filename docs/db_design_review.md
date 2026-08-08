# 健身打卡小程序 数据库设计评审报告

- **评审人**：架构师 高见远
- **评审对象**：`fitness_checkin` 库（MySQL 8 + InnoDB + utf8mb4_unicode_ci，实例 124.222.95.76）
- **评审依据**：生产库 `SHOW CREATE TABLE` 实况 + `sql/init.sql` + 后端实体类/Mapper 自定义 SQL/Service 查询路径 + 前端常量（`EXERCISE_TYPE_CONFIG`、`CIRCLE_RULES` 等）+ PRD
- **评审性质**：只读评审，不改任何代码
- **结论速览**：**整体结构清晰、命名规范、约束基本到位，属于"及格偏上"的 MVP 设计；但存在 3 处级联删除导致历史数据丢失的高危点、5 个冗余索引、1 个无外键关联的圈子孤儿风险、以及 exercise_type 自由文本带来的统计口径风险。当前数据量为测试冒烟数据，未反映真实使用场景。**

---

## 一、表结构设计评价（逐表）

### 1.1 users（用户表）

| 维度 | 评价 |
|---|---|
| 优点 | BIGINT 自增主键、openid 唯一约束、utf8mb4、created_at/updated_at 带默认值，基础规范 |
| 优点 | `uk_openid` 已能保证登录幂等（`selectByOpenid`/`existsByOpenid` 命中唯一索引） |
| 问题① | **openid 单身份绑定**：openid 是"微信小程序 appid 维度"的身份，换 appid 即变；未来多端登录（公众号/App/小程序多主体）需引入 `unionid` 或独立身份表，现有结构无法直接承载 |
| 问题② | **无软删除/状态字段**：`application.yml` 已配置 MyBatis-Plus `logic-delete-field: deleted`，但实体/表均无 `deleted` 字段——**配置悬空**，注销用户只能物理删除 |
| 问题③ | 无 `status`（禁用）、`last_login_at`（活跃度分析）、身高体重等健康维度（可选） |
| 问题④ | `idx_created_at` 用途弱，仅按创建时间排序时才用；低优先级可保留 |

### 1.2 circles（圈子表）

| 维度 | 评价 |
|---|---|
| 优点 | creator_id 外键、max_members、invite_code 唯一、status 归档语义（0禁用/1正常）、时间戳齐全 |
| 问题① | **`creator_id` FK ON DELETE CASCADE 是数据丢失高危点**：删除创建者用户 → 级联删除整个圈子 → 级联删除该圈子全部计划与打卡记录。一个圈子的历史数据被单个用户删除事件连带清空，与"健身数据是核心资产"冲突。应改 `ON DELETE RESTRICT`（或 SET NULL），由应用层处理"注销用户"流程 |
| 问题② | `max_members INT DEFAULT 50`，但 PRD 要求 2-8 人；DB 层未约束（可接受，需应用层强制 min≥2）。**当前生产数据 4 个圈子各只有 1 人，违反 PRD 的"人数限制2-8人"下限**，见数据质量分析 |
| 问题③ | 无 `announcement`（圈公告）、封面图、分类/标签字段，未来迭代需 ALTER |
| 问题④ | `idx_status` 在数据量小且 status 只有 0/1 时选择性极低，收益有限（保留无害） |

### 1.3 circle_members（圈子成员表）

| 维度 | 评价 |
|---|---|
| 优点 | 代理主键 `id` + `uk_circle_user(circle_id,user_id)` 复合唯一，防止重复入圈；role(0/1/2) 语义清晰；双向 FK CASCADE（删用户/删圈子自动清成员）合理 |
| 问题① | **无成员状态/退出记录**：PRD 规定"成员不允许退出"，所以现状够用；但若未来支持退出/踢人/待审核，需要 `status` 或软删除字段，否则历史成员关系无法保留 |
| 问题② | `role` 无 CHECK 约束（0/1/2 仅靠注释约定）；MySQL 8.0.16+ 可加 `CHECK (role IN (0,1,2))`（低价值，可选） |
| 问题③ | 成员列表查询 `SELECT * ... WHERE circle_id=? ORDER BY joined_at` 会 filesort；uk_circle_user(circle_id,user_id) 前缀只覆盖 circle_id 等值，排序字段未覆盖（小表无感知，可加 `(circle_id, joined_at)` 复合索引） |

### 1.4 plans（计划表）

| 维度 | 评价 |
|---|---|
| 优点 | circle_id 外键、日期区间 + status(0/1/2) 双轨状态、四类目标字段、min_duration、索引齐全，能表达"一个圈子多轮计划" |
| 问题① | **DB 层无法防止"同圈多个进行中计划"**：`countActiveByCircleId` 是应用层检查，存在并发竞态（两个请求同时建计划均通过校验）。可用生成列 + 唯一索引兜底（见 S7） |
| 问题② | `status` 与日期可能漂移：若定时任务（结束计划）失败，status 停在 1 而 end_date 已过。`selectExpiredPlans` 每日兜底，可接受；建议 status 由任务幂等刷新 |
| 问题③ | 目标字段 `total_duration_goal/daily_duration_goal/circle_total_goal` 默认 0，"未设置"与"目标为 0"语义混淆（应用层以 >0 判定，可接受但建议注释固化口径） |
| 问题④ | 无 `creator_id`（目前隐式等于 circle.creator_id），未来多管理员建计划需补列 |

### 1.5 checkin_records（打卡记录表，核心热表）

| 维度 | 评价 |
|---|---|
| 优点 | **宽松打卡设计（plan_id/circle_id 均可空）正确**：既支持计划内打卡，也支持自由打卡，planId 为空时默认取计划所属圈子（`CheckinServiceImpl` 逻辑自洽） |
| 优点 | `idx_plan_user_time(plan_id,user_id,checkin_time)` 覆盖"按计划×用户查记录/汇总/排序"主路径；checkin_time 单独建索引 |
| 问题① | **`plan_id` FK ON DELETE CASCADE 是最大历史数据风险**：删除/清理一个计划 → 级联删除所有打卡记录。打卡记录是用户核心资产，计划却只是阶段性容器，级联方向错了。应改 `ON DELETE SET NULL`（保留记录，plan_id 置空） |
| 问题② | **`circle_id` 无外键**（宽松打卡设计所致）：删除圈子不会清理 circle_id 指向的打卡，存在孤儿数据；圈子若被级联删除（见 1.2 问题①）则打卡记录悬空。建议补 FK `ON DELETE SET NULL`（circle_id 可空，天然兼容） |
| 问题③ | **`exercise_type` 自由文本无约束**：PRD 虽要求"运动类型自定义"，但当前 GROUP BY exercise_type 做统计（`selectExerciseTypeBreakdownByUserId`），大小写/空格/近义词会碎片化口径。现有数据全为 `running`，尚无问题，但无防呆 |
| 问题④ | `photo_url` 单文件 varchar(500)：未来多图（前后对比、多角度）需子表或 JSON 列；且文件存服务器本地磁盘（FileServiceImpl），非对象存储，水平扩展受限（属部署层，DB 评审顺带提示） |
| 问题⑤ | `duration` 无 CHECK（应用层 1-480 校验兜底，可加 CHECK 防脏数据） |
| 问题⑥ | `DATE(checkin_time)=?` 函数写法使索引失效（`existsByPlanIdAndUserIdAndDate`、`selectTodayDurationByUserId`），数据量大后需改范围查询（见 S4） |
| 问题⑦ | `created_at` 与 `checkin_time` 双时间戳并存合理（用户可见时间 vs 落库时间），但无"是否允许补打卡/改时间"的校验字段 |

### 1.6 user_badges（徽章表）

| 维度 | 评价 |
|---|---|
| 优点 | 复合主键 `(user_id, badge_code)` 正确；`INSERT IGNORE` 幂等写入；`idx_badge_code` 支持反查；FK CASCADE 合理 |
| 问题① | `badge_code` 无字典表约束：19 个徽章定义在 `BadgeCode` 枚举中，代码改名/删徽章后历史数据成孤儿。小体量下枚举够用，可选补 `badges` 字典表 |
| 问题② | 徽章元数据（图标/文案）全在代码，DB 无法支撑运营动态配置（当前可接受） |

---

## 二、数据质量分析

| 检查项 | 实测 | 判定 | 说明 |
|---|---|---|---|
| 用户 | users=1 | ⚠️ 不足 | 全部打卡 user_id=1，无法验证多用户聚合（圈子热力图去重人数、成员进度对比） |
| 圈子规模 | circles=4，circle_members=4（各 1 人） | ❌ 违反 PRD | PRD 与前端 `CIRCLE_RULES.MIN_MEMBERS=2` 要求 2-8 人，生产出现 1 人圈子；**后端 createCircle/joinCircle 均未强制 min≥2**，属规格缺口而非仅数据问题 |
| 计划 | plans=1（4 个圈子仅 1 个计划） | ❌ 违反不变量 | `createCircle` 逻辑**必然为每个圈子自动生成初始计划**，4 个圈子应有 4 个初始计划；现只有 1 个，说明数据为手工造数或初始计划流程在 3 个圈子上缺失，与代码不变量不一致 |
| 打卡分布 | 5 条全为 running / 165 分钟；circle_id：NULL=1 + 圈子1-4各1 | ✅ 覆盖好 | NULL 覆盖宽松打卡路径、圈子 ID 覆盖计划绑定路径，两条代码分支都有样本 |
| 空值 | nickname/avatar/photo/remark 均为 '' 默认值，无 NULL 异常 | ✅ 健康 | 默认值策略统一 |
| 口径 | 时长 165/5=33 分钟/次，符合 1-480 与 min 10 约束 | ✅ 健康 | 无明显脏数据 |
| 综合 | — | ⚠️ 测试冒烟数据 | 缺：多用户、多运动类型、跨月热力图数据、多人圈子；无法用现有数据验证统计聚合、索引效果与并发场景 |

**结论**：数据健康度"无脏数据但无代表性"。建议补一套贴近真实场景的开发种子数据（≥3 用户、≥2 个多人圈子、≥3 种运动类型、跨 3 个月的打卡记录），并补齐 3 个缺失的圈子初始计划（或明确其为手工造数，接受不一致）。

---

## 三、索引评估

### 3.1 冗余索引（应删）

| 表 | 冗余索引 | 依据 | 建议 |
|---|---|---|---|
| users | `idx_users_openid` | 与 `uk_openid` 完全重复 | **删** |
| circles | `idx_circles_invite_code` | 与 `uk_invite_code` 完全重复 | **删** |
| circle_members | `idx_circle_members_user_id` | 与 `idx_user_id` 完全重复 | **删** |
| plans | `idx_plans_circle_id` | 与 `idx_circle_id` 完全重复 | **删**（保留 CREATE TABLE 里的 idx_circle_id，或保留一个） |
| checkin_records | `idx_checkin_records_plan_user(plan_id,user_id)` | 是 `idx_plan_user_time(plan_id,user_id,checkin_time)` 的最左前缀，完全被覆盖 | **删** |
| checkin_records | `idx_plan_id` | 是 `idx_plan_user_time` 的最左前缀，等值查询被覆盖（见 3.2 备注） | 加入 S1 复合索引后**删** |
| checkin_records | `idx_user_id` / `idx_circle_id` | 单列，将被 S1 的复合索引前缀覆盖 | 加入 S1 后**删** |

### 3.2 缺失索引（应加）

| 场景 | 实际 SQL（Mapper） | 现状 | 建议 |
|---|---|---|---|
| 圈子热力图/圈子统计（按天聚合） | `WHERE circle_id=? AND checkin_time>=? GROUP BY DATE(checkin_time)`（selectHeatmapByCircleId / selectCircleStats / selectActiveMembersByCircleId / selectTodayActiveCountByCircleId） | 仅 `idx_circle_id` 单列，范围+分组无法走覆盖 | **加 `(circle_id, checkin_time)` 复合索引**（init.sql 注释中已预留，建议落地） |
| 用户热力图/今日时长（按天聚合） | `WHERE user_id=? AND checkin_time>=?`（selectHeatmapByUserId / selectTodayDurationByUserId / selectDistinctCheckinDatesByUserId） | 仅 `idx_user_id` 单列 | **加 `(user_id, checkin_time)` 复合索引** |
| 查圈子进行中计划（高频） | `WHERE circle_id=? AND status=1 ORDER BY start_date`（selectActiveByCircleId / countActiveByCircleId / getActivePlan） | `idx_circle_id` + filesort | **加 `(circle_id, status, start_date)` 复合索引** |
| 圈子成员列表排序 | `WHERE circle_id=? ORDER BY joined_at`（selectByCircleId） | filesort | 可选 `(circle_id, joined_at)` |
| 计划到期扫描 | `WHERE status=1 AND end_date<?`（selectExpiredPlans） | `idx_status`+`idx_end_date` 分列 | 可选 `(status, end_date)` 复合 |
| 计划级每日统计 | `WHERE plan_id=? AND checkin_time BETWEEN ? AND ?`（selectDailyStatsByPlanId） | `idx_plan_user_time` 前缀可等值 plan_id，范围跨用户仍扫 | 数据量大后可加 `(plan_id, checkin_time)` |

**明确回答评审关注点**：**圈子热力图按天聚合需要 `(circle_id, checkin_time)` 复合索引**——现有 `idx_circle_id` 只能等值过滤 circle_id，`checkin_time >=` 范围与 `GROUP BY DATE(...)` 都回表/full scan，数据量上来必慢。当前 5 行数据无感知，属"低成本提前建"型优化。

### 3.3 索引相关查询写法问题（非 DDL 但影响索引生效）

- `existsByPlanIdAndUserIdAndDate`：`WHERE ... AND DATE(checkin_time)=?` 对列套函数 → 索引失效。改为 `checkin_time >= ? AND checkin_time < DATE_ADD(?, INTERVAL 1 DAY)`。
- `selectTodayDurationByUserId`：同上，改为范围条件。
- `selectCheckinDaysByPlanIdAndUserId` / `selectCheckinDaysByUserId`：`COUNT(DISTINCT DATE(checkin_time))` 无法完全走索引，可保留（天数统计本身要扫描区间）；量级上来后可改"打卡日期物化表"（user_id, checkin_date 唯一）实现 O(1)。

---

## 四、扩展性评估（重点）

### 4.1 未来功能 × 现有表承载矩阵

| 未来功能 | 现有结构能否承载 | 结论与要点 |
|---|---|---|
| 评论/点赞 | ✅ 可承载（新增表） | 需新增 `checkin_comments` / `checkin_likes`（见 O4），对 checkin_records 无改动 |
| 通知（每日汇总/计划提醒/互动通知） | ✅ 可承载（新增表） | 现有 `DailySummaryTask`/`PlanEndReminderTask` 仅打日志，缺 `notifications` 表 + 微信订阅消息授权记录（见 O3） |
| 好友 | ✅ 可承载（新增表） | 独立 `friends` 表（user_id, friend_id, status），不依赖现有表 |
| 运动记录明细化（距离/卡路里/心率/GPS） | ⚠️ 需改表 | 现只有 duration + exercise_type；里程/卡路里由代码按固定系数估算（BadgeCode），接入真实设备数据后估算与实测会冲突。建议加 `metrics JSON` 列（见 O2） |
| 多端登录 | ❌ 现有结构阻碍 | users.openid 单身份唯一；多平台需 `user_identities` 身份表或至少补 `unionid`（见 S6） |
| 圈子公告 | ⚠️ 需 ALTER | circles 加 `announcement` 列即可（见 O5），低成本 |
| 数据归档/分表 | ⚠️ 需规划 | checkin_records 是唯一增长表；MySQL 分区要求主键含分区键（现 PK=record_id 不满足），需 PK 改 `(record_id, checkin_time)` 或归档表方案（见 O6） |
| 数据可视化（热力图/统计） | ⚠️ 缺索引 | 加 3.2 的复合索引后即可支撑 |
| 圈子模板/分类 | ✅ 可承载 | circles 加 category 列或独立模板表 |
| 多图打卡 | ⚠️ 需改表 | photo_url 单列 → `checkin_photos` 子表或 JSON（见 O1） |

### 4.2 现有设计阻碍扩展的点（按严重度排序）

| # | 阻碍点 | 影响 | 建议等级 |
|---|---|---|---|
| 1 | **级联删除链**：users→circles→plans→checkin_records 全链路 CASCADE | 删除单个用户可连带清空整个圈子及其全部打卡历史，核心资产不可逆丢失 | 必改 |
| 2 | **plan_id CASCADE 删除打卡记录** | 计划清理即删用户成果，历史无法追溯 | 必改 |
| 3 | **exercise_type 自由文本** | 统计聚合口径碎片化；自定义类型与固定类型混存 | 必改/建议 |
| 4 | **openid 单身份** | 多端/多主体登录需迁移 | 建议 |
| 5 | **无软删除字段**（MP 配置悬空） | 注销/下架只能物理删，审计与恢复能力缺失 | 建议 |
| 6 | **circle_id 无外键** | 孤儿数据风险 | 建议 |
| 7 | **photo_url 单文件 + 本地磁盘存储** | 多图与对象存储扩展受限 | 可选 |
| 8 | **无指标明细列** | 运动明细化需改表 | 可选 |

---

## 五、优化建议清单（含具体 SQL）

> 执行原则：低峰执行、先备份、单条验证；表当前极小（≤5 行），直接 ALTER 无锁表风险。外键名以实际 `information_schema` 为准（MySQL 未命名外键默认 `表名_ibfk_N`），先查再改。

```sql
-- 0) 先查实际外键名（必做）
SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'fitness_checkin' AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### A. 必改（P0，正确性/数据安全，风险低）

**A1. 删除 5 个完全冗余索引**

```sql
ALTER TABLE `users`          DROP INDEX `idx_users_openid`;
ALTER TABLE `circles`        DROP INDEX `idx_circles_invite_code`;
ALTER TABLE `circle_members` DROP INDEX `idx_circle_members_user_id`;
ALTER TABLE `plans`          DROP INDEX `idx_plans_circle_id`;          -- 保留 idx_circle_id
ALTER TABLE `checkin_records` DROP INDEX `idx_checkin_records_plan_user`; -- 被 idx_plan_user_time 覆盖
```

**A2. checkin_records.plan_id 级联方向修正：CASCADE → SET NULL（保护打卡历史）**

```sql
ALTER TABLE `checkin_records` DROP FOREIGN KEY `checkin_records_ibfk_1`;
ALTER TABLE `checkin_records`
  ADD CONSTRAINT `fk_checkin_records_plan`
  FOREIGN KEY (`plan_id`) REFERENCES `plans`(`plan_id`) ON DELETE SET NULL;
```

**A3. circles.creator_id 级联修正：CASCADE → RESTRICT（防单用户删除连带清空圈子）**

```sql
ALTER TABLE `circles` DROP FOREIGN KEY `circles_ibfk_1`;
ALTER TABLE `circles`
  ADD CONSTRAINT `fk_circles_creator`
  FOREIGN KEY (`creator_id`) REFERENCES `users`(`user_id`) ON DELETE RESTRICT;
```
配套：应用层提供"注销用户"流程（先处理其创建的圈子/移交创建者，再删除用户），避免被 RESTRICT 卡死。

**A4. exercise_type 归一化 + 白名单约束（保统计口径）**

```sql
-- 归一化：统一小写、去空白
UPDATE `checkin_records` SET `exercise_type` = LOWER(TRIM(`exercise_type`));
-- 白名单外归入 other（按需执行；固定类型以 BadgeCode/前端 EXERCISE_TYPE_CONFIG 为准）
UPDATE `checkin_records` SET `exercise_type` = 'other'
WHERE `exercise_type` NOT IN ('running','walking','cycling','swimming','yoga','gym','other');
-- 约束（MySQL 8.0.16+ 生效；若产品确认支持任意自定义类型，则改为 A4-备选 字典表方案）
ALTER TABLE `checkin_records`
  ADD CONSTRAINT `chk_exercise_type`
  CHECK (`exercise_type` IN ('running','walking','cycling','swimming','yoga','gym','other'));
```
> A4-备选（支持自定义类型 + 统计稳定）：新建 `exercise_types` 字典表（type_code PK、name、icon、sort、status），checkin_records.exercise_type 存 code 并外键关联；自定义类型先落字典再打卡。

**A5. 补 checkin_records.circle_id 外键（孤儿治理）**

```sql
-- 先清孤儿（如有）
DELETE cr FROM `checkin_records` cr
LEFT JOIN `circles` c ON c.circle_id = cr.circle_id
WHERE cr.circle_id IS NOT NULL AND c.circle_id IS NULL;
-- 补外键：circle 删除时记录保留、circle_id 置空（兼容宽松打卡）
ALTER TABLE `checkin_records`
  ADD CONSTRAINT `fk_checkin_records_circle`
  FOREIGN KEY (`circle_id`) REFERENCES `circles`(`circle_id`) ON DELETE SET NULL;
```

### B. 建议（P1，性能/数据质量/体验）

**B1. 补齐 3 个复合索引，并下沉 3 个单列索引**

```sql
-- 圈子热力图/圈子统计
ALTER TABLE `checkin_records` ADD INDEX `idx_checkin_records_circle_time` (`circle_id`, `checkin_time`);
-- 用户热力图/用户统计
ALTER TABLE `checkin_records` ADD INDEX `idx_checkin_records_user_time` (`user_id`, `checkin_time`);
-- 计划高频路径：圈子的进行中计划
ALTER TABLE `plans` ADD INDEX `idx_plans_circle_status_start` (`circle_id`, `status`, `start_date`);

-- 确认新索引就位后，删除被前缀覆盖的单列索引（B1 与 A1 合并为一次变更批次执行）
ALTER TABLE `checkin_records` DROP INDEX `idx_plan_id`;
ALTER TABLE `checkin_records` DROP INDEX `idx_user_id`;
ALTER TABLE `checkin_records` DROP INDEX `idx_circle_id`;
-- plans.idx_circle_id 与 idx_plans_circle_status_start 前缀重叠，可留（查询走新复合索引）也可删；建议保留避免误伤
```

**B2. 查"今日是否打卡/今日时长"改写为范围条件（配合 B1 索引生效）**

```sql
-- 原：WHERE plan_id=? AND user_id=? AND DATE(checkin_time)=?
-- 改：WHERE plan_id=? AND user_id=? AND checkin_time >= ? AND checkin_time < DATE_ADD(?, INTERVAL 1 DAY)
-- 原：WHERE user_id=? AND DATE(checkin_time)=?
-- 改：WHERE user_id=? AND checkin_time >= ? AND checkin_time < DATE_ADD(?, INTERVAL 1 DAY)
```

**B3. 修复数据不变量：补齐圈子初始计划 / 重建种子数据**

- 现状：4 圈仅 1 计划（违反 createCircle 自动建计划的不变量）。
- 方案：确认数据为手工造数则接受并补充说明；若为产品数据，为每个圈子补初始计划。
- 建议新建一套开发种子数据：≥3 用户、≥2 个多人圈子、≥3 种运动类型、跨 3 个月打卡记录，用于验证热力图/聚合/分页。

**B4. 多端登录扩展：users 补 unionid（轻量）或独立身份表（完整）**

```sql
-- 轻量：仅跨微信应用
ALTER TABLE `users` ADD COLUMN `unionid` VARCHAR(64) NULL COMMENT '微信开放平台unionid' AFTER `openid`;
ALTER TABLE `users` ADD UNIQUE KEY `uk_unionid` (`unionid`);
```
```sql
-- 完整：多 provider 身份表（推荐，为多端登录预留）
CREATE TABLE `user_identities` (
  `identity_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     BIGINT      NOT NULL COMMENT '用户ID',
  `provider`    VARCHAR(20) NOT NULL COMMENT 'wechat_mini/wechat_oa/apple/phone...',
  `openid`      VARCHAR(64) NOT NULL COMMENT '各端openid',
  `unionid`     VARCHAR(64) NULL COMMENT '开放平台unionid',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_provider_openid` (`provider`, `openid`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_identities_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录身份表';
-- users.openid 保留为"主身份"兼容现有代码；新端身份写入 user_identities
```

**B5. 同圈"进行中计划"唯一性兜底（生成列 + 唯一索引）**

```sql
ALTER TABLE `plans`
  ADD COLUMN `active_flag` TINYINT GENERATED ALWAYS AS (IF(`status` = 1, 1, NULL)) STORED;
ALTER TABLE `plans`
  ADD UNIQUE KEY `uk_circle_active` (`circle_id`, `active_flag`);  -- NULL 不参与唯一冲突
```
（MySQL 8 生成列唯一索引技巧：status=1 时 active_flag=1，同圈仅一行；status≠1 时为 NULL 不冲突。应用层校验保留，作为并发兜底。）

**B6. 软删除落地（激活已悬空的 MyBatis-Plus 配置）**

```sql
ALTER TABLE `users` ADD COLUMN `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-正常，1-已删除';
ALTER TABLE `plans`  ADD COLUMN `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-正常，1-已删除';
-- 实体加 @TableLogic 字段（全局 logic-delete-field 已配置，加了字段即生效）
-- checkin_records 建议保持物理不可删（核心资产只增不改）；circles 用 status 归档已够
```

**B7. 圈子成员列表排序索引（可选）**

```sql
ALTER TABLE `circle_members` ADD INDEX `idx_circle_members_circle_joined` (`circle_id`, `joined_at`);
```

### C. 可选（P2，未来功能预留）

**C1. 多图打卡：`checkin_photos` 子表（优于 JSON 列）**

```sql
CREATE TABLE `checkin_photos` (
  `photo_id`   BIGINT AUTO_INCREMENT PRIMARY KEY,
  `record_id`  BIGINT       NOT NULL COMMENT '打卡记录ID',
  `photo_url`  VARCHAR(500) NOT NULL COMMENT '照片URL',
  `sort`       INT          NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_record_id` (`record_id`),
  CONSTRAINT `fk_checkin_photos_record` FOREIGN KEY (`record_id`) REFERENCES `checkin_records`(`record_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡照片表';
```

**C2. 运动明细指标：`metrics JSON` 列**

```sql
ALTER TABLE `checkin_records`
  ADD COLUMN `metrics` JSON NULL COMMENT '扩展指标：{"distanceKm":5.2,"calories":320,"avgHeartRate":145,"route":[...]}' AFTER `remark`;
-- 注：JSON 列不参与高频统计（统计仍用 duration/exercise_type 标量列），仅作明细归档
```

**C3. 通知表**

```sql
CREATE TABLE `notifications` (
  `notification_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id`         BIGINT       NOT NULL COMMENT '接收用户ID',
  `type`            VARCHAR(30)  NOT NULL COMMENT 'daily_summary/plan_end/checkin_like/comment...',
  `title`           VARCHAR(100) NOT NULL,
  `content`         VARCHAR(500) NOT NULL,
  `related_id`      BIGINT       NULL COMMENT '关联业务ID（如计划ID/记录ID）',
  `is_read`         TINYINT      NOT NULL DEFAULT 0 COMMENT '0-未读，1-已读',
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_user_read` (`user_id`, `is_read`, `created_at`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';
```

**C4. 评论/点赞表**

```sql
CREATE TABLE `checkin_comments` (
  `comment_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `record_id`  BIGINT       NOT NULL,
  `user_id`    BIGINT       NOT NULL,
  `parent_id`  BIGINT       NULL COMMENT '回复目标评论ID',
  `content`    VARCHAR(500) NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_record_id` (`record_id`),
  CONSTRAINT `fk_comments_record` FOREIGN KEY (`record_id`) REFERENCES `checkin_records`(`record_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡评论表';

CREATE TABLE `checkin_likes` (
  `record_id`  BIGINT   NOT NULL,
  `user_id`    BIGINT   NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`, `user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_likes_record` FOREIGN KEY (`record_id`) REFERENCES `checkin_records`(`record_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_likes_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='打卡点赞表';
```

**C5. 圈子公告**

```sql
ALTER TABLE `circles` ADD COLUMN `announcement` VARCHAR(500) DEFAULT '' COMMENT '圈子公告' AFTER `description`;
```

**C6. 数据归档/分区（checkin_records 超 500 万行后评估）**

```sql
-- 注意：MySQL 分区要求所有唯一键含分区键，现 PK=record_id 不满足，需先改 PK 为 (record_id, checkin_time) 或改用归档表
-- 方案A（改主键后按月分区）：
ALTER TABLE `checkin_records` DROP PRIMARY KEY, ADD PRIMARY KEY (`record_id`, `checkin_time`);
ALTER TABLE `checkin_records`
  PARTITION BY RANGE (TO_DAYS(`checkin_time`)) (
    PARTITION p2025 VALUES LESS THAN (TO_DAYS('2026-01-01')),
    PARTITION p2026 VALUES LESS THAN (TO_DAYS('2027-01-01')),
    PARTITION p2027 VALUES LESS THAN (TO_DAYS('2028-01-01')),
    PARTITION pMax VALUES LESS THAN MAXVALUE
  );
-- 方案B（不动主键，冷热分离）：定期 INSERT INTO checkin_records_archive SELECT ... WHERE checkin_time < 阈值，再 DELETE 原表
```

**C7. 徽章字典表（运营可配）**

```sql
CREATE TABLE `badges` (
  `badge_code`  VARCHAR(50)  PRIMARY KEY,
  `name`        VARCHAR(50)  NOT NULL,
  `icon`        VARCHAR(10)  NOT NULL,
  `description` VARCHAR(100) NOT NULL,
  `category`    VARCHAR(20)  NOT NULL,
  `sort`        INT          NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='徽章字典表';
ALTER TABLE `user_badges`
  ADD CONSTRAINT `fk_user_badges_badge` FOREIGN KEY (`badge_code`) REFERENCES `badges`(`badge_code`) ON DELETE RESTRICT;
```

**C8. users 健康维度字段（可选）**

```sql
ALTER TABLE `users` ADD COLUMN `status` TINYINT NOT NULL DEFAULT 1 COMMENT '0-禁用，1-正常' AFTER `avatar_url`;
ALTER TABLE `users` ADD COLUMN `last_login_at` DATETIME NULL COMMENT '最后登录时间' AFTER `status`;
```

---

## 六、评审结论

1. **整体评价**：B+（良好偏上）。表结构覆盖 PRD 核心需求，命名规范、索引设计有意识、宽松打卡设计正确，为 MVP 之后的迭代留了一定余地。
2. **最优先处理**：A2/A3 两处级联删除修正（保护打卡历史与圈子数据）、A1 冗余索引清理、A4 exercise_type 归一化。这四项零成本、零风险、收益最大。
3. **次优先**：B1 三个复合索引（圈子热力图/用户热力图/计划查询）、B3 数据不变量修复与种子数据、B4 多端身份扩展、B5 计划唯一性兜底。
4. **长期**：C 系列为评论/点赞/通知/多图/明细化等未来功能预留，按产品节奏引入；checkin_records 分区方案在数据量达到数百万级前不必动。
5. **一个额外提示**：MyBatis-Plus 全局 `logic-delete-field: deleted` 配置已声明但实体/表均未落地，属"配置悬空"——要么补字段激活（B6），要么删除配置，避免后续开发者误以为已启用逻辑删除。

---

*本报告基于生产库表结构实况与源码交叉核对得出，SQL 均可在低峰期执行；执行前请按第一节 SQL 先核对实际外键名。*
