# 健身打卡小程序 综合代码审查报告

> 审查维度：功能性 · 安全性 · 合规性
> 审查方式：逐文件静态阅读当前源码（只读，未运行），对照 PRD / 系统设计 / 旧报告核实，不修改任何代码。
> 审查对象：后端 Spring Boot（`fitness-checkin-backend/`）+ 前端 Taro/React/TS（`src/`）

---

## 1. 审查概览

| 项 | 内容 |
|---|---|
| 审查时间 | 2026 年 8 月（对应当前仓库 HEAD） |
| 审查范围 | 后端：SecurityConfig、Jwt*、JwtUtil、application*.yml、.env.example、全部 Controller/Service/Impl、Entity、Mapper、common；<br>前端：request.ts、login.tsx、circle/detail/detail.tsx、services/*、types/constants.ts、pages/*（含分享/邀请） |
| 审查方法 | 源码逐行静态走查 + git 历史核查（`git log -S`）+ 配置与契约一致性比对 |
| 整体评级 | **高风险（C 级，不建议直接上线）** |
| 关键结论 | 密钥外部化、SQL 全参数化、勋章/进度核心逻辑较旧版有明显改进；但存在 **1 个 P0（文件接口未鉴权 + 路径穿越任意文件删除）** 与 **4 个 P1（计划接口越权、明文 HTTP、JWT/密钥不安全回退、隐私政策占位）**，属上线阻断项 |

---

## 2. 功能性问题清单

| 编号 | 级别 | 位置（文件:行） | 现象 | 影响 | 建议 |
|---|---|---|---|---|---|
| F-1 | P2 | `CheckinServiceImpl.java:142-172,154-165`；<br>`CircleServiceImpl.java:278-308,318-327` | 打卡进度口径不统一：用户级 `/stats/{planId}` 的 `completionRate` 仅统计 `plan_id=该计划` 的打卡天数（**不含宽松打卡**）；而圈子成员视图 `currentPlanProgress` 与 `getCirclePlanStats` 统计圈子时间范围内的**全部**打卡（含 `plan_id=null` 的宽松打卡）。同一用户个人计划进度可能为 0%，但圈子成员列表显示有进度。 | 用户困惑、跨接口数据口径矛盾 | 明确“宽松打卡是否计入计划进度”的统一口径，并在接口注释/文档中声明 |
| F-2 | P2 | `PlanServiceImpl.java:203-232` vs `CheckinServiceImpl.java:154-165` | `getPlanDetail` 返回的 `progress` 是**日历进度**（`passedDays/totalDays`，已过去天数占比），而 `/stats/{planId}` 的 `completionRate` 是**打卡完成率**（打卡天数/总天数），两者语义不同却都叫“进度”。 | 前端若混用会展示相互矛盾的进度条 | 区分命名（如 `calendarProgress` / `checkinCompletionRate`）或在前端明确各自含义 |
| F-3 | P3 | `src/context/UserContext.tsx:150` | `const token = user.token \|\| user.openid` —— 当登录响应缺少 `token` 时，以 `openid` 充当 token 写入本地并作为 `Bearer` 发往后端。 | 鉴权态异常、请求被拒、潜在 openid 外泄 | 不应以 openid 回退为 token；token 缺失应直接报错并重新登录 |
| F-4 | P3 | `src/services/CircleService.ts:63-64`；`CircleController.java`（无对应端点） | 前端 `generateNewInviteCode` 调用 `POST /circles/{circleId}/invite-code`，但后端 `CircleController` 未实现该端点 → 返回 404。 | “重新生成邀请码”功能不可用 | 实现后端端点，或下线前端入口，消除前后端契约不一致 |
| F-5 | P3 | `application.yml:27-29`；`entity/CircleMember.java:22-51` | 全局启用 `logic-delete-field: deleted`，但 `CircleMember` 实体无 `deleted` 字段 → 该配置对圈子成员表为**无效配置**（当前无“退圈”功能，故未造成计数错误）。 | 误导性配置；一旦后续加软删除易踩坑 | 明确是否需要软删除：不需要则移除该全局项，需要则补全字段与退圈逻辑 |
| F-6 | P3 | `BadgeCode.java:366-385`；`src/types/constants.ts:72-81` | 运动消耗/里程系数（`KCAL_PER_MIN`、`EXERCISE_SPEED_KMH`）在前后端各定义一份，依赖人工同步（代码注释已声明“必须同步”）。 | 一旦漂移，勋章/里程/消耗口径前后端不一致 | 以后端为单一数据源，前端不重复定义或加单测守护 |

**功能正确性确认（非问题）：** `BadgeCode` 共 19 种枚举齐全；kcal 计算口径 `Σ(duration × KCAL_PER_MIN[type])` 与 PRD `duration×KCAL_PER_MIN` 一致；勋章解锁/进度文本逻辑自洽；圈子成员统计 `daysInRange`/`memberCount` 在“无软删除”前提下计数准确。

---

## 3. 安全性问题清单（P0 优先）

| 编号 | 级别 | 位置（文件:行） | 现象 | 影响 | 建议 |
|---|---|---|---|---|---|
| S-1 | **P0** | `SecurityConfig.java:71-79`（`/files/**` permitAll）；<br>`FileController.java:39-114`（无 `@AuthenticationPrincipal`）；<br>`FileServiceImpl.java:108-151` | 文件上传/删除/存在性/信息接口**完全未鉴权**；且 `deleteFile`/`fileExists`/`getFileSize` 用 `fileUrl.replace(urlPrefix,"")` 拼接 `Paths.get(uploadPath, relativePath)`，**未 `.normalize()` 也未校验落于上传目录内**。 | 攻击者无需登录即可 `DELETE /api/files?fileUrl=/files/../../../../etc/passwd` **删除服务器任意文件**，或 `GET /api/files/exists?fileUrl=...` **探测任意文件是否存在**（nginx 已将该路径外暴露）。可导致服务器被破坏/拒绝服务、信息泄露。 | ① 所有文件接口加认证；② 删除/探测限制为文件属主或管理员；③ 路径解析后 `normalize()` 并断言 `startsWith(uploadDir)`；④ 上传除扩展名白名单外应校验真实 MIME/内容头，限制可写目录不可执行 |
| S-2 | P1 | `CheckinController.java:237-251,256-268,273-296` → `CheckinServiceImpl.java:317-341` | 计划级接口 `getPlanCheckinRecords(planId,page,size)`、`getPlanCheckinStats(planId)`、`getPlanDailyStats(planId,...)` **不接收 userId、不校验圈子成员**。而同文件用户级接口 `/records/{planId}`、`/stats/{planId}` 却做了 `isCircleMember` 校验。 | 任意已登录用户可枚举任意 `planId` 的全部打卡记录（含 `photoUrl`、`remark`、`userId`、`duration`、`exerciseType`）与统计 → **跨圈子隐私泄露（IDOR/越权）** | 在三个接口增加 `circleService.isCircleMember(plan.getCircleId(), userId)` 校验，与用户级接口保持一致；或明确其为“圈子公开看板”并在文档声明 |
| S-3 | P1 | `src/utils/request.ts:7` `const BASE_URL = 'http://124.222.95.76/api'` | 所有请求（含 `Authorization: Bearer <token>`、昵称/头像等 PII）走**明文 HTTP**；服务器 IP 暴露在公开前端包中。同时 `src/types/constants.ts:8` 定义了未被使用的 `https://keepall.cloud/api`（`API_BASE_URL`），存在配置漂移。 | 中间人可窃听/篡改 token 与数据；违反微信小程序生产环境强制 HTTPS 合法域名要求 | 统一使用 HTTPS 域名（环境变量/配置注入），移除明文 IP；在微信后台配置合法 request 域名 |
| S-4 | P1 | `application.yml:39` `secret: ${JWT_SECRET:fitness-checkin-dev-secret-key-placeholder}`；<br>`application-prod.yml:6` `password: ${DB_PASSWORD:your_password}`；<br>`application-prod.yml:38-40`（wechat 默认值） | JWT 密钥、数据库密码、微信密钥均通过环境变量注入，但**提供了可用回退默认值**。若生产未注入 `JWT_SECRET`，则使用公开仓库中已知的占位密钥签名 JWT → 任何人都可伪造任意用户 token 越权；DB 密码同理回退为 `your_password`。 | 密钥一旦未配置即等于公开，**可伪造 token 接管任意账户**（高危）；数据库口令弱默认值。 | 生产 profile 下 `JWT_SECRET`/`DB_PASSWORD`/`WECHAT_*` 缺失时**启动失败（fail-fast）**，不提供可用默认值；密钥强度 ≥32 字节随机值；确认 `/opt/fitness-checkin/.env` 已正确注入 |
| S-5 | 已核查安全 | 各 `*Mapper.java` | 全部自定义 `@Select` 均使用 `#{}` 参数化（`CheckinRecordMapper`/`CircleMemberMapper`/`PlanMapper` 全部符合），未发现 `${}` 字符串拼接。聚合统计口径正确。 | — | **SQL 注入风险低**，无需整改（保留参数化规范即可） |
| S-6 | P2 | `SecurityConfig.java:75-78` | `/actuator/**`、`/swagger-ui/**`、`/v3/api-docs/**` 全部 `permitAll`。 | 生产若引入 actuator，则 `/actuator/env`、`/actuator/health`、`/actuator/metrics` 及完整 API 文档对外公开 → 信息泄露 | 生产关闭 actuator 端点暴露；Swagger 仅开发环境启用且要求认证 |
| S-7 | P2 | `SecurityConfig.java:95-98` | CORS `allowedOriginPatterns("*")` 且 `allowCredentials(true)`。 | 允许任意来源携带凭据访问（理论上面向浏览器的 CSRF/凭据滥用；小程序场景影响有限，但有 Web 端即高危） | 明确来源白名单，非必要不开启 credentials |
| S-8 | P2 | `AuthController.java:45-50`；`CircleController.java:65-76` | 登录、邀请加入等关键接口**无速率限制**。 | 微信 code 接口可被刷、邀请码可被爆破（8 位虽难但无防护）、资源耗尽 | 关键接口加限流（如 Redis 滑动窗口） |
| S-9 | P3 | `CheckinController.java:80` `Result.error(500, e.getMessage())`（Circle/PlanController 类似） | 部分接口将原始异常消息直接返回客户端。 | 内部异常信息（可能含 SQL/路径细节）暴露给前端 | 对外仅返回通用错误码，细节记日志 |
| S-10 | P3 | `JwtAuthenticationProvider.java`（整类）；`JwtAuthenticationFilter.java` | `JwtAuthenticationProvider` 为**未使用的死代码**（实际鉴权在 Filter 内完成，未接入 AuthenticationManager）。 | 维护混乱、易被误用 | 删除或真正接入 AuthenticationManager |
| S-11 | P3 | `AuthController.java:47` | `wxLogin` 以 INFO 级别 `logger.info("微信登录请求: {}", request.getCode())` 记录微信 `code`（短时效凭证）。 | 敏感凭证落入日志 | 不记录 code 等敏感凭证 |

---

## 4. 合规性问题清单（微信规则 / PIPL / 公开仓库凭据）

| 编号 | 级别 | 位置（文件:行） | 现象 | 影响 | 建议 |
|---|---|---|---|---|---|
| C-1 | P1 | `src/pages/login/login.tsx:114,123` | 登录页勾选“已阅读并同意《用户协议》《隐私政策》”，但链接指向 `https://example.com/agreement` 与 `https://example.com/privacy` **占位页**，无真实可访问的隐私政策。 | 违反 PIPL“告知-同意”要求，且违反微信小程序平台《隐私保护指引》必须配置**真实隐私政策链接**的审核规则 → **上线驳回项** | 部署真实隐私政策与用户协议页面并替换链接，落实告知-同意；在小程序后台填写隐私协议 |
| C-2 | P2 | git 历史：提交 `fa29e4a`、`089fd9c`、`f76220b`、`0fef9fe` 含旧数据库密码 `Fitness@2026`（已于 2026-08-12 失效） | 公开仓库保留含旧密码的提交历史。 | 历史凭据泄露（当前已失效，影响有限），但违反凭据保密实践；若有人复用同密码仍有风险 | 评估改写历史（`git filter-repo`）或将仓库转为私有；强化“密钥不入库”流程。补充：经核查**当前代码 HEAD 已无真实硬编码密钥**，旧 JWT 密钥 `fitness-checkin-jwt-secret-key-2026-very-secure` 也未出现在 git 历史；当前仅保留不安全回退默认值（见 S-4） |
| C-3 | P2 | `src/pages/login/login.tsx:42` `Taro.getUserProfile` | 使用**已废弃**的 `getUserProfile` 获取昵称/头像。 | 微信已要求使用“头像昵称填写”组件（`button open-type=chooseAvatar` + nickname 输入框），旧接口在新版可能受限或被驳回 | 迁移到官方头像昵称填写能力，遵循最小必要原则 |
| C-4 | P2 | `CircleServiceImpl.java:189,197-202`（返回 `inviteCode`、`creator.openid`）；`getCircleMembers` 返回各成员信息 | 圈子内任意成员可获取其他成员的 `openid`（跨应用稳定标识）。 | openid 属个人信息，向同圈子其他用户泄露超出最小必要原则 | 仅在必要时返回，或对 openid 脱敏、不向其他成员返回 |
| C-5 | P3 | `src/pages/login/login.tsx:63-66` | 收集 `gender`/`province`/`city` 等个人信息。 | 需确认隐私政策已覆盖其收集目的与最小化 | 复核数据最小化，仅在必要且已告知时收集 |

---

## 5. 风险总表（按严重级别）

| 级别 | 数量 | 编号 |
|---|---|---|
| **P0** | 1 | S-1（文件接口未鉴权 + 路径穿越任意文件删除） |
| **P1** | 4 | S-2（计划接口越权）、S-3（明文 HTTP）、S-4（JWT/密钥不安全回退）、C-1（隐私政策占位） |
| **P2** | 8 | S-6（actuator/swagger 公开）、S-7（CORS 通配凭据）、S-8（无限流）、F-1（进度口径不统一）、F-2（进度语义混淆）、C-2（git 历史旧密码）、C-3（getUserProfile 废弃）、C-4（openid 向成员暴露） |
| **P3** | 8 | S-9（异常消息外泄）、S-10（死代码）、S-11（日志记 code）、F-3（openid 当 token）、F-4（契约不一致）、F-5（无效软删除配置）、F-6（前后端常量漂移）、C-5（个人信息最小化） |

---

## 6. 修复优先级建议与结论

**必须（上线前阻断）：**
- **P0 S-1**：文件接口加鉴权 + 路径穿越修复（`.normalize()` + 目录前缀校验），上传校验真实内容类型。
- **P1 S-2**：计划级接口补齐 `isCircleMember` 成员校验。
- **P1 S-3**：全站 HTTPS，移除明文 IP，统一基址配置。
- **P1 S-4**：JWT/DB/微信密钥缺失时 fail-fast，不提供可用默认值；确认生产 `.env` 已注入强随机密钥。
- **P1 C-1**：部署真实隐私政策与用户协议并替换占位链接。

**应当（尽快）：** P2 全部 —— actuator/swagger 收敛、CORS 白名单、关键接口限流、进度口径统一（F-1/F-2）、git 历史旧密码处理（C-2）、`getUserProfile` 迁移（C-3）、`openid` 收敛（C-4）。

**建议（后续）：** P3 清理项（异常消息脱敏、删除死代码、日志脱敏、契约对齐、配置与常量单一来源、个人信息最小化）。

**结论：** 整体评级 **高风险（C 级）**。相较旧报告，当前代码在**密钥外部化、SQL 全参数化、勋章/进度核心逻辑**上已有显著改进，但 **文件上传/删除的未鉴权 + 路径穿越（P0）** 与若干 **P1（越权、明文传输、密钥不安全回退、隐私政策占位）** 属上线阻断项。建议优先修复 P0/P1 并复测后再上线。

---

*备注：本报告为只读静态审查，未执行业务或安全测试；未运行应用。所有结论基于当前仓库 HEAD 源码与 git 历史核查。*
