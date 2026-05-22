const {
  getDefaultTemplateForm,
  getAllTemplates,
  createCustomTemplate,
  updateCustomTemplate,
  deleteCustomTemplate,
  actionOptions,
  getActionMeta,
  readUnlockState,
  unlockCustomTemplates,
  getCategoryLabel,
  getCategoryOptions,
  getCustomCategories,
  getCustomCategoryRemainingCount,
  createCustomCategory
} = require("../../utils/item-store")

const DEFAULT_REMIND_THRESHOLD_DAYS = 0
const AUTO_REMIND_CATEGORIES = ["beauty", "medicine", "food"]

const QUICK_CYCLE_OPTIONS = [
  { value: "7", label: "7天", days: 7 },
  { value: "30", label: "30天", days: 30 },
  { value: "90", label: "90天", days: 90 }
]

const QUICK_REMIND_OPTIONS = [
  { value: "0", label: "当天", days: 0 },
  { value: "1", label: "1天前", days: 1 },
  { value: "3", label: "3天前", days: 3 }
]

const CATEGORY_DEFAULT_ACTIONS = {
  personal_care: "replace",
  bedding: "wash",
  home: "wash",
  beauty: "expire",
  medicine: "expire",
  food: "expire",
  kitchenware: "wash",
  daily_use: "wash",
  other: "expire"
}

function getDefaultActionType(category) {
  return CATEGORY_DEFAULT_ACTIONS[category] || actionOptions[0].value
}

function getCyclePreset(cycleDays) {
  const days = Number(cycleDays)
  if (days === 7 || days === 30 || days === 90) {
    return `${days}`
  }
  return ""
}

function getRemindPreset(remindThresholdDays) {
  const days = Number(remindThresholdDays)
  if (days === 0 || days === 1 || days === 3) {
    return `${days}`
  }
  return ""
}

function isAutoRemindCategory(category) {
  return AUTO_REMIND_CATEGORIES.includes(category)
}

function getAutoRemindThreshold(cycleDays) {
  const days = Number(cycleDays)
  if (!days || days <= 0) {
    return DEFAULT_REMIND_THRESHOLD_DAYS
  }
  return Math.ceil(days / 5)
}

function buildRemindUiState(form) {
  if (isAutoRemindCategory(form.category)) {
    return {
      showRemindQuickOptions: false,
      remindHelperText: "美妆、药品、食品默认按周期天数的 1/5 向上取整提醒",
      activeRemindPreset: ""
    }
  }

  return {
    showRemindQuickOptions: true,
    remindHelperText: "",
    activeRemindPreset: getRemindPreset(form.remindThresholdDays)
  }
}

function getCustomTemplates() {
  return getAllTemplates()
    .filter((template) => template.isCustom)
    .map((template) => ({
      ...template,
      categoryLabel: getCategoryLabel(template.category),
      actionLabel: getActionMeta(template.actionType).label
    }))
}

