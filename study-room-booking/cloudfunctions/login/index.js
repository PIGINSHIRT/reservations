// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 1. 尝试在数据库查找这个用户
  const userCheck = await db.collection('users').where({
    _openid: openid
  }).get()

  let userInfo = null

  // 2. 如果没注册过，就自动注册
  if (userCheck.data.length === 0) {
    const newUser = {
      _openid: openid,
      createTime: new Date(),
      balance: 0, // 余额/剩余天数
      isAdmin: false, // 是否管理员
      phone: '', // 暂时留空，后续绑定
      nickName: '新同学'
    }
    await db.collection('users').add({ data: newUser })
    userInfo = newUser
  } else {
    userInfo = userCheck.data[0]
  }

  return {
    openid: openid,
    userInfo: userInfo
  }
} 