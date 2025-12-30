// cloudfunctions/checkAuth/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event // 'check' (检查权限) 或 'open' (执行开门)

  const now = new Date()

  // 1. 在 bookings 表里找：属于该用户、状态是 active、且结束时间还没到的记录
  const res = await db.collection('bookings')
    .where({
      _openid: openid,
      status: 'active',
      endTime: _.gt(now) // 结束时间必须大于现在
    })
    .orderBy('createTime', 'desc')
    .limit(1)
    .get()

  const activeBooking = res.data[0]

  // 如果没有找到有效预约
  if (!activeBooking) {
    return {
      hasAccess: false,
      msg: '当前无有效预约或预约已过期'
    }
  }

  // 2. 如果只是检查权限 (进入页面前调用)
  if (action === 'check') {
    return {
      hasAccess: true,
      booking: activeBooking,
      timeLeft: Math.floor((new Date(activeBooking.endTime) - now) / 1000) // 剩余秒数
    }
  }

  // 3. 如果是执行开门 (点击按钮时调用)
  if (action === 'open') {
    // 这里未来可以对接硬件厂商的 API (比如 TTLock, 涂鸦等)
    console.log(`[模拟硬件指令] 给用户 ${openid} 开门！`)
    
    return {
      success: true,
      msg: '门锁已开启，请通行'
    }
  }
}