// app.js
App({
  onLaunch() {
    console.log('Go!Study!自习室小程序启动')
    
    // 1. 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
         env: 'cloud1-5gnsdgn3b8b552e0', // 如果不填，默认访问第一个环境
        traceUser: true,
      })
    }

    // 2. 自动登录
    this.doLogin()
  },

  doLogin() {
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        console.log('登录成功', res.result)
        this.globalData.userInfo = res.result.userInfo
        this.globalData.openid = res.result.openid
        
        // 如果页面需要，这里可以发送一个通知说登录好了
        if (this.loginReadyCallback) {
          this.loginReadyCallback(res)
        }
      },
      fail: err => {
        console.error('登录失败', err)
      }
    })
  },

  globalData: {
    userInfo: null,
    openid: null
  }
})