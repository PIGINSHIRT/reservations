Page({
  data: {
    bookingType: 'day',
    selectedDuration: '1天'
  },

  onLoad() {
    console.log('首页加载')
  },

  selectBookingType(e) {
    this.setData({
      bookingType: e.currentTarget.dataset.type
    })
  },

  selectDuration(e) {
    this.setData({
      selectedDuration: e.currentTarget.dataset.duration
    })
  },

  confirmBooking() {
    wx.showToast({
      title: `已选择${this.data.selectedDuration}`,
      icon: 'success'
    })
  },

  contactService() {
    wx.makePhoneCall({
      phoneNumber: '18975412601'
    })
  },

  gotoCard() {
    wx.switchTab({
      url: '/pages/card/card'
    })
  },

  connectWifi() {
    wx.showToast({
      title: 'WiFi连接功能',
      icon: 'none'
    })
  },

  viewSeatMap() {
    wx.showToast({
      title: '查看座位图',
      icon: 'none'
    })
  },
  data: {
    // ... 原有数据 ...
    hasActiveBooking: false // 新增状态
  },

  onShow() {
    // 每次回到首页，都检查一下有没有正在进行的预约
    this.checkActiveStatus()
  },

  checkActiveStatus() {
    // 调用刚才写的 checkAuth 只做检查
    if (!app.globalData.openid) return

    wx.cloud.callFunction({
      name: 'checkAuth',
      data: { action: 'check' },
      success: res => {
        if (res.result.hasAccess) {
          this.setData({ hasActiveBooking: true })
        } else {
          this.setData({ hasActiveBooking: false })
        }
      }
    })
  },

  goToPass() {
    wx.navigateTo({
      url: '/pages/pass/pass'
    })
  },
  
  // 别忘了在 confirmBooking 成功后，也把 hasActiveBooking 设为 true
  confirmBooking() {
    // ... 你的原有逻辑 ...
    success: res => {
       // ... 你的成功逻辑 ...
       if (result.success) {
         this.setData({ hasActiveBooking: true }) // <--- 加上这句
         // ...
       }
    }
  }
})