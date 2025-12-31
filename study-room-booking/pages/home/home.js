// pages/home/home.js
const app = getApp()

Page({
  data: {
    // === 基础数据 ===
    bookingType: 'day',
    selectedDuration: '1天', // 当前选中的时长模式
    startDate: '', // 最终确定的开始日期
    endDate: '',   // 最终确定的结束日期
    
    // === 门禁状态 ===
    hasActiveBooking: false, // 是否有正在进行的预约(控制顶部开门条)

    // === 日历组件数据 ===
    showCalendar: false,
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    calendarDays: [],
    
    // 自定义模式下的临时状态
    tempStartDate: null 
  },

  onLoad() {
    console.log('首页加载')
    this.initCalendar()
  },

  onShow() {
    // 每次显示页面，检查是否有生效的预约（控制开门入口）
    this.checkActiveStatus()
  },

  // ================= 业务逻辑 =================

  // 切换订座类型 (按天/按小时)
  selectBookingType(e) {
    this.setData({
      bookingType: e.currentTarget.dataset.type
    })
  },

  // 检查是否有生效预约 (门禁入口逻辑)
  checkActiveStatus() {
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
      },
      fail: console.error
    })
  },

  // 跳转到开门页面
  goToPass() {
    wx.navigateTo({ url: '/pages/pass/pass' })
  },

  // 查看座位图 (纯展示)
  viewSeatMap() {
    wx.showToast({ title: '请先选择日期', icon: 'none' })
  },

  // ================= 日历核心逻辑 (新增) =================

  // 1. 点击时长按钮 -> 打开日历
  openCalendar(e) {
    const duration = e.currentTarget.dataset.duration
    
    this.setData({
      selectedDuration: duration,
      showCalendar: true,
      // 每次打开重置临时选择
      tempStartDate: null 
    })
    
    // 重新渲染日历以清除之前的选中状态
    this.renderCalendar(this.data.currentYear, this.data.currentMonth)
  },

  // 关闭日历
  closeCalendar() {
    this.setData({ showCalendar: false })
  },

  // 初始化日历
  initCalendar() {
    const now = new Date()
    this.renderCalendar(now.getFullYear(), now.getMonth() + 1)
  },

  // 渲染日历网格
  renderCalendar(year, month) {
    const days = []
    
    // 获取当月第一天是星期几
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
    // 获取当月有多少天
    const daysInMonth = new Date(year, month, 0).getDate()

    // 填充前面的空白
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: '', dateStr: '', disabled: true })
    }

    // 填充当月日期
    const today = new Date()
    today.setHours(0,0,0,0)

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      const dateObj = new Date(dateStr)
      const isPast = dateObj < today // 过去的日期不可选
      
      days.push({
        day: i,
        dateStr: dateStr,
        disabled: isPast,
        // UI状态标记
        isStart: dateStr === this.data.tempStartDate, 
        // 简单标记：如果是自定义模式且只选了开始，不高亮范围；如果是固定模式，这里暂不高亮范围以简化逻辑
        inRange: false 
      })
    }

    this.setData({
      currentYear: year,
      currentMonth: month,
      calendarDays: days
    })
  },

  // 切换上个月
  prevMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 1) {
      currentYear--
      currentMonth = 12
    } else {
      currentMonth--
    }
    this.renderCalendar(currentYear, currentMonth)
  },

  // 切换下个月
  nextMonth() {
    let { currentYear, currentMonth } = this.data
    if (currentMonth === 12) {
      currentYear++
      currentMonth = 1
    } else {
      currentMonth++
    }
    this.renderCalendar(currentYear, currentMonth)
  },

  // 【核心】点击日期
  onDayTap(e) {
    const dateStr = e.currentTarget.dataset.date
    if (!dateStr) return // 点击空白处或禁用处

    const mode = this.data.selectedDuration

    // === 逻辑分支 A: 自定义模式 (需要点两下) ===
    if (mode === 'custom') {
      if (!this.data.tempStartDate) {
        // 第1次点击：设为开始
        this.setData({ tempStartDate: dateStr })
        // 刷新日历显示选中态
        this.renderCalendar(this.data.currentYear, this.data.currentMonth)
        
      } else {
        // 第2次点击：设为结束
        let start = this.data.tempStartDate
        let end = dateStr
        
        // 自动纠正顺序 (如果先点了晚的，后点了早的)
        if (new Date(end) < new Date(start)) {
          [start, end] = [end, start]
        }
        
        // 完成选择，关闭弹窗
        this.setData({
          startDate: start,
          endDate: end,
          showCalendar: false
        })
      }
    } 
    // === 逻辑分支 B: 固定时长模式 (点一下自动算) ===
    else {
      const daysToAdd = parseInt(mode) // 提取 '7天' 中的 7
      
      const startDateObj = new Date(dateStr)
      // 计算结束日期：开始日期 + (天数-1)天
      // 例如：买1天，开始是1号，结束也是1号
      const endDateObj = new Date(startDateObj.getTime() + ((daysToAdd - 1) * 24 * 60 * 60 * 1000))
      
      const endDateStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth()+1).padStart(2,'0')}-${String(endDateObj.getDate()).padStart(2,'0')}`

      this.setData({
        startDate: dateStr,
        endDate: endDateStr,
        showCalendar: false
      })
    }
  },

  // ================= 提交逻辑 =================

  // pages/home/home.js 修改 confirmBooking 方法
  confirmBooking() {
    // 1. 校验是否选了时间
    if (!this.data.startDate || !this.data.endDate) {
      wx.showToast({ title: '请先选择日期范围', icon: 'none' })
      return
    }

    // 2. 准备参数
    // 我们需要把选好的 开始日期、结束日期、模式(按天/按小时) 传给下一个页面
    const queryParams = `startDate=${this.data.startDate}&endDate=${this.data.endDate}&mode=${this.data.bookingType}&duration=${this.data.selectedDuration}`

    // 3. 跳转到选座页
    wx.navigateTo({
      url: `/pages/seat-select/seat-select?${queryParams}`
    })
  }
})