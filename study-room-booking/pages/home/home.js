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
  }
})