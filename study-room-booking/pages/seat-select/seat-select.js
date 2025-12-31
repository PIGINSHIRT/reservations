// pages/seat-select/seat-select.js
const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    // 首页传来的参数
    bookingInfo: {},
    
    // 页面数据
    areaList: [
      { id: 'common', name: '公共学习区', desc: '安静 · 舒适' },
      { id: 'immersive', name: '沉浸小黑屋', desc: '深度 · 专注' },
      { id: 'window', name: '景观窗边位', desc: '视野 · 开阔' },
      { id: 'vip', name: 'VIP包厢', desc: '私密 · 独享' }
    ],
    currentAreaId: 'common',
    
    // 座位数据
    currentSeats: [], // 当前区域显示的座位列表
    selectedSeat: null, // 当前选中的座位号
  },

  onLoad(options) {
    // 1. 接收首页参数 (startDate, endDate, mode等)
    console.log('接收到的预定信息:', options)
    this.setData({
      bookingInfo: options
    })

    // 2. 初始化加载座位
    this.loadSeatsAndStatus()
  },

  // 核心：加载座位并匹配状态
  async loadSeatsAndStatus() {
    wx.showLoading({ title: '查询状态中...' })

    try {
      // Step A: 获取当前区域的所有座位 (建议从 seats 集合读，这里模拟生成)
      const rawSeats = this.getMockSeats(this.data.currentAreaId)

      // Step B: 调用云函数，查询这段时间内 被占用的座位
      // 注意：这里需要你之前的 getSeatStatus 云函数支持
      // 我们需要把日期转成时间戳传给云函数
      const startTs = new Date(this.data.bookingInfo.startDate.replace(/-/g, '/') + ' 00:00:00').getTime()
      const endTs = new Date(this.data.bookingInfo.endDate.replace(/-/g, '/') + ' 23:59:59').getTime()

      const statusRes = await wx.cloud.callFunction({
        name: 'getSeatStatus',
        data: {
          queryStartTime: startTs,
          queryEndTime: endTs
        }
      })
      const occupiedList = statusRes.result.occupiedSeats || []

      // Step C: 合并数据，标记状态
      const processedSeats = rawSeats.map(seat => {
        const isOccupied = occupiedList.includes(seat.seatNo)
        return {
          ...seat,
          status: isOccupied ? 'occupied' : 'free'
        }
      })

      this.setData({ currentSeats: processedSeats })

    } catch (err) {
      console.error(err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // 模拟座位数据 (实际应从 db.collection('seats') 获取)
  getMockSeats(areaId) {
    let seats = []
    const prefixMap = { common: 'A', immersive: 'B', window: 'C', vip: 'V' }
    const prefix = prefixMap[areaId] || 'A'
    
    // 生成 20 个座位
    for (let i = 1; i <= 20; i++) {
      seats.push({
        seatNo: `${prefix}${String(i).padStart(2, '0')}`,
        areaId: areaId,
        type: areaId === 'vip' ? 'vip' : 'normal'
      })
    }
    return seats
  },

  // 切换区域
  switchArea(e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.currentAreaId) return
    
    this.setData({ 
      currentAreaId: id,
      selectedSeat: null // 切换区域清空已选
    })
    this.loadSeatsAndStatus() // 重新查该区域状态
  },

  // 点击座位
  onSeatTap(e) {
    const item = e.currentTarget.dataset.item
    
    // 如果被占用，提示
    if (item.status === 'occupied') {
      wx.showToast({ title: '该座位已被预定', icon: 'none' })
      return
    }

    // 选中/取消选中
    this.setData({
      selectedSeat: this.data.selectedSeat === item.seatNo ? null : item.seatNo
    })
  },

  // 确认预定
  submitBooking() {
    if (!this.data.selectedSeat) return

    wx.showLoading({ title: '锁定中...' })

    // 调用 bookSeat 云函数
    wx.cloud.callFunction({
      name: 'bookSeat',
      data: {
        seatNo: this.data.selectedSeat,
        // 传入计算好的时间戳 (为了严谨建议在云函数里再算一遍或校验)
        customStartTime: new Date(this.data.bookingInfo.startDate.replace(/-/g, '/') + ' 00:00:00').getTime(),
        customEndTime: new Date(this.data.bookingInfo.endDate.replace(/-/g, '/') + ' 23:59:59').getTime(),
        type: this.data.bookingInfo.mode
      },
      success: res => {
        wx.hideLoading()
        if (res.result.success) {
          wx.showToast({ title: '预定成功', icon: 'success' })
          
          // 延迟返回首页
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/home/home' })
          }, 1500)
        } else {
          wx.showModal({ title: '失败', content: res.result.msg })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络异常', icon: 'none' })
      }
    })
  },

  previewMap() {
    // 预览大图
    wx.previewImage({
      urls: ['cloud://你的环境ID/seat-map.jpg'] // 换成你云存储里的真实图片ID
    })
  }
})