const {
  getCategoryOptions,
  statusOptions,
  getHomeItems,
  getAllItems,
  getProfileSummary
} = require("../../utils/item-store")

const HOME_USAGE_GUIDE_SEEN_KEY = "life-cycle-home-usage-guide-seen-v1"

function buildStatusTabs(activeStatus, counts) {
  return statusOptions.map((option) => {
    const isActive = option.value === activeStatus
    let count = 0
    let activeClass = ""

    if (option.value === "upcoming") {
      count = counts.upcoming
      activeClass = isActive ? "chip-status-upcoming-active" : ""
    } else if (option.value === "expired") {
      count = counts.expired
      activeClass = isActive ? "chip-status-expired-active" : ""
    } else if (isActive) {
      activeClass = "chip-status-all-active"
    }

    return {
      ...option,
      isActive,
      activeClass,
      count,
      showCount: count > 0,
      countClass: option.value === "expired" ? "status-count-expired" : "status-count-upcoming"
    }
  })
}

Page({
  data: {
    hero: {
      title: "生活物品周期管家",
      subtitle: "记下每件物品的使用日期、周期和提醒时间，到点就知道该清洗、该更换还是该处理。"
    },
    categoryOptions: getCategoryOptions(),
    statusTabs: [],
    activeStatus: "all",
    activeCategory: "",
    managedCount: 0,
    items: [],
    emptyText: "",
    emptyActionText: "",
    emptyActionType: "",
    accountLabel: "游客模式",
    customTemplateCount: 0,
    customTemplatesUnlocked: false,
    showUsageGuide: false
  },

  onLoad() {
    this.refreshItems()
    this.maybeShowUsageGuide()
  },

  onShow() {
    this.refreshItems()
  },

  onPullDownRefresh() {
    this.refreshItems()
    wx.stopPullDownRefresh()
  },

  refreshItems() {
    const allItems = getAllItems()
    const profileSummary = getProfileSummary()
    const categoryOptions = getCategoryOptions()
    const items = getHomeItems({
      status: this.data.activeStatus,
      category: this.data.activeCategory
    })
    const isDefaultFilter = this.data.activeStatus === "all" && !this.data.activeCategory
    const counts = {
      upcoming: allItems.filter((item) => item.statusType === "warning" || item.statusType === "due_today").length,
      expired: allItems.filter((item) => item.statusType === "expired").length
    }

    this.setData({
      managedCount: allItems.length,
      categoryOptions,
      items,
      statusTabs: buildStatusTabs(this.data.activeStatus, counts),
      emptyText: items.length
        ? ""
        : isDefaultFilter
          ? "还没有记录任何物品，先加一个吧"
          : "当前筛选条件下没有匹配的物品",
      emptyActionText: items.length ? "" : isDefaultFilter ? "添加物品" : "重置筛选",
      emptyActionType: items.length ? "" : isDefaultFilter ? "add" : "reset",
      accountLabel: profileSummary.profile.loggedIn
        ? (profileSummary.profile.nickName || "已登录用户")
        : "游客模式",
      customTemplateCount: profileSummary.customTemplateCount,
      customTemplatesUnlocked: profileSummary.unlockState.customTemplatesUnlocked
    })
  },

  handleStatusTap(event) {
    const { value } = event.currentTarget.dataset
    if (value === this.data.activeStatus) {
      return
    }

    this.setData({ activeStatus: value }, () => {
      this.refreshItems()
      wx.pageScrollTo({ scrollTop: 0, duration: 200 })
    })
  },

  handleCategoryTap(event) {
    const { value } = event.currentTarget.dataset
    const nextCategory = value === this.data.activeCategory ? "" : value
    this.setData({ activeCategory: nextCategory }, () => {
      this.refreshItems()
      wx.pageScrollTo({ scrollTop: 0, duration: 200 })
    })
  },

  handleAddItem() {
    wx.navigateTo({
      url: "/pages/item-create/index"
    })
  },

  handleCardTap(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/item-detail/index?id=${id}`
    })
  },

  handleEmptyAction() {
    if (this.data.emptyActionType === "add") {
      this.handleAddItem()
      return
    }

    this.setData(
      {
        activeStatus: "all",
        activeCategory: ""
      },
      () => this.refreshItems()
    )
  },

  handleOpenProfile() {
    wx.navigateTo({
      url: "/pages/me/index"
    })
  },

  maybeShowUsageGuide() {
    if (wx.getStorageSync(HOME_USAGE_GUIDE_SEEN_KEY)) {
      return
    }

    wx.setStorageSync(HOME_USAGE_GUIDE_SEEN_KEY, true)
    this.setData({
      showUsageGuide: true
    })
  },

  handleCloseUsageGuide() {
    this.setData({
      showUsageGuide: false
    })
  },

  noop() {}
})
