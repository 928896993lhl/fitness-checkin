#!/bin/bash

# 健身打卡小程序部署脚本
# 使用方法: ./deploy.sh [环境] [操作]
# 环境: dev, prod
# 操作: install, update, restart, stop, status

set -e

# 配置变量
APP_NAME="fitness-checkin"
APP_DIR="/opt/fitness-checkin"
SERVICE_FILE="/etc/systemd/system/fitness-checkin.service"
NGINX_CONF="/etc/nginx/sites-available/fitness-checkin"
NGINX_LINK="/etc/nginx/sites-enabled/fitness-checkin"
BACKUP_DIR="/opt/fitness-checkin-backups"
LOG_DIR="/var/log/fitness-checkin"
DATA_DIR="/data/fitness-checkin"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印帮助信息
show_help() {
    echo "Usage: $0 [环境] [操作]"
    echo "环境:"
    echo "  dev    - 开发环境"
    echo "  prod   - 生产环境"
    echo "操作:"
    echo "  install  - 安装服务"
    echo "  update   - 更新服务"
    echo "  restart  - 重启服务"
    echo "  stop     - 停止服务"
    echo "  status   - 查看状态"
    echo "  logs     - 查看日志"
    echo "  backup   - 备份数据"
    echo "  restore  - 恢复数据"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}请使用root用户运行此脚本${NC}"
        exit 1
    fi
}

# 检查Java版本
check_java() {
    if ! command -v java &> /dev/null; then
        echo -e "${RED}Java未安装，请先安装Java 17+${NC}"
        exit 1
    fi
    
    java_version=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$java_version" -lt 17 ]; then
        echo -e "${RED}需要Java 17+，当前版本: $java_version${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Java版本检查通过: $(java -version 2>&1 | head -n 1)${NC}"
}

# 检查MySQL
check_mysql() {
    if ! command -v mysql &> /dev/null; then
        echo -e "${YELLOW}MySQL客户端未安装，跳过数据库检查${NC}"
        return
    fi
    
    echo -e "${GREEN}MySQL客户端检查通过${NC}"
}

# 创建目录结构
create_directories() {
    echo -e "${YELLOW}创建目录结构...${NC}"
    
    mkdir -p $APP_DIR
    mkdir -p $LOG_DIR
    mkdir -p $DATA_DIR/uploads
    mkdir -p $BACKUP_DIR
    
    echo -e "${GREEN}目录结构创建完成${NC}"
}

# 安装服务
install_service() {
    echo -e "${YELLOW}开始安装服务...${NC}"
    
    # 检查环境
    check_java
    check_mysql
    
    # 创建目录
    create_directories
    
    # 复制应用文件
    if [ -f "target/fitness-checkin-backend.jar" ]; then
        cp target/fitness-checkin-backend.jar $APP_DIR/
        echo -e "${GREEN}应用文件复制完成${NC}"
    else
        echo -e "${RED}未找到应用文件，请先构建项目${NC}"
        exit 1
    fi
    
    # 复制配置文件
    cp -r sql $APP_DIR/
    cp -r deploy $APP_DIR/
    cp -r nginx $APP_DIR/
    
    # 安装systemd服务
    cp deploy/fitness-checkin.service $SERVICE_FILE
    systemctl daemon-reload
    systemctl enable fitness-checkin
    
    # 配置Nginx
    if [ -d "/etc/nginx/sites-available" ]; then
        cp nginx/nginx.conf $NGINX_CONF
        ln -sf $NGINX_CONF $NGINX_LINK
        nginx -t && systemctl reload nginx
        echo -e "${GREEN}Nginx配置完成${NC}"
    else
        echo -e "${YELLOW}Nginx未安装，跳过Nginx配置${NC}"
    fi
    
    # 初始化数据库
    read -p "是否初始化数据库？(y/N): " init_db
    if [ "$init_db" = "y" ] || [ "$init_db" = "Y" ]; then
        read -p "请输入MySQL用户名: " mysql_user
        read -s -p "请输入MySQL密码: " mysql_password
        echo
        
        mysql -u $mysql_user -p$mysql_password < $APP_DIR/sql/init.sql
        echo -e "${GREEN}数据库初始化完成${NC}"
    fi
    
    # 启动服务
    systemctl start fitness-checkin
    echo -e "${GREEN}服务安装完成${NC}"
    
    # 显示状态
    show_status
}

