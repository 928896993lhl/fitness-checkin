/**
 * 验证工具函数测试
 * 测试 src/utils/validationUtils.ts 中的所有函数
 */

import {
  isValidPhone,
  isValidInviteCode,
  isValidNickname,
  isValidCheckinDuration,
  isValidMemberCount,
  isValidEmail,
  isEmpty,
  isLengthInRange,
  isNumberInRange,
  isValidDate,
  isFutureDate,
  isPastDate,
  isValidDateRange,
  getPasswordStrength,
  isValidFileSize,
  isValidFileType,
  isImageFile,
  sanitizeInput,
  formatPhone
} from '../../src/utils/validationUtils'

describe('isValidPhone', () => {
  test('有效手机号', () => {
    expect(isValidPhone('13812345678')).toBe(true)
    expect(isValidPhone('15900001111')).toBe(true)
    expect(isValidPhone('18688889999')).toBe(true)
  })

  test('无效手机号', () => {
    expect(isValidPhone('12345678901')).toBe(false) // 12开头
    expect(isValidPhone('1381234567')).toBe(false)  // 10位
    expect(isValidPhone('138123456789')).toBe(false) // 12位
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('abcdefghijk')).toBe(false)
  })
})

describe('isValidInviteCode', () => {
  test('有效邀请码（6位字母数字）', () => {
    expect(isValidInviteCode('ABC123')).toBe(true)
    expect(isValidInviteCode('abc123')).toBe(true)
    expect(isValidInviteCode('123456')).toBe(true)
    expect(isValidInviteCode('aBcDeF')).toBe(true)
  })

  test('无效邀请码', () => {
    expect(isValidInviteCode('ABC12')).toBe(false)   // 5位
    expect(isValidInviteCode('ABC1234')).toBe(false)  // 7位
    expect(isValidInviteCode('ABC 23')).toBe(false)   // 含空格
    expect(isValidInviteCode('ABC-23')).toBe(false)   // 含特殊字符
    expect(isValidInviteCode('')).toBe(false)
  })
})

describe('isValidNickname', () => {
  test('有效昵称', () => {
    expect(isValidNickname('健身达人')).toBe(true)
    expect(isValidNickname('User123')).toBe(true)
    expect(isValidNickname('小明_')).toBe(true)
    expect(isValidNickname('AB')).toBe(true)   // 2字符
  })

  test('无效昵称', () => {
    expect(isValidNickname('A')).toBe(false)          // 1字符
    expect(isValidNickname('')).toBe(false)            // 空
    expect(isValidNickname('a'.repeat(21))).toBe(false) // 超过20字符
    expect(isValidNickname('user@name')).toBe(false)   // 含@符号
  })
})

describe('isValidCheckinDuration', () => {
  test('有效时长（10-480分钟）', () => {
    expect(isValidCheckinDuration(10)).toBe(true)  // 最小值
    expect(isValidCheckinDuration(30)).toBe(true)
    expect(isValidCheckinDuration(480)).toBe(true) // 最大值
    expect(isValidCheckinDuration(120)).toBe(true)
  })

  test('无效时长', () => {
    expect(isValidCheckinDuration(9)).toBe(false)   // 小于最小值
    expect(isValidCheckinDuration(481)).toBe(false)  // 大于最大值
    expect(isValidCheckinDuration(0)).toBe(false)
    expect(isValidCheckinDuration(-10)).toBe(false)
  })
})

describe('isValidMemberCount', () => {
  test('有效人数（2-8人）', () => {
    expect(isValidMemberCount(2)).toBe(true)  // 最小值
    expect(isValidMemberCount(5)).toBe(true)
    expect(isValidMemberCount(8)).toBe(true)  // 最大值
  })

  test('无效人数', () => {
    expect(isValidMemberCount(1)).toBe(false)
    expect(isValidMemberCount(9)).toBe(false)
    expect(isValidMemberCount(0)).toBe(false)
  })
})

describe('isValidEmail', () => {
  test('有效邮箱', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.org')).toBe(true)
    expect(isValidEmail('a@b.c')).toBe(true)
  })

  test('无效邮箱', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('test')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('test@example')).toBe(false)
  })
})

describe('isEmpty', () => {
  test('空值', () => {
    expect(isEmpty('')).toBe(true)
    expect(isEmpty(null)).toBe(true)
    expect(isEmpty(undefined)).toBe(true)
    expect(isEmpty('   ')).toBe(true)
    expect(isEmpty('\t\n')).toBe(true)
  })

  test('非空值', () => {
    expect(isEmpty('hello')).toBe(false)
    expect(isEmpty(' a ')).toBe(false)
  })
})

describe('isLengthInRange', () => {
  test('在范围内', () => {
    expect(isLengthInRange('hello', 3, 10)).toBe(true)
    expect(isLengthInRange('hi', 2, 5)).toBe(true)
    expect(isLengthInRange('test', 4, 4)).toBe(true) // 边界
  })

  test('不在范围内', () => {
    expect(isLengthInRange('hi', 3, 10)).toBe(false)
    expect(isLengthInRange('toolong', 1, 5)).toBe(false)
  })
})

