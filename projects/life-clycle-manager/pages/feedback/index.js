const { CLOUD_FUNCTION_NAME } = require("../../utils/cloud")
const { getProfileSummary } = require("../../utils/item-store")

const FEEDBACK_TYPES = [
  { value: "bug", label: "问题反馈" },
  { value: "suggestion", label: "功能建议" }
]

const MAX_SCREENSHOTS = 3

function getSystemSnapshot() {
  if (typeof wx === "undefined" || typeof wx.getSystemInfoSync !== "function") {
    return {
      platform: "unknown",
      model: "",
      system: "",
      version: ""
    }
  }

  const info = wx.getSystemInfoSync()
  return {
    platform: info.platform || "unknown",
    model: info.model || "",
    system: info.system || "",
    version: info.version || ""
  }
}

function buildFeedbackContext() {
  const summary = getProfileSummary()
  const systemInfo = getSystemSnapshot()

  return {
    profileMode: summary.profile.loggedIn ? "logged_in" : "guest",
    syncTitle: summary.syncOverview.title || "",
    syncDetail: summary.syncOverview.detail || "",
    lastSyncLabel: summary.syncOverview.lastSyncLabel || "",
    lastSyncValue: summary.syncOverview.lastSyncValue || "",
    pendingLabel: summary.syncOverview.pendingLabel || "",
    pendingValue: summary.syncOverview.pendingValue || "",
    pendingDetail: summary.syncOverview.pendingDetail || "",
    managedCount: summary.managedCount,
    customTemplateCount: summary.customTemplateCount,
    device: systemInfo
  }
}

function canUseCloudFeedback() {
  return !!(
    typeof wx !== "undefined" &&
    wx.cloud &&
    typeof wx.cloud.uploadFile === "function" &&
    typeof wx.cloud.callFunction === "function"
  )
}

function getFileExtension(path = "") {
  const matched = path.match(/(\.[a-zA-Z0-9]+)(?:\?|$)/)
  return matched ? matched[1].toLowerCase() : ".jpg"
}

function uploadScreenshot(filePath, index) {
  return wx.cloud.uploadFile({
    cloudPath: `life-cycle-feedbacks/${Date.now()}-${index}${getFileExtension(filePath)}`,
    filePath
  })
}

Page({
  data: {
    feedbackTypes: FEEDBACK_TYPES,
    form: {
      type: FEEDBACK_TYPES[0].value,
      message: ""
    },
    screenshots: [],
    submitting: false
  },

  handleTypeTap(event) {
    const { value } = event.currentTarget.dataset
    this.setData({
      "form.type": value
    })
  },

  handleMessageInput(event) {
    this.setData({
      "form.message": event.detail.value
    })
  },

  handleChooseScreenshot() {
    const remainCount = MAX_SCREENSHOTS - this.data.screenshots.length
    if (remainCount <= 0) {
      wx.showToast({
        title: `最多上传 ${MAX_SCREENSHOTS} 张`,
        icon: "none"
      })
      return
    }

    wx.chooseImage({
      count: remainCount,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (result) => {
        const nextScreenshots = [
          ...this.data.screenshots,
          ...(result.tempFilePaths || [])
        ].slice(0, MAX_SCREENSHOTS)

        this.setData({
          screenshots: nextScreenshots
        })
      }
    })
  },

  handleRemoveScreenshot(event) {
    const { index } = event.currentTarget.dataset
    const nextScreenshots = this.data.screenshots.filter((_, currentIndex) => currentIndex !== Number(index))
    this.setData({
      screenshots: nextScreenshots
    })
  },

  async handleSubmit() {
    if (this.data.submitting) {
      return
    }

    const message = this.data.form.message.trim()
    if (!message) {
      wx.showToast({
        title: "请先写一句话描述",
        icon: "none"
      })
      return
    }

    if (!canUseCloudFeedback()) {
      wx.showModal({
        title: "反馈暂不可用",
        content: "当前云开发未就绪，暂时还不能直接提交反馈。请先完成云开发配置后再试。",
        showCancel: false
      })
      return
    }

    this.setData({ submitting: true })

    try {
      const screenshotUploads = await Promise.all(
        this.data.screenshots.map((filePath, index) => uploadScreenshot(filePath, index))
      )
      const screenshotFileIds = screenshotUploads.map((item) => item.fileID).filter(Boolean)

      const result = await wx.cloud.callFunction({
        name: CLOUD_FUNCTION_NAME,
        data: {
          action: "saveFeedback",
          payload: {
            type: this.data.form.type,
            message,
            screenshots: screenshotFileIds,
            context: buildFeedbackContext()
          }
        }
      })

      const response = (result && result.result) || {}
      if (!response.ok) {
        throw new Error(response.reason || "save_feedback_failed")
      }

      this.setData({
        form: {
          type: FEEDBACK_TYPES[0].value,
          message: ""
        },
        screenshots: []
      })

      wx.showModal({
        title: "反馈已提交",
        content: response.mailNotify && response.mailNotify.ok
          ? `反馈已经写入云端，并已发送邮件到 ${response.mailNotify.notifyEmail}。`
          : "反馈已经写入云端。邮件通知暂时未发出，但你仍可以在云开发后台的 lifeCycleFeedbacks 集合里查看。",
        showCancel: false
      })
    } catch (error) {
      wx.showModal({
        title: "提交失败",
        content: "反馈没有成功写入云端。请检查云函数、数据库集合和网络后重试。",
        showCancel: false
      })
      console.warn("Feedback submit failed", error)
    } finally {
      this.setData({ submitting: false })
    }
  }
})
