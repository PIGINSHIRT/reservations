// pages/card/card.js
const app = getApp()
const db = wx.cloud.database() // 获取数据库引用

Page({
  data: {
    currentTab: 0, // 0:按天, 1:按小时, 2:新客
    productList: [] // 用来存从数据库取出的商品
  },

  onLoad() {
    this.getProducts()
  },

  // 切换 Tab
  switchTab(e) {
    this.setData({
      currentTab: parseInt(e.currentTarget.dataset.index)
    })
    // 切换 Tab 后重新拉取对应类型的商品
    this.getProducts()
  },

  // 从云数据库获取商品
  getProducts() {
    wx.showLoading({ title: '加载中...' })
    
    // 映射关系：Tab 0 -> 'day', Tab 1 -> 'hour', Tab 2 -> 'new'
    const typeMap = ['day', 'hour', 'new']
    const type = typeMap[this.data.currentTab] || 'day'

    // 查询 products 集合
    db.collection('products')
      .where({
        type: type // 只找当前类型的卡
      })
      .get()
      .then(res => {
        console.log('商品数据:', res.data)
        this.setData({
          productList: res.data
        })
        wx.hideLoading()
      })
      .catch(err => {
        console.error('加载失败', err)
        wx.hideLoading()
        wx.showToast({ title: '加载失败', icon: 'none' })
      })
  },

  // 点击购买 (暂时先打个桩)
  buyCard(e) {
    const product = e.currentTarget.dataset.item
    console.log('用户想买:', product)
    wx.showModal({
      title: '确认购买',
      content: `确定要购买 ${product.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '支付功能开发中', icon: 'none' })
        }
      }
    })
  }
})