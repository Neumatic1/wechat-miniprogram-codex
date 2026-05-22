const { getItemById, completeItem, deleteItem } = require("../../utils/item-store")

const HOME_TAB_URL = "/pages/home/index"

Page({
  data: {
    item: null,
    itemId: ""
  },

  onLoad(options) {
    this.setData({
      itemId: (options && options.id) || ""
    })
    this.refreshItem()
  },

  onShow() {
    this.refreshItem()
  },

  refreshItem() {
    const item = getItemById(this.data.itemId)

    if (!item) {
      wx.showToast({
        title: "未找到物品",
        icon: "none"
      })
      setTimeout(() => {
        this.handleBackHome()
      }, 500)
      return
    }

    this.setData({ item })
  },

  handleComplete() {
    if (!this.data.item) {
      return
    }

    const nextItem = completeItem(this.data.item.id)
    if (nextItem) {
      this.setData({ item: nextItem })
      wx.showToast({
        title: "已更新到下一周期",
        icon: "success"
      })
    }
  },

  handleEdit() {
    if (!this.data.item) {
      return
    }

    wx.navigateTo({
      url: `/pages/item-create/index?id=${this.data.item.id}`
    })
  },

  handleDelete() {
    if (!this.data.item) {
      return
    }

    wx.showModal({
      title: "删除物品",
      content: `确认删除“${this.data.item.name}”吗？`,
      success: (result) => {
        if (!result.confirm) {
          return
        }

        deleteItem(this.data.item.id)
        wx.showToast({
          title: "已删除",
          icon: "success"
        })
        setTimeout(() => {
          this.navigateHome()
        }, 300)
      }
    })
  },

  handleBackHome() {
    this.navigateHome()
  },

  navigateHome() {
    wx.switchTab({
      url: HOME_TAB_URL,
      fail() {
        wx.reLaunch({
          url: HOME_TAB_URL
        })
      }
    })
  }
})
