import Taro from '@tarojs/taro'
import { CHECKIN_RULES } from '../types/constants'

/**
 * 图片处理工具函数
 */

/**
 * 压缩图片
 * @param filePath 图片文件路径
 * @param quality 压缩质量（0-100）
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @returns 压缩后的图片路径
 */
export async function compressImage(
  filePath: string,
  quality: number = CHECKIN_RULES.PHOTO_QUALITY,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<string> {
  try {
    const res = await Taro.compressImage({
      src: filePath,
      quality
    })
    
    return res.tempFilePath
  } catch (error) {
    console.error('压缩图片失败:', error)
    return filePath
  }
}

/**
 * 获取图片信息
 * @param filePath 图片文件路径
 * @returns 图片信息
 */
export async function getImageInfo(filePath: string): Promise<{
  width: number
  height: number
  size: number
  type: string
}> {
  try {
    const info = await Taro.getImageInfo({
      src: filePath
    })
    
    const fileInfo = await Taro.getFileInfo({
      filePath
    })
    
    return {
      width: info.width,
      height: info.height,
      size: fileInfo.size,
      type: info.type || 'unknown'
    }
  } catch (error) {
    console.error('获取图片信息失败:', error)
    throw error
  }
}

/**
 * 验证图片大小
 * @param filePath 图片文件路径
 * @param maxSize 最大大小（字节）
 * @returns 是否符合大小要求
 */
export async function validateImageSize(
  filePath: string,
  maxSize: number = CHECKIN_RULES.MAX_PHOTO_SIZE
): Promise<boolean> {
  try {
    const fileInfo = await Taro.getFileInfo({
      filePath
    })
    
    return fileInfo.size <= maxSize
  } catch (error) {
    console.error('验证图片大小失败:', error)
    return false
  }
}

/**
 * 选择图片
 * @param count 图片数量
 * @param sizeType 图片尺寸类型
 * @param sourceType 图片来源
 * @returns 选择的图片路径列表
 */
export async function chooseImage(
  count: number = 1,
  sizeType: ('original' | 'compressed')[] = ['compressed'],
  sourceType: ('album' | 'camera')[] = ['album', 'camera']
): Promise<string[]> {
  try {
    const res = await Taro.chooseImage({
      count,
      sizeType,
      sourceType
    })
    
    return res.tempFilePaths
  } catch (error) {
    console.error('选择图片失败:', error)
    return []
  }
}

/**
 * 预览图片
 * @param urls 图片URL列表
 * @param current 当前显示的图片URL
 */
export function previewImage(urls: string[], current?: string): void {
  Taro.previewImage({
    urls,
    current: current || urls[0]
  })
}

/**
 * 保存图片到相册
 * @param filePath 图片文件路径
 * @returns 是否保存成功
 */
export async function saveImageToPhotosAlbum(filePath: string): Promise<boolean> {
  try {
    await Taro.saveImageToPhotosAlbum({
      filePath
    })
    
    Taro.showToast({
      title: '保存成功',
      icon: 'success'
    })
    
    return true
  } catch (error) {
    console.error('保存图片失败:', error)
    
    if (error.errMsg && error.errMsg.includes('auth deny')) {
      Taro.showModal({
        title: '提示',
        content: '需要您授权保存图片到相册',
        success: (res) => {
          if (res.confirm) {
            Taro.openSetting()
          }
        }
      })
    } else {
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
    
    return false
  }
}

/**
 * 生成缩略图
 * @param filePath 原图路径
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @returns 缩略图路径
 */
export async function generateThumbnail(
  filePath: string,
  width: number = 200,
  height: number = 200
): Promise<string> {
  try {
    // 使用canvas生成缩略图
    const query = Taro.createSelectorQuery()
    const canvas = await new Promise<any>((resolve) => {
      query.select('#thumbnailCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          resolve(res[0])
        })
    })
    
    if (!canvas) {
      return filePath
    }
    
    const ctx = canvas.getContext('2d')
    const image = canvas.createImage()
    
    return new Promise((resolve) => {
      image.onload = () => {
        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(image, 0, 0, width, height)
        
        Taro.canvasToTempFilePath({
          canvas,
          success: (res) => {
            resolve(res.tempFilePath)
          },
          fail: () => {
            resolve(filePath)
          }
        })
      }
      
      image.onerror = () => {
        resolve(filePath)
      }
      
      image.src = filePath
    })
  } catch (error) {
    console.error('生成缩略图失败:', error)
    return filePath
  }
}

/**
 * 获取图片的Base64编码
 * @param filePath 图片文件路径
 * @returns Base64编码字符串
 */
export async function imageToBase64(filePath: string): Promise<string> {
  try {
    const fileSystemManager = Taro.getFileSystemManager()
    
    return new Promise((resolve, reject) => {
      fileSystemManager.readFile({
        filePath,
        encoding: 'base64',
        success: (res) => {
          resolve(res.data as string)
        },
        fail: (error) => {
          reject(error)
        }
      })
    })
  } catch (error) {
    console.error('图片转Base64失败:', error)
    throw error
  }
}

/**
 * 判断文件是否为图片
 * @param filePath 文件路径
 * @returns 是否为图片
 */
export function isImageFile(filePath: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  const lowerPath = filePath.toLowerCase()
  
  return imageExtensions.some(ext => lowerPath.endsWith(ext))
}

/**
 * 获取图片的MIME类型
 * @param filePath 文件路径
 * @returns MIME类型
 */
export function getImageMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp'
  }
  
  return mimeTypes[ext || ''] || 'image/jpeg'
}
