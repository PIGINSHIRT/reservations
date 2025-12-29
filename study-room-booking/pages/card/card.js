Page({
  data: {
    currentTab: 0
  },

  switchTab(e) {
    this.setData({
      currentTab: e.currentTarget.dataset.index
    })
  }
})