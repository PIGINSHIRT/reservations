// cloudfunctions/getSeatStatus/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  // 1. 获取前端传来的查询时间段
  // startTime, endTime 必须是毫秒级时间戳或 Date 字符串
  const { queryStartTime, queryEndTime } = event
  
  const start = new Date(queryStartTime)
  const end = new Date(queryEndTime)

  // 2. 核心查询：找出所有在这个时间段内“不空闲”的座位
  // 冲突条件：数据库记录的开始时间 < 我的结束时间  AND  数据库记录的结束时间 > 我的开始时间
  const res = await db.collection('bookings')
    .where({
      status: 'active', // 只有生效的订单才算占用
      startTime: _.lt(end),
      endTime: _.gt(start)
    })
    .field({
      seatNo: true // 只需返回座位号，节省流量
    })
    .get()

  // 3. 提取被占用的座位号列表，比如 [1, 5, 12]
  const occupiedSeats = res.data.map(item => item.seatNo)

  return {
    occupiedSeats
  }
}