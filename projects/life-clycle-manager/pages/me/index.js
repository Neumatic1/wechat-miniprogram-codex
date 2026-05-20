const {
  getProfileSummary,
  prepareCloudAfterLogin,
  syncAllToCloud,
  restoreAllFromCloud,
  logoutUser,
  clearLocalData
} = require("../../utils/item-store")

function getSyncErrorMessage(result, fallback) {
  const reason = (result && result.reason) || ""
  const detail = result && result.errorMessage ? `：${result.errorMessage}` : ""
  const messageMap = {
    not_logged_in: "请先登录后再同步",
    cloud_unavailable: "云环境未就绪，请检查云开发配置",
    cloud_env_missing: "未找到云开发环境，请先绑定环境",
    cloud_function_missing: "云函数未部署，请重新上传 lifeCycleSync",
    collection_missing: "数据库集合缺失，请先创建 lifeCycleProfiles",
    cloud_permission_denied: "云权限不足，请检查云开发权限",
    remote_missing: "云端暂无可恢复的数据",
    devtools_local_image_unsupported: "开发者工具里的本地图片不适合验证云存储上传，请用真机测试图片同步",
    image_upload_failed: "图片上传失败，请稍后重试",
    image_delete_failed: "旧图片清理失败，但不影响当前数据保存",
    cloud_call_failed: "云端调用失败，请检查网络或云函数日志",
    sync_failed: "同步失败，请稍后重试"
  }

  return `${messageMap[reason] || fallback}${detail}`
}

Page({
  data: {
    profile: {
      loggedIn: false,
      nickName: "",
      avatarUrl: ""
    },
    syncOverview: {
      title: "",
      detail: ""
    },
    managedCount: 0,
    customTemplateCount: 0,
    customTemplatesUnlocked: false,
    working: false,
    hasAvatar: false,
    avatarText: "游",
    profileName: "游客模式",
    profileDesc: "",
    profileDetail: "",
    loginButtonText: "登录并同步到云端",
    syncButtonText: "立即同步到云端"
  },

  onLoad() {
    this.refreshPage()
  },

  onShow() {
    this.refreshPage()
  },

  refreshPage() {
    const summary = getProfileSummary()
    const isLoggedIn = !!summary.profile.loggedIn
    const nickName = summary.profile.nickName || "已登录用户"
    this.setData({
      profile: summary.profile,
      syncOverview: summary.syncOverview,
      managedCount: summary.managedCount,
      customTemplateCount: summary.customTemplateCount,
      customTemplatesUnlocked: summary.unlockState.customTemplatesUnlocked,
      hasAvatar: !!summary.profile.avatarUrl,
      avatarText: isLoggedIn ? nickName.slice(0, 1) : "游",
      profileName: isLoggedIn ? nickName : "游客模式",
      profileDesc: summary.syncOverview.title || "",
      profileDetail: summary.syncOverview.detail || "",
      loginButtonText: this.data.working ? "登录中..." : "登录并同步到云端",
      syncButtonText: this.data.working ? "处理中..." : "立即同步到云端"
    })
  },

  handleLogin() {
    if (this.data.working) {
      return
    }

    this.setData({
      working: true,
      loginButtonText: "登录中..."
    })

    const finishLogin = (userInfo) => {
      prepareCloudAfterLogin(userInfo)
        .then((result) => {
          this.refreshPage()
          if (result.ok) {
            const message = result.action === "restored_cloud" ? "已从云端恢复数据" : "登录并同步成功"
            wx.showToast({ title: message, icon: "success" })
          } else {
            wx.showToast({
              title: getSyncErrorMessage(result, "已登录，当前仍使用本地数据"),
              icon: "none"
            })
          }
        })
        .finally(() => {
          this.setData({
            working: false,
            loginButtonText: "登录并同步到云端",
            syncButtonText: "立即同步到云端"
          })
        })
    }

    if (typeof wx.getUserProfile === "function") {
      wx.getUserProfile({
        desc: "用于补充你的昵称和头像",
        success: (result) => finishLogin(result.userInfo || {}),
        fail: () => {
          finishLogin({})
        }
      })
      return
    }

    finishLogin({
      nickName: "微信用户",
      avatarUrl: ""
    })
  },

  handleSyncNow() {
    if (this.data.working) {
      return
    }

    this.setData({
      working: true,
      syncButtonText: "处理中..."
    })
    syncAllToCloud()
      .then((result) => {
        this.refreshPage()
        wx.showToast({
          title: result.ok ? "已同步到云端" : getSyncErrorMessage(result, "同步失败，请检查云开发"),
          icon: result.ok ? "success" : "none"
        })
      })
      .finally(() => {
        this.setData({
          working: false,
          syncButtonText: "立即同步到云端"
        })
      })
  },

  handleRestoreFromCloud() {
    if (this.data.working) {
      return
    }

    wx.showModal({
      title: "从云端恢复",
      content: "云端数据会覆盖当前本地数据，确认继续吗？",
      success: (result) => {
        if (!result.confirm) {
          return
        }

        this.setData({
          working: true,
          syncButtonText: "处理中..."
        })
        restoreAllFromCloud()
          .then((restoreResult) => {
            this.refreshPage()
            wx.showToast({
              title: restoreResult.ok ? "已从云端恢复" : getSyncErrorMessage(restoreResult, "未找到可恢复的云端数据"),
              icon: restoreResult.ok ? "success" : "none"
            })
          })
          .finally(() => {
            this.setData({
              working: false,
              syncButtonText: "立即同步到云端"
            })
          })
      }
    })
  },

  handleOpenTemplates() {
    wx.navigateTo({
      url: "/pages/template-manage/index"
    })
  },

  handleOpenGuide() {
    wx.navigateTo({
      url: "/pages/guide/index"
    })
  },

  handleFeedback() {
    wx.navigateTo({
      url: "/pages/feedback/index"
    })
  },

  handleClearLocalData() {
    wx.showModal({
      title: "删除本地数据",
      content: "会清空当前设备上的物品、模板和本地解锁状态，不会删除云端数据。确认继续吗？",
      success: (result) => {
        if (!result.confirm) {
          return
        }

        clearLocalData()
        this.refreshPage()
        wx.showToast({
          title: "本地数据已删除",
          icon: "success"
        })
      }
    })
  },

  handleLogout() {
    logoutUser()
    this.refreshPage()
    wx.showToast({
      title: "已退出登录",
      icon: "success"
    })
  }
})
