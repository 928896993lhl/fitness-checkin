import paramiko
import logging

# 启用详细日志
logging.basicConfig()
logging.getLogger().setLevel(logging.DEBUG)

hostname = '124.222.95.76'
port = 22
username = 'root'
key_file = r'C:\Users\liao\Downloads\desk.pem'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    # 尝试使用密钥连接
    print(f"尝试使用密钥连接 {hostname}...")
    pkey = paramiko.RSAKey.from_private_key_file(key_file)
    client.connect(hostname, port, username, pkey=pkey, timeout=10)
    print("SSH连接成功！")
    
    stdin, stdout, stderr = client.exec_command('uname -a')
    print(f"系统信息: {stdout.read().decode()}")
    
except paramiko.AuthenticationException as e:
    print(f"认证失败: {e}")
    print("\n可能的原因:")
    print("1. 服务器上未正确添加公钥")
    print("2. authorized_keys文件权限不正确")
    print("3. SSH配置不允许root登录")
except Exception as e:
    print(f"连接失败: {e}")
finally:
    client.close()
