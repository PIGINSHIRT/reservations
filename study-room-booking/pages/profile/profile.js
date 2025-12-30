// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    hasUserInfo: false
  },

  onShow() {
    // 每次显示页面，都去拿最新的 GlobalData
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else {
      // 如果 app.js 还没登录完，设置回调
      app.loginReadyCallback = (res) => {
        this.setData({
          userInfo: res.result.userInfo,
          hasUserInfo: true
        })
      }
    }
  },

  // 预留：获取微信头像昵称（新版微信已回收此能力，通常用头像填写能力，这里先简化）
  getUserProfile() {
    // ... 后续实现
  }
})