# 更新服务
update_service() {
    echo -e "${YELLOW}开始更新服务...${NC}"
    
    # 备份当前版本
    backup_data
    
    # 停止服务
    systemctl stop fitness-checkin
    
    # 更新应用文件
    if [ -f "target/fitness-checkin-backend.jar" ]; then
        cp target/fitness-checkin-backend.jar $APP_DIR/
        echo -e "${GREEN}应用文件更新完成${NC}"
    else
        echo -e "${RED}未找到应用文件，请先构建项目${NC}"
        exit 1
    fi
    
    # 重启服务
    systemctl start fitness-checkin
    echo -e "${GREEN}服务更新完成${NC}"
    
    # 显示状态
    show_status
}

# 重启服务
restart_service() {
    echo -e "${YELLOW}重启服务...${NC}"
    systemctl restart fitness-checkin
    echo -e "${GREEN}服务重启完成${NC}"
    show_status
}

# 停止服务
stop_service() {
    echo -e "${YELLOW}停止服务...${NC}"
    systemctl stop fitness-checkin
    echo -e "${GREEN}服务停止完成${NC}"
}

# 查看状态
show_status() {
    echo -e "${YELLOW}服务状态:${NC}"
    systemctl status fitness-checkin --no-pager
    
    echo -e "\n${YELLOW}端口监听:${NC}"
    netstat -tlnp | grep 8080 || echo "未监听8080端口"
    
    echo -e "\n${YELLOW}最近日志:${NC}"
    journalctl -u fitness-checkin --no-pager -n 20
}

# 查看日志
show_logs() {
    journalctl -u fitness-checkin -f
}

# 备份数据
backup_data() {
    echo -e "${YELLOW}开始备份数据...${NC}"
    
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="$BACKUP_DIR/backup_$timestamp.tar.gz"
    
    # 备份数据库
    if command -v mysqldump &> /dev/null; then
        read -p "请输入MySQL用户名: " mysql_user
        read -s -p "请输入MySQL密码: " mysql_password
        echo
        
        mysqldump -u $mysql_user -p$mysql_password fitness_checkin > $BACKUP_DIR/db_$timestamp.sql
        echo -e "${GREEN}数据库备份完成${NC}"
    fi
    
    # 备份上传文件
    tar -czf $backup_file -C $DATA_DIR uploads/
    echo -e "${GREEN}文件备份完成: $backup_file${NC}"
}

# 恢复数据
restore_data() {
    echo -e "${YELLOW}可用备份文件:${NC}"
    ls -lh $BACKUP_DIR/*.tar.gz 2>/dev/null || echo "无备份文件"
    
    read -p "请输入要恢复的备份文件名: " backup_file
    
    if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
        echo -e "${RED}备份文件不存在${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}恢复数据...${NC}"
    
    # 停止服务
    systemctl stop fitness-checkin
    
    # 恢复文件
    tar -xzf "$BACKUP_DIR/$backup_file" -C $DATA_DIR/
    
    # 恢复数据库
    read -p "是否恢复数据库？(y/N): " restore_db
    if [ "$restore_db" = "y" ] || [ "$restore_db" = "Y" ]; then
        read -p "请输入MySQL用户名: " mysql_user
        read -s -p "请输入MySQL密码: " mysql_password
        echo
        
        # 查找最新的数据库备份
        db_backup=$(ls -t $BACKUP_DIR/db_*.sql 2>/dev/null | head -n 1)
        if [ -n "$db_backup" ]; then
            mysql -u $mysql_user -p$mysql_password fitness_checkin < $db_backup
            echo -e "${GREEN}数据库恢复完成${NC}"
        else
            echo -e "${YELLOW}未找到数据库备份文件${NC}"
        fi
    fi
    
    # 启动服务
    systemctl start fitness-checkin
    echo -e "${GREEN}数据恢复完成${NC}"
}

# 主函数
main() {
    # 检查参数
    if [ $# -lt 2 ]; then
        show_help
        exit 1
    fi
    
    ENV=$1
    ACTION=$2
    
    # 检查root权限
    check_root
    
    # 执行操作
    case $ACTION in
        install)
            install_service
            ;;
        update)
            update_service
            ;;
        restart)
            restart_service
            ;;
        stop)
            stop_service
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        backup)
            backup_data
            ;;
        restore)
            restore_data
            ;;
        *)
            echo -e "${RED}未知操作: $ACTION${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"