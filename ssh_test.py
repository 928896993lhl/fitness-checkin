import paramiko
import sys

# SSH连接配置
hostname = '124.222.95.76'
port = 22
username = 'root'
password = '2016Iamfine!'

# 创建SSH客户端
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    # 连接服务器
    print(f"正在连接 {hostname}...")
    client.connect(hostname, port, username, password, timeout=10)
    print("SSH连接成功！")
    
    # 执行命令
    stdin, stdout, stderr = client.exec_command('uname -a')
    print(f"系统信息: {stdout.read().decode()}")
    
    # 检查Java版本
    stdin, stdout, stderr = client.exec_command('java -version 2>&1')
    print(f"Java版本: {stdout.read().decode()}")
    
    # 检查MySQL状态
    stdin, stdout, stderr = client.exec_command('systemctl status mysql 2>&1 | head -5')
    print(f"MySQL状态: {stdout.read().decode()}")
    
    # 检查Nginx状态
    stdin, stdout, stderr = client.exec_command('systemctl status nginx 2>&1 | head -5')
    print(f"Nginx状态: {stdout.read().decode()}")
    
except Exception as e:
    print(f"连接失败: {e}")
finally:
    client.close()
    print("连接已关闭")
