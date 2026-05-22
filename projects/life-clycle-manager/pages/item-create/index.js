const {
  getCategoryOptions,
  actionOptions,
  getTemplatesByCategory,
  getDefaultCreateForm,
  getCreateFormByItemId,
  getTemplateById,
  getTemplateTip,
  createItem,
  updateItem,
  getActionMeta,
  readUserProfile,
  uploadImageForCurrentUser
} = require("../../utils/item-store")

const DEFAULT_REMIND_THRESHOLD_DAYS = 0
const AUTO_REMIND_CATEGORIES = ["beauty", "medicine", "food"]
const HOME_TAB_URL = "/pages/home/index"

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

function getTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, "0")
  const day = `${now.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function buildDraftImageId(editingId) {
  return editingId || `draft-${Date.now()}`
}

function getReadableUploadError(result) {
  if (!result) {
    return "未知错误"
  }

  return result.errorMessage || result.reason || "未知错误"
}

function isDevtoolsUploadUnsupported(result) {
  return !!(result && result.reason === "devtools_local_image_unsupported")
}

function chunkTemplates(templates) {
  const pages = []
  for (let index = 0; index < templates.length; index += 8) {
    pages.push(templates.slice(index, index + 8))
  }
  return pages
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
      remindHelperText: "美妆、药品、食品默认按周期天数的 1/5 向上取整提醒，给你留出更充足的处理时间。",
      activeRemindPreset: ""
    }
  }

  return {
    showRemindQuickOptions: true,
    remindHelperText: "",
    activeRemindPreset: getRemindPreset(form.remindThresholdDays)
  }
}

function getDefaultActionType(category) {
  return CATEGORY_DEFAULT_ACTIONS[category] || actionOptions[0].value
}

function buildEmptyFormForCategory(currentForm, category) {
  return {
    ...currentForm,
    templateId: "",
    name: "",
    category,
    actionType: getDefaultActionType(category),
    cycleDays: "",
    remindThresholdDays: "",
    startAt: getTodayString()
  }
}

function getSelectedTemplate(templateId) {
  if (!templateId) {
    return null
  }
  return getTemplateById(templateId)
}

function buildViewModel(form, activeCategory) {
  const selectedTemplate = getSelectedTemplate(form.templateId)
  const currentCategory = activeCategory || form.category || (selectedTemplate && selectedTemplate.category) || getCategoryOptions()[0].value
  const visibleTemplates = getTemplatesByCategory(currentCategory)
  return {
    activeTemplateCategory: currentCategory,
    visibleTemplates,
    templatePages: chunkTemplates(visibleTemplates),
    selectedTemplate,
    selectedTip: selectedTemplate ? getTemplateTip(selectedTemplate.id) : null,
    startLabel: getActionMeta(form.actionType).startLabel
  }
}

const initialForm = {
  ...getDefaultCreateForm(),
  remindThresholdDays: DEFAULT_REMIND_THRESHOLD_DAYS
}

const initialRemindUiState = buildRemindUiState(initialForm)

Page({
  data: {
    templateCategories: getCategoryOptions(),
    cycleQuickOptions: QUICK_CYCLE_OPTIONS,
    remindQuickOptions: QUICK_REMIND_OPTIONS,
    actionOptions,
    pageTitle: "添加物品",
    submitText: "保存物品",
    isEditMode: false,
    editingId: "",
    activeTemplateCategory: getCategoryOptions()[0].value,
    visibleTemplates: getTemplatesByCategory(getCategoryOptions()[0].value),
    templatePages: chunkTemplates(getTemplatesByCategory(getCategoryOptions()[0].value)),
    form: initialForm,
    selectedTemplate: getTemplateById(initialForm.templateId),
    selectedTip: getTemplateTip(initialForm.templateId),
    submitting: false,
    startLabel: getActionMeta(initialForm.actionType).startLabel,
    tipVisible: false,
    activeCyclePreset: getCyclePreset(initialForm.cycleDays),
    ...initialRemindUiState,
    cycleInputFocus: false,
    remindInputFocus: false,
    today: getTodayString()
  },

  onLoad(options) {
    if (!options || !options.id) {
      this.refreshTemplateState()
      return
    }

    const form = getCreateFormByItemId(options.id)
    if (!form) {
      wx.showToast({ title: "未找到物品", icon: "none" })
      return
    }

    const viewModel = buildViewModel(form, form.category)
    this.setData({
      pageTitle: "编辑物品",
      submitText: "保存修改",
      isEditMode: true,
      editingId: options.id,
      form,
      activeCyclePreset: getCyclePreset(form.cycleDays),
      ...buildRemindUiState(form),
      cycleInputFocus: false,
      remindInputFocus: false,
      ...viewModel
    })
    this.refreshTemplateState()
  },

  onShow() {
    this.setData({
      today: getTodayString()
    })
    this.refreshTemplateState()
  },

  refreshTemplateState() {
    const templateCategories = getCategoryOptions()
    const currentForm = { ...this.data.form }
    if (!templateCategories.some((item) => item.value === this.data.activeTemplateCategory)) {
      this.setData({
        activeTemplateCategory: currentForm.category
      })
    }
    const viewModel = buildViewModel(currentForm, this.data.activeTemplateCategory || currentForm.category)
    this.setData({
      templateCategories,
      ...viewModel
    })
  },

  handleTemplateCategoryTap(event) {
    const { value } = event.currentTarget.dataset
    const nextForm = buildEmptyFormForCategory(this.data.form, value)
    const viewModel = buildViewModel(nextForm, value)

    this.setData({
      form: nextForm,
      activeCyclePreset: "",
      ...buildRemindUiState(nextForm),
      cycleInputFocus: false,
      remindInputFocus: false,
      ...viewModel
    })
  },

  handleOpenTemplateManage() {
    wx.navigateTo({
      url: "/pages/template-manage/index"
    })
  },

  handleTemplateTap(event) {
    const { id } = event.currentTarget.dataset
    const template = getTemplateById(id)
    const isAutoRemind = isAutoRemindCategory(template.category)
    const shouldPreserveEditedValues = this.data.isEditMode && !!this.data.form.templateId
    const nextForm = {
      ...this.data.form,
      templateId: template.id,
      name: shouldPreserveEditedValues ? this.data.form.name : template.name,
      category: template.category,
      actionType: template.actionType,
      cycleDays: template.cycleDays,
      startAt: shouldPreserveEditedValues ? this.data.form.startAt : getTodayString(),
      remindThresholdDays: isAutoRemind
        ? getAutoRemindThreshold(template.cycleDays)
        : shouldPreserveEditedValues
          ? this.data.form.remindThresholdDays
          : DEFAULT_REMIND_THRESHOLD_DAYS
    }
    const viewModel = buildViewModel(nextForm, template.category)

    this.setData({
      form: nextForm,
      activeCyclePreset: getCyclePreset(nextForm.cycleDays),
      ...buildRemindUiState(nextForm),
      cycleInputFocus: false,
      remindInputFocus: false,
      ...viewModel
    })
  },

  handleActionTap(event) {
    const { value } = event.currentTarget.dataset
    const nextForm = {
      ...this.data.form,
      actionType: value
    }
    this.setData({
      form: nextForm,
      startLabel: getActionMeta(value).startLabel
    })
  },

  handleNameInput(event) {
    this.setData({
      "form.name": event.detail.value
    })
  },

  handleStartDateChange(event) {
    const today = getTodayString()
    const nextStartAt = event.detail.value > today ? today : event.detail.value
    this.setData({
      "form.startAt": nextStartAt,
      today
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

  handleChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: async (result) => {
        const tempFilePath = (result.tempFiles && result.tempFiles[0] && result.tempFiles[0].path) || result.tempFilePaths[0]
        const profile = readUserProfile()

        if (profile.loggedIn && profile.cloudOpenId) {
          const uploadResult = await uploadImageForCurrentUser(tempFilePath, buildDraftImageId(this.data.editingId))
          if (uploadResult.ok) {
            this.setData({
              "form.imageUrl": uploadResult.fileID,
              "form.imageFileId": uploadResult.fileID,
              "form.imageLocalPath": ""
            })
            wx.showToast({
              title: "图片已上传",
              icon: "success"
            })
            return
          }

          wx.showModal({
            title: isDevtoolsUploadUnsupported(uploadResult) ? "开发者工具图片上传提示" : "图片上传失败",
            content: isDevtoolsUploadUnsupported(uploadResult)
              ? "开发者工具中的本地图片不适合验证云存储上传，请用真机测试图片同步。当前会先保存为本地图片，不影响继续录入。"
              : `已改为先保存本地图片。\n原因：${getReadableUploadError(uploadResult)}`,
            showCancel: false
          })
        }

        wx.saveFile({
          tempFilePath,
          success: (saveResult) => {
            this.setData({
              "form.imageUrl": saveResult.savedFilePath,
              "form.imageFileId": "",
              "form.imageLocalPath": saveResult.savedFilePath
            })
          },
          fail: () => {
            this.setData({
              "form.imageUrl": tempFilePath,
              "form.imageFileId": "",
              "form.imageLocalPath": tempFilePath
            })
          }
        })
      }
    })
  },

  handleRemoveImage() {
    this.setData({
      "form.imageUrl": "",
      "form.imageFileId": "",
      "form.imageLocalPath": ""
    })
  },

  handleOpenTip() {
    if (!this.data.selectedTip) {
      return
    }

    this.setData({
      tipVisible: true
    })
  },

  handleCloseTip() {
    this.setData({
      tipVisible: false
    })
  },

  noop() {},

  handleSubmit() {
    const { form, submitting, isEditMode, editingId } = this.data
    const today = getTodayString()

    if (submitting) {
      return
    }

    if (!form.name.trim()) {
      wx.showToast({ title: "请输入物品名称", icon: "none" })
      return
    }

    if (!form.startAt) {
      wx.showToast({ title: "请选择日期", icon: "none" })
      return
    }

    if (form.startAt > today) {
      wx.showToast({ title: "使用日期不能晚于今天", icon: "none" })
      this.setData({
        "form.startAt": today,
        today
      })
      return
    }

    if (!Number(form.cycleDays) || Number(form.cycleDays) <= 0) {
      wx.showToast({ title: "请输入有效的周期天数", icon: "none" })
      return
    }

    if (Number(form.remindThresholdDays) < 0) {
      wx.showToast({ title: "提醒天数不能小于 0", icon: "none" })
      return
    }

    this.setData({ submitting: true })
    const payload = {
      ...form,
      id: editingId || form.id
    }
    const item = isEditMode ? updateItem(payload) : createItem(payload)

    if (!item) {
      this.setData({ submitting: false })
      wx.showToast({ title: "保存失败", icon: "none" })
      return
    }

    wx.showToast({
      title: isEditMode ? "修改成功" : "添加成功",
      icon: "success"
    })

    setTimeout(() => {
      if (isEditMode) {
        wx.navigateBack({
          fail() {
            wx.redirectTo({
              url: `/pages/item-detail/index?id=${item.id}`
            })
          }
        })
        return
      }

      wx.switchTab({
        url: HOME_TAB_URL,
        fail() {
          wx.reLaunch({
            url: HOME_TAB_URL
          })
        }
      })
    }, 300)
  }
})