Page({
  data: {
    categoryOptions: getCategoryOptions(),
    cycleQuickOptions: QUICK_CYCLE_OPTIONS,
    remindQuickOptions: QUICK_REMIND_OPTIONS,
    actionOptions,
    unlocked: false,
    customTemplates: [],
    customCategories: [],
    customCategoryRemainingCount: 0,
    form: getDefaultTemplateForm(),
    editingId: "",
    sharePendingUnlock: false,
    formCategoryLabel: getCategoryOptions()[0].label,
    newCategoryName: "",
    activeCyclePreset: getCyclePreset(getDefaultTemplateForm().cycleDays),
    ...buildRemindUiState(getDefaultTemplateForm()),
    cycleInputFocus: false,
    remindInputFocus: false
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
      formCategoryLabel: matchedCategory ? matchedCategory.label : categoryOptions[0].label,
      activeCyclePreset: getCyclePreset(this.data.form.cycleDays),
      ...buildRemindUiState(this.data.form)
    })
  },

  handleCancelForm() {
    const form = getDefaultTemplateForm()
    const categoryOptions = getCategoryOptions()
    this.setData({
      editingId: "",
      form,
      formCategoryLabel: categoryOptions[0].label,
      activeCyclePreset: getCyclePreset(form.cycleDays),
      ...buildRemindUiState(form),
      cycleInputFocus: false,
      remindInputFocus: false
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
        actionType: target.actionType,
        cycleDays: target.cycleDays,
        remindThresholdDays: target.remindThresholdDays
      },
      formCategoryLabel: target.categoryLabel,
      activeCyclePreset: getCyclePreset(target.cycleDays),
      ...buildRemindUiState(target),
      cycleInputFocus: false,
      remindInputFocus: false
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
    const nextForm = {
      ...this.data.form,
      category: nextCategory.value,
      actionType: getDefaultActionType(nextCategory.value),
      remindThresholdDays: isAutoRemindCategory(nextCategory.value)
        ? getAutoRemindThreshold(this.data.form.cycleDays)
        : this.data.form.remindThresholdDays
    }
    this.setData({
      form: nextForm,
      formCategoryLabel: nextCategory.label,
      ...buildRemindUiState(nextForm)
    })
  },

  handleActionTap(event) {
    const { value } = event.currentTarget.dataset
    this.setData({
      "form.actionType": value
    })
  },

  handleCyclePresetTap(event) {
    const { value } = event.currentTarget.dataset
    const selectedOption = QUICK_CYCLE_OPTIONS.find((option) => option.value === value)
    if (!selectedOption) {
      return
    }

    const nextForm = {
      ...this.data.form,
      cycleDays: selectedOption.days,
      remindThresholdDays: isAutoRemindCategory(this.data.form.category)
        ? getAutoRemindThreshold(selectedOption.days)
        : this.data.form.remindThresholdDays
    }

    this.setData({
      form: nextForm,
      activeCyclePreset: selectedOption.value,
      ...buildRemindUiState(nextForm),
      cycleInputFocus: false,
      remindInputFocus: false
    })
  },

  handleFocusCycleInput() {
    this.setData({
      cycleInputFocus: true,
      remindInputFocus: false
    })
  },

  handleCycleInput(event) {
    const value = event.detail.value.replace(/[^\d]/g, "")
    const nextForm = {
      ...this.data.form,
      cycleDays: value,
      remindThresholdDays: isAutoRemindCategory(this.data.form.category)
        ? getAutoRemindThreshold(value)
        : this.data.form.remindThresholdDays
    }

    this.setData({
      form: nextForm,
      activeCyclePreset: getCyclePreset(value),
      ...buildRemindUiState(nextForm)
    })
  },

  handleCycleBlur() {
    this.setData({
      cycleInputFocus: false
    })
  },

  handleFocusRemindInput() {
    this.setData({
      cycleInputFocus: false,
      remindInputFocus: true
    })
  },

  handleRemindInput(event) {
    const value = event.detail.value.replace(/[^\d]/g, "")
    const nextForm = {
      ...this.data.form,
      remindThresholdDays: value
    }

    this.setData({
      form: nextForm,
      ...buildRemindUiState(nextForm)
    })
  },

  handleRemindPresetTap(event) {
    const { value } = event.currentTarget.dataset
    const selectedOption = QUICK_REMIND_OPTIONS.find((option) => option.value === value)
    if (!selectedOption) {
      return
    }

    const nextForm = {
      ...this.data.form,
      remindThresholdDays: selectedOption.days
    }

    this.setData({
      form: nextForm,
      ...buildRemindUiState(nextForm),
      remindInputFocus: false
    })
  },

  handleRemindBlur() {
    this.setData({
      remindInputFocus: false
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
      form: {
        ...this.data.form,
        category: result.category.value,
        actionType: getDefaultActionType(result.category.value)
      },
      formCategoryLabel: result.category.label,
      ...buildRemindUiState({
        ...this.data.form,
        category: result.category.value,
        actionType: getDefaultActionType(result.category.value)
      })
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
