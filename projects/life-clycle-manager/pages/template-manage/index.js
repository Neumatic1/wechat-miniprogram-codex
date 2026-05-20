const {
  getDefaultTemplateForm,
  getAllTemplates,
  createCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  readUnlockState,
  unlockCustomTemplates,
  getCategoryLabel,
  getCategoryOptions,
  getCustomCategories,
  getCustomCategoryRemainingCount,
  createCustomCategory
} = require("../../utils/item-store")

function getCustomTemplates() {
  return getAllTemplates()
    .filter((template) => template.isCustom)
    .map((template) => ({
      ...template,
      categoryLabel: getCategoryLabel(template.category)
    }))
}

Page({
  data: {
    categoryOptions: getCategoryOptions(),
    unlocked: false,
    customTemplates: [],
    customCategories: [],
    customCategoryRemainingCount: 0,
    form: getDefaultTemplateForm(),
    editingId: "",
    sharePendingUnlock: false,
    formCategoryLabel: getCategoryOptions()[0].label,
    newCategoryName: ""
  },

  onLoad() {
    this.refreshPage()
  },

  onShow() {
    this.refreshPage()
  },

  refreshPage() {
    const unlockState = readUnlockState()
    const categoryOptions = getCategoryOptions()
    const matchedCategory = categoryOptions.find((item) => item.value === this.data.form.category)
    this.setData({
      unlocked: unlockState.customTemplatesUnlocked,
      customTemplates: getCustomTemplates(),
      customCategories: getCustomCategories(),
      customCategoryRemainingCount: getCustomCategoryRemainingCount(),
      categoryOptions,
      formCategoryLabel: matchedCategory ? matchedCategory.label : categoryOptions[0].label
    })
  },

  handleCancelForm() {
    const form = getDefaultTemplateForm()
    const categoryOptions = getCategoryOptions()
    this.setData({
      editingId: "",
      form,
      formCategoryLabel: categoryOptions[0].label
    })
  },

  handleEditTemplate(event) {
    const { id } = event.currentTarget.dataset
    const target = this.data.customTemplates.find((template) => template.id === id)
    if (!target) {
      return
    }

    this.setData({
      editingId: id,
      form: {
        id: target.id,
        name: target.name,
        category: target.category,
        cycleDays: target.cycleDays,
        remindThresholdDays: target.remindThresholdDays
      },
      formCategoryLabel: target.categoryLabel
    })
  },

  handleDeleteTemplate(event) {
    const { id } = event.currentTarget.dataset
    const target = this.data.customTemplates.find((template) => template.id === id)
    if (!target) {
      return
    }

    wx.showModal({
      title: "删除模板",
      content: `确认删除“${target.name}”吗？`,
      success: (result) => {
        if (!result.confirm) {
          return
        }

        deleteCustomTemplate(id)
        if (this.data.editingId === id) {
          this.handleCancelForm()
        }
        this.refreshPage()
        wx.showToast({
          title: "已删除模板",
          icon: "success"
        })
      }
    })
  },

  handleNameInput(event) {
    this.setData({
      "form.name": event.detail.value
    })
  },

  handleCategoryChange(event) {
    const nextCategory = this.data.categoryOptions[event.detail.value]
    this.setData({
      "form.category": nextCategory.value,
      formCategoryLabel: nextCategory.label
    })
  },

  handleCycleInput(event) {
    this.setData({
      "form.cycleDays": event.detail.value
    })
  },

  handleRemindInput(event) {
    this.setData({
      "form.remindThresholdDays": event.detail.value
    })
  },

  handleNewCategoryInput(event) {
    this.setData({
      newCategoryName: event.detail.value
    })
  },

  handleAddCategory() {
    const result = createCustomCategory(this.data.newCategoryName)
    if (!result.ok) {
      const messageMap = {
        empty: "请输入分类名称",
        duplicated: "这个分类已经存在",
        limit: "最多只能额外添加 5 个分类"
      }
      wx.showToast({
        title: messageMap[result.reason] || "新增分类失败",
        icon: "none"
      })
      return
    }

    const categoryOptions = getCategoryOptions()
    this.setData({
      categoryOptions,
      customCategories: getCustomCategories(),
      customCategoryRemainingCount: getCustomCategoryRemainingCount(),
      newCategoryName: "",
      "form.category": result.category.value,
      formCategoryLabel: result.category.label
    })
    wx.showToast({
      title: "已新增分类",
      icon: "success"
    })
  },

  handleSubmitTemplate() {
    const { form, editingId } = this.data
    if (!form.name.trim()) {
      wx.showToast({ title: "请输入模板名称", icon: "none" })
      return
    }
    if (!Number(form.cycleDays) || Number(form.cycleDays) <= 0) {
      wx.showToast({ title: "请输入有效周期", icon: "none" })
      return
    }
    if (Number(form.remindThresholdDays) < 0) {
      wx.showToast({ title: "提醒天数不能小于 0", icon: "none" })
      return
    }

    const payload = {
      ...form,
      id: editingId || form.id
    }
    const result = editingId ? updateCustomTemplate(payload) : createCustomTemplate(payload)
    if (!result) {
      wx.showToast({ title: "保存失败", icon: "none" })
      return
    }

    this.handleCancelForm()
    this.refreshPage()
    wx.showToast({
      title: editingId ? "模板已更新" : "模板已创建",
      icon: "success"
    })
  },

  handlePrepareShareUnlock() {
    this.setData({
      sharePendingUnlock: true
    })
  },

  onShareAppMessage(res) {
    if (res.from === "button" && this.data.sharePendingUnlock && !this.data.unlocked) {
      unlockCustomTemplates("share")
      this.setData({
        sharePendingUnlock: false
      })
      this.refreshPage()
      setTimeout(() => {
        wx.showToast({
          title: "已解锁模板管理",
          icon: "success"
        })
      }, 80)
    }

    return {
      title: "我在用生活物品周期管家，帮你记住该洗该换的东西",
      path: "/pages/home/index",
      imageUrl: "/images/hero-home.jpg"
    }
  }
})
