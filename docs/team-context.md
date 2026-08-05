# 健身打卡小程序 - 团队协作上下文

## 项目结构
- 前端：Taro 3 + React + TypeScript（`src/`），编译产物 `dist/`（微信开发者工具加载）
- 后端：Spring Boot 3.2.5 + MyBatis-Plus + MySQL（部署在 124.222.95.76，context-path: /api）
- GitHub：https://github.com/928896993lhl/fitness-checkin

## 用户本轮需求
1. 邀请码正常显示（当前不显示）
2. 圈子"活跃/已归档"状态逻辑明确，考虑是否有控制入口
3. 宽松打卡：手动输入运动类型、时长等，点打卡弹出输入面板，不强制依赖计划
4. "我的"页面简化：去掉运动数据/我的圈子/创建圈子/加入圈子（首页已有）
5. 产品设计评审（不合理处 + 改进建议）
6. 保证所有接口端到端正确

## 关键技术事实（已核实）

### 后端字段全是驼峰，前端 types 全是下划线 —— 端到端不匹配根源
| 后端实体字段 | 前端当前访问 | 应改为 |
|---|---|---|
| circleId | circle._id / circle.circle_id | circle.circleId |
| creatorId | circle.creator_id | circle.creatorId |
| maxMembers | circle.max_members | circle.maxMembers |
| inviteCode | circle.invite_code | circle.inviteCode |
| createdAt | circle.created_at | circle.createdAt |
| userId | user._id / user.user_id | user.userId |
| planId | plan._id | plan.planId |
| joinedAt | member.joined_at | member.joinedAt |
| role(Integer 1/2) | member.role | member.role |
| totalDurationGoal | plan.total_duration_goal | plan.totalDurationGoal |
| dailyDurationGoal | plan.daily_duration_goal | plan.dailyDurationGoal |
| checkinTime | record.checkin_time | record.checkinTime |
| exerciseType | record.exercise_type | record.exerciseType |

前端使用点统计：circle._id(26处)、circle.circle_id(4处)、invite_code(3处)、max_members(2处)、created_at(1处)、creator_id(3处)

### 后端接口现状
- POST /checkin：**强制需要 planId**，校验计划存在/进行中/用户是成员 —— 宽松打卡需改造为 planId 可选
- CircleController：只有 create/join/detail/members/my，**无归档/状态接口**
- check-today/{planId}：返回 {checked, planId}
- getUserCheckinStats：返回 {totalDuration, checkinDays, totalDays, passedDays, completionRate, todayChecked}
- 邀请码：后端 RandomStringUtils.randomAlphanumeric(8).toUpperCase()，8位

### 圈子状态
- status: Integer，1=活跃（数据库当前值都是1）
- 前端 CircleCard 已改为 Number(circle.status) === 1 判断
- 后端无状态控制接口

### 打卡流程现状
- checkin.tsx 从 URL 取 planId，无 planId 则无法打卡
- 打卡需：运动类型(下拉)、时长(分钟)、可选照片、备注
- CheckinService.createCheckin → POST /checkin {plan_id, duration, exercise_type, photo_url, note}

## 已修复历史（勿回退）
- code===200 判断（后端 Result.code）
- API路径：/checkin(单数)、/plans/circle/{id}、/checkin/records/{planId}
- 统计字段驼峰：totalDuration/checkinDays/passedDays/completionRate
- tabbar图标在 src/assets/tabbar/（勿删）
- 邀请码校验8位（constants INVITE_CODE_LENGTH: 8）
