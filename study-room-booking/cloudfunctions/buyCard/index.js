// cloudfunctions/buyCard/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { productId } = event // 前端把商品ID传过来

  // 1. 查商品详情
  const productRes = await db.collection('products').doc(productId).get()
  const product = productRes.data

  // 2. 计算过期时间 (当前时间 + 有效期天数)
  const now = new Date()
  const expireDate = new Date(now.getTime() + product.validityDays * 24 * 60 * 60 * 1000)

  // 3. 给用户发卡 (写入 user_wallets)
  await db.collection('user_wallets').add({
    data: {
      openid: openid, // 这一行很重要，标记是谁的卡
      productName: product.name,
      balanceCounts: product.totalCounts, // 比如 20次
      expireDate: expireDate.getTime(),
      type: product.type,
      zone: product.zone,
      createTime: now.getTime()
    }
  })

  return { success: true, msg: '购买成功，卡已入账' }
}