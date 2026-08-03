# 健身打卡小程序后端

基于Spring Boot 3.2+的健身打卡小程序后端服务。

## 技术栈

- Spring Boot 3.2+
- MyBatis-Plus
- MySQL 8.0
- JWT认证
- Spring Security

## 快速开始

### 1. 环境要求

- Java 17+
- MySQL 8.0+
- Maven 3.6+

### 2. 数据库初始化

```bash
mysql -u root -p < sql/init.sql
```

### 3. 配置文件

修改 `src/main/resources/application-dev.yml` 中的数据库连接信息。

### 4. 构建项目

```bash
mvn clean package -DskipTests
```

### 5. 运行项目

```bash
java -jar target/fitness-checkin-backend.jar --spring.profiles.active=dev
```

### 6. 访问API

- 基础URL: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html

## 项目结构

```
fitness-checkin-backend/
├── pom.xml                    # Maven配置
├── sql/                      # 数据库脚本
├── nginx/                    # Nginx配置
├── deploy/                   # 部署脚本
└── src/main/java/com/fitness/checkin/
    ├── config/              # 配置类
    ├── controller/          # 控制器
    ├── service/             # 服务层
    ├── mapper/              # 数据访问
    ├── entity/              # 实体类
    ├── dto/                 # 数据传输对象
    ├── common/              # 通用类
    ├── task/                # 定时任务
    └── util/                # 工具类
```

## API接口

### 认证接口
- `POST /auth/wx-login` - 微信登录
- `GET /auth/user-info` - 获取用户信息
- `POST /auth/refresh-token` - 刷新token

### 圈子接口
- `POST /circles` - 创建圈子
- `POST /circles/join` - 加入圈子
- `GET /circles/{circleId}` - 圈子详情
- `GET /circles/{circleId}/members` - 圈子成员
- `GET /circles/my` - 我的圈子

### 计划接口
- `POST /plans` - 创建计划
- `POST /plans/{planId}/start` - 启动计划
- `GET /plans/{planId}` - 计划详情
- `GET /plans/circle/{circleId}` - 圈子计划

### 打卡接口
- `POST /checkin` - 打卡
- `GET /checkin/records/{planId}` - 打卡记录
- `GET /checkin/stats/{planId}` - 打卡统计

### 文件接口
- `POST /files/upload` - 上传文件
- `POST /files/upload-image` - 上传图片

## 部署

### 生产环境部署

```bash
# 构建项目
mvn clean package -Pprod

# 部署服务
sudo ./deploy/deploy.sh prod install

# 更新服务
sudo ./deploy/deploy.sh prod update

# 查看状态
sudo ./deploy/deploy.sh prod status
```

### 环境变量配置

生产环境通过环境变量配置敏感信息：

```bash
export DB_USERNAME=fitness_user
export DB_PASSWORD=your_password
export REDIS_HOST=localhost
export REDIS_PORT=6379
export WECHAT_APPID=your_appid
export WECHAT_SECRET=your_secret
```

## 定时任务

- **每日汇总**: 每天20:00执行，生成每日打卡汇总
- **计划结束提醒**: 每天10:00执行，提醒即将结束的计划

## 开发说明

### 代码规范

- 遵循Google Java Style Guide
- 使用Lombok减少样板代码
- 统一异常处理
- 统一响应格式

### 测试

```bash
# 运行单元测试
mvn test

# 运行集成测试
mvn verify
```

## 许可证

MIT License