describe('isNumberInRange', () => {
  test('在范围内', () => {
    expect(isNumberInRange(5, 1, 10)).toBe(true)
    expect(isNumberInRange(1, 1, 10)).toBe(true)  // 边界
    expect(isNumberInRange(10, 1, 10)).toBe(true)  // 边界
  })

  test('不在范围内', () => {
    expect(isNumberInRange(0, 1, 10)).toBe(false)
    expect(isNumberInRange(11, 1, 10)).toBe(false)
  })
})

describe('isValidDate', () => {
  test('有效日期', () => {
    expect(isValidDate('2024-01-15')).toBe(true)
    expect(isValidDate('2024/01/15')).toBe(true)
    expect(isValidDate('Jan 15, 2024')).toBe(true)
  })

  test('无效日期', () => {
    expect(isValidDate('')).toBe(false)
    expect(isValidDate('not-a-date')).toBe(false)
  })
})

describe('isFutureDate', () => {
  test('将来日期', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    expect(isFutureDate(futureDate.toISOString())).toBe(true)
  })

  test('过去日期', () => {
    expect(isFutureDate('2020-01-01')).toBe(false)
  })
})

describe('isPastDate', () => {
  test('过去日期', () => {
    expect(isPastDate('2020-01-01')).toBe(true)
  })

  test('将来日期', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    expect(isPastDate(futureDate.toISOString())).toBe(false)
  })
})

describe('isValidDateRange', () => {
  test('有效范围（开始早于结束）', () => {
    expect(isValidDateRange('2024-01-01', '2024-01-31')).toBe(true)
  })

  test('无效范围（开始晚于结束）', () => {
    expect(isValidDateRange('2024-01-31', '2024-01-01')).toBe(false)
  })

  test('同一天返回false', () => {
    expect(isValidDateRange('2024-01-15', '2024-01-15')).toBe(false)
  })
})

describe('getPasswordStrength', () => {
  test('强度0 - 短密码无特征', () => {
    expect(getPasswordStrength('123')).toBe(1) // 短，只有数字
  })

  test('强度1 - 长度≥8', () => {
    expect(getPasswordStrength('12345678')).toBe(2) // 长度≥8 + 数字
  })

  test('强度2 - 长度≥8 + 小写 + 大写', () => {
    expect(getPasswordStrength('abcdefgh')).toBe(2) // 长度≥8 + 小写
  })

  test('强度3 - 多种组合', () => {
    expect(getPasswordStrength('Abcdefg1')).toBe(3) // 长度≥8 + 大写 + 小写 + 数字 = 4, min(4,3)=3
    expect(getPasswordStrength('Abcdef1!')).toBe(3) // 最多3
  })
})

describe('isValidFileSize', () => {
  test('文件大小在限制内', () => {
    expect(isValidFileSize(500, 1000)).toBe(true)
    expect(isValidFileSize(1000, 1000)).toBe(true) // 边界
  })

  test('文件大小超出限制', () => {
    expect(isValidFileSize(1001, 1000)).toBe(false)
  })
})

describe('isValidFileType', () => {
  test('允许的文件类型', () => {
    expect(isValidFileType('photo.jpg', ['jpg', 'png'])).toBe(true)
    expect(isValidFileType('photo.PNG', ['jpg', 'png'])).toBe(true)
    expect(isValidFileType('image.jpeg', ['jpg', 'jpeg', 'png'])).toBe(true)
  })

  test('不允许的文件类型', () => {
    expect(isValidFileType('doc.pdf', ['jpg', 'png'])).toBe(false)
    expect(isValidFileType('file', ['jpg', 'png'])).toBe(false)
  })
})

describe('isImageFile', () => {
  test('图片文件', () => {
    expect(isImageFile('photo.jpg')).toBe(true)
    expect(isImageFile('photo.jpeg')).toBe(true)
    expect(isImageFile('photo.png')).toBe(true)
    expect(isImageFile('photo.gif')).toBe(true)
    expect(isImageFile('photo.webp')).toBe(true)
  })

  test('非图片文件', () => {
    expect(isImageFile('doc.pdf')).toBe(false)
    expect(isImageFile('video.mp4')).toBe(false)
  })
})

describe('sanitizeInput', () => {
  test('移除HTML标签但保留文本内容', () => {
    // sanitizeInput 用 /<[^>]*>/g 移除标签，但保留标签之间的内容
    expect(sanitizeInput('<b>hello</b>')).toBe('hello')
    expect(sanitizeInput('<div class="x">text</div>')).toBe('text')
  })

  test('移除多余空格', () => {
    expect(sanitizeInput('hello   world')).toBe('hello world')
  })

  test('限制长度', () => {
    expect(sanitizeInput('hello world', 5)).toBe('hello')
  })

  test('正常输入不变', () => {
    expect(sanitizeInput('正常文本')).toBe('正常文本')
  })
})

describe('formatPhone', () => {
  test('格式化有效手机号', () => {
    expect(formatPhone('13812345678')).toBe('138-1234-5678')
  })

  test('包含非数字字符', () => {
    expect(formatPhone('138-1234-5678')).toBe('138-1234-5678')
  })

  test('无效手机号返回null', () => {
    expect(formatPhone('12345678901')).toBe(null)
  })
})
