// cloudfunctions/bookSeat/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 接收前端传来的参数
  const { seatNo, startTime, endTime, zone } = event

  // 1. 【核心防重逻辑】检查时间冲突
  // 逻辑：寻找该座位且状态为active的记录，看时间是否有重叠
  // 重叠公式：新开始时间 < 旧结束时间  且  新结束时间 > 旧开始时间
  const conflictCheck = await db.collection('bookings').where({
    seatNo: seatNo,
    status: 'active', // 只有有效的预约才算冲突
    startTime: _.lt(endTime), 
    endTime: _.gt(startTime)
  }).count()

  if (conflictCheck.total > 0) {
    return { success: false, msg: '该时间段已被他人预约，请重新选择' }
  }

  // 2. 检查用户资产 (查找用户有效且匹配区域的次卡)
  // 这里简化演示：查找一张没过期、次数大于0的卡
  const userWallet = await db.collection('user_wallets').where({
    _openid: openid,
    balanceCounts: _.gt(0),
    // 这里未来可以加上 zone: zone 的判断，确保卡能用在这个区域
  }).get()

  if (userWallet.data.length === 0) {
    return { success: false, msg: '您没有可用的次卡或已用完，请去充值' }
  }

  const walletId = userWallet.data[0]._id
  
  // 3. 执行事务：扣次 + 写入预约 (确保两步同时成功)
  try {
    const result = await db.runTransaction(async transaction => {
      // 3.1 扣除1次
      await transaction.collection('user_wallets').doc(walletId).update({
        data: {
          balanceCounts: _.inc(-1)
        }
      })
      
      // 3.2 写入预约记录
      await transaction.collection('bookings').add({
        data: {
          openid: openid,
          seatNo: seatNo,
          startTime: startTime,
          endTime: endTime,
          status: 'active',
          createTime: new Date().getTime(),
          costType: 'count_card'
        }
      })
      
      return { success: true }
    })
    return result
  } catch (e) {
    return { success: false, msg: '系统繁忙，预约失败', error: e }
  }
}