import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { HeatmapData, HeatmapDay } from '../../types'
import { HEATMAP_LEVELS } from '../../types/constants'
import { formatDate } from '../../utils/dateUtils'
import './Heatmap.scss'

interface HeatmapProps {
  data: HeatmapData
}

/**
 * 活跃度热力图组件
 * GitHub 风格：7 行（周日起始）× N 周，12px 格子；按 HEATMAP_LEVELS 着色；今日描边高亮；未来不渲染。
 * 点击格子弹当天明细，并可跳转历史页带日期筛选。
 */
const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  if (!data || !data.startDate || !data.endDate) {
    return (
      <View className='heatmap empty'>
        <Text className='heatmap-empty-text'>暂无热力图数据</Text>
      </View>
    )
  }

  /**
   * 解析 YYYY-MM-DD 为本地 Date
   */
  const parseDate = (s: string): Date => {
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  /**
   * 构建日期 → 打卡数据映射
   */
  const dayMap: Record<string, HeatmapDay> = {}
  ;(data.days || []).forEach(day => {
    dayMap[day.date] = day
  })

  const start = parseDate(data.startDate)
  const end = parseDate(data.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 网格起始：startDate 所在周的周日（含）
  const gridStart = new Date(start)
  gridStart.setDate(start.getDate() - start.getDay())

  // 展开 7 行 × N 周；仅保留 [start, min(end, today)] 内的日期，其余置 null
  const weeks: (Date | null)[][] = []
  const cursor = new Date(gridStart)
  while (cursor <= end) {
    const column: (Date | null)[] = []
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(cursor)
      const inRange = cellDate >= start && cellDate <= end && cellDate <= today
      column.push(inRange ? cellDate : null)
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(column)
  }

  /**
   * 根据分钟数取色阶颜色
   */
  const getLevelColor = (minutes: number): string => {
    let color: string = HEATMAP_LEVELS[0].color
    for (const level of HEATMAP_LEVELS) {
      if (minutes >= level.min) {
        color = level.color
      }
    }
    return color
  }

  /**
   * 判断是否今日
   */
  const isToday = (date: Date): boolean => {
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  /**
   * 点击格子：弹当天明细 + 跳历史页带日期筛选
   */
  const handleCellTap = (date: Date) => {
    const dateStr = formatDate(date, 'YYYY-MM-DD')
    const day = dayMap[dateStr]
    const minutes = day ? day.minutes : 0
    const count = day ? day.count : 0
    Taro.showModal({
      title: dateStr,
      content: `总时长 ${minutes} 分钟 · 打卡 ${count} 次`,
      confirmText: '查看记录',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({
            url: `/pages/profile/history/history?startDate=${dateStr}&endDate=${dateStr}`
          })
        }
      }
    })
  }

  const weekLabels = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <View className='heatmap'>
      <ScrollView
        className='heatmap-scroll'
        scrollX
        enhanced
        showScrollbar={false}
      >
        <View className='heatmap-inner'>
          <View className='heatmap-week-labels'>
            {weekLabels.map(label => (
              <View key={label} className='week-label-cell'>
                <Text className='week-label-text'>{label}</Text>
              </View>
            ))}
          </View>
          <View className='heatmap-grid'>
            {weeks.map((column, weekIndex) => (
              <View key={weekIndex} className='heatmap-column'>
                {column.map((cellDate, dayIndex) => {
                  if (!cellDate) {
                    return <View key={dayIndex} className='heatmap-cell placeholder' />
                  }
                  const dateStr = formatDate(cellDate, 'YYYY-MM-DD')
                  const day = dayMap[dateStr]
                  const minutes = day ? day.minutes : 0
                  return (
                    <View
                      key={dayIndex}
                      className={`heatmap-cell ${isToday(cellDate) ? 'today' : ''}`}
                      style={{ backgroundColor: getLevelColor(minutes) }}
                      onClick={() => handleCellTap(cellDate)}
                    />
                  )
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 图例 */}
      <View className='heatmap-legend'>
        <Text className='legend-label'>少</Text>
        {HEATMAP_LEVELS.map(level => (
          <View
            key={level.min}
            className='legend-cell'
            style={{ backgroundColor: level.color }}
          />
        ))}
        <Text className='legend-label'>多</Text>
      </View>
    </View>
  )
}

export default Heatmap
