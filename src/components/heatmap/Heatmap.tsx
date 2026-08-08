import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { HeatmapData, HeatmapDay, HeatmapProps } from '../../types'
import { HEATMAP_LEVELS, CIRCLE_HEATMAP_LEVELS } from '../../types/constants'
import { formatDate } from '../../utils/dateUtils'
import './Heatmap.scss'

/**
 * 活跃度热力图组件
 * GitHub 风格：7 行（周日起始）× N 周格子；按色阶着色；今日描边高亮；未来不渲染。
 * - minutes 模式（默认）：12px 格子，按分钟用 HEATMAP_LEVELS 着色；点击弹当天明细并可跳历史页。
 * - members 模式（r3）：按人数用 CIRCLE_HEATMAP_LEVELS 着色；点击弹层仅展示"X人打卡·累计Y分钟"（不跳历史）。
 * - compact（r3）：8px 紧凑格子（我的页）；showMore/onMore（r3）：区块右上角"更多›"。
 * 默认值 = 现有行为，career 页零改动。
 */
const Heatmap: React.FC<HeatmapProps> = ({ data, compact, mode = 'minutes', showMore, onMore }) => {
  const levels = mode === 'members' ? CIRCLE_HEATMAP_LEVELS : HEATMAP_LEVELS

  /**
   * 滚动定位目标（r5 bugfix）：
   * 热力图 data 为异步加载，首次渲染 data 为空（无列可定位）；
   * 数据到达后 scrollTarget 从 '' 变为 'heatmap-last-col'，属性值变化才会触发 ScrollView 重新滚动到最后一列。
   */
  const [scrollTarget, setScrollTarget] = useState('')

  useEffect(() => {
    if (data && data.startDate && data.endDate) {
      setScrollTarget('heatmap-last-col')
    }
  }, [data?.startDate, data?.endDate])

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
  ;(data?.days || []).forEach(day => {
    dayMap[day.date] = day
  })

  const start = data && data.startDate ? parseDate(data.startDate) : null
  const end = data && data.endDate ? parseDate(data.endDate) : null
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 网格起始：startDate 所在周的周日（含）
  const gridStart = start ? new Date(start) : null
  if (gridStart) {
    gridStart.setDate(start!.getDate() - start!.getDay())
  }

  // 展开 7 行 × N 周；仅保留 [start, min(end, today)] 内的日期，其余置 null
  const weeks: (Date | null)[][] = []
  if (gridStart && end) {
    const cursor = new Date(gridStart)
    while (cursor <= end) {
      const column: (Date | null)[] = []
      for (let i = 0; i < 7; i++) {
        const cellDate = new Date(cursor)
        const inRange = cellDate >= start! && cellDate <= end && cellDate <= today
        column.push(inRange ? cellDate : null)
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(column)
    }
  }

  /**
   * 根据取值取色阶颜色（minutes 模式按分钟；members 模式按人数）
   */
  const getLevelColor = (value: number): string => {
    let color: string = levels[0].color
    for (const level of levels) {
      if (value >= level.min) {
        color = level.color
      }
    }
    return color
  }

  /**
   * 获取格子着色取值
   */
  const cellValue = (day?: HeatmapDay): number => {
    if (!day) return 0
    return mode === 'members' ? day.count : (day.minutes ?? 0)
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
   * 点击格子：members 模式弹"X人打卡·累计Y分钟"（不跳转）；minutes 模式弹明细并可跳历史页
   */
  const handleCellTap = (date: Date) => {
    const dateStr = formatDate(date, 'YYYY-MM-DD')
    const day = dayMap[dateStr]

    if (mode === 'members') {
      const count = day ? day.count : 0
      const totalMinutes = day ? (day.totalMinutes ?? 0) : 0
      Taro.showModal({
        title: dateStr,
        content: `${count} 人打卡 · 累计 ${totalMinutes} 分钟`,
        showCancel: false,
        confirmText: '关闭'
      })
      return
    }

    const minutes = day ? (day.minutes ?? 0) : 0
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
    <View
      className={`heatmap${compact ? ' compact' : ''}${mode === 'members' ? ' members' : ''}`}
    >
      {/* 区块标题 + 更多（r3） */}
      {showMore && (
        <View className='heatmap-header'>
          <Text className='heatmap-title'>活跃度</Text>
          <View className='heatmap-more' onClick={onMore}>
            <Text className='heatmap-more-text'>更多 ›</Text>
          </View>
        </View>
      )}

      {/* 时间范围提示（r3 bugfix）：如 2025-08-08 ~ 2026-08-08 */}
      {start && end && (
        <View className='heatmap-range'>
          <Text className='heatmap-range-text'>
            {data.startDate} ~ {data.endDate}
          </Text>
        </View>
      )}

      {!start || !end ? (
        <View className='heatmap-empty'>
          <Text className='heatmap-empty-text'>暂无热力图数据</Text>
        </View>
      ) : (
        <>
          <ScrollView
            className='heatmap-scroll'
            scrollX
            scrollIntoView={scrollTarget}
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
                  <View
                    key={weekIndex}
                    className='heatmap-column'
                    id={weekIndex === weeks.length - 1 ? 'heatmap-last-col' : undefined}
                  >
                    {column.map((cellDate, dayIndex) => {
                      if (!cellDate) {
                        return <View key={dayIndex} className='heatmap-cell placeholder' />
                      }
                      const dateStr = formatDate(cellDate, 'YYYY-MM-DD')
                      const day = dayMap[dateStr]
                      return (
                        <View
                          key={dayIndex}
                          className={`heatmap-cell ${isToday(cellDate) ? 'today' : ''}`}
                          style={{ backgroundColor: getLevelColor(cellValue(day)) }}
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
            {levels.map(level => (
              <View
                key={level.min}
                className='legend-cell'
                style={{ backgroundColor: level.color }}
              />
            ))}
            <Text className='legend-label'>多</Text>
          </View>
        </>
      )}
    </View>
  )
}

export default Heatmap
