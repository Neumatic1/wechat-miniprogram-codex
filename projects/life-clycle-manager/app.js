const { getCloudInitOptions } = require("./utils/cloud")

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
  }
})
