import base64
import struct
import zlib

def create_png(width, height, color):
    """创建简单的PNG图标"""
    def create_chunk(chunk_type, data):
        chunk = chunk_type + data
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', zlib.crc32(chunk) & 0xffffffff)
    
    # PNG文件头
    header = b'\x89PNG\r\n\x1a\n'
    
    # IHDR块
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = create_chunk(b'IHDR', ihdr_data)
    
    # IDAT块 - 创建简单的纯色图像
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # 每行开始的过滤字节
        for x in range(width):
            raw_data += bytes(color)
    
    compressed = zlib.compress(raw_data)
    idat = create_chunk(b'IDAT', compressed)
    
    # IEND块
    iend = create_chunk(b'IEND', b'')
    
    return header + ihdr + idat + iend

# 颜色定义
gray = (153, 153, 153)  # 灰色 - 未选中
blue = (74, 144, 226)   # 蓝色 - 选中

# 创建图标
icons = {
    'home.png': gray,
    'home-active.png': blue,
    'circle.png': gray,
    'circle-active.png': blue,
    'profile.png': gray,
    'profile-active.png': blue
}

output_dir = r'C:\Users\liao\WorkBuddy\2026-08-01-00-47-09\dist\assets\tabbar'

for filename, color in icons.items():
    png_data = create_png(24, 24, color)
    filepath = f'{output_dir}\\{filename}'
    with open(filepath, 'wb') as f:
        f.write(png_data)
    print(f'Created: {filename}')

print('All icons created!')
