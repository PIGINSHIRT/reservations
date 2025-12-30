// pages/pass/pass.js
Page({
  data: {
    booking: null,
    endTimeStr: ''
  },

  onLoad() {
    this.checkAccess()
  },

  // 进页面先查票
  checkAccess() {
    wx.showLoading({ title: '验证身份中...' })
    
    wx.cloud.callFunction({
      name: 'checkAuth',
      data: { action: 'check' },
      success: res => {
        wx.hideLoading()
        const result = res.result
        
        if (result.hasAccess) {
          // 有权限，显示信息
          const date = new Date(result.booking.endTime)
          const timeStr = `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`
          
          this.setData({
            booking: result.booking,
            endTimeStr: `今天 ${timeStr}`
          })
        } else {
          // 没权限，踢出去
          wx.showModal({
            title: '无访问权限',
            content: '您的预约已过期或尚未预约，无法进入通行页。',
            showCancel: false,
            success: () => {
              wx.switchTab({ url: '/pages/home/home' })
            }
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络异常', icon: 'none' })
        setTimeout(() => wx.switchTab({ url: '/pages/home/home' }), 1500)
      }
    })
  },

  // 点击开门
  onOpenDoor() {
    wx.showLoading({ title: '正在开门...' })
    
    wx.cloud.callFunction({
      name: 'checkAuth',
      data: { action: 'open' },
      success: res => {
        wx.hideLoading()
        if (res.result.success) {
          wx.showToast({
            title: '开门成功',
            icon: 'success',
            duration: 2000
          })
          // 这里可以播放一个“滴”的音效
        } else {
          wx.showToast({ title: '开门失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络异常', icon: 'none' })
      }
    })
  }
})