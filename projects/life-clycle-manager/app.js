const { getCloudInitOptions } = require("./utils/cloud")
const HOME_TAB_URL = "/pages/home/index"

App({
  onLaunch() {
    if (typeof wx === "undefined" || !wx.cloud || typeof wx.cloud.init !== "function") {
      return
    }

    try {
      wx.cloud.init(getCloudInitOptions(wx.cloud))
    } catch (error) {
      console.warn("Cloud init skipped", error)
    }
  },

  onPageNotFound(error) {
    console.warn("Page not found, fallback to home", error)

    if (typeof wx === "undefined") {
      return
    }

    const fallbackToHome = () => {
      wx.reLaunch({
        url: HOME_TAB_URL,
        fail: (launchError) => {
          console.error("Failed to relaunch home after page not found", launchError)
        }
      })
    }

    wx.switchTab({
      url: HOME_TAB_URL,
      fail: fallbackToHome
    })
  }
})
