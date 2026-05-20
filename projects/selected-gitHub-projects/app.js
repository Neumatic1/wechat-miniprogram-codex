const cloudConfig = require("./config/cloud");

App({
  onLaunch() {
    if (!cloudConfig.useCloud) {
      console.info("当前使用本地 mock 数据，已跳过云开发初始化");
      return;
    }

    if (wx.cloud) {
      try {
        const initOptions = {
          traceUser: true
        };

        if (cloudConfig.envId) {
          initOptions.env = cloudConfig.envId;
        } else {
          console.warn("已开启云开发模式，但尚未配置 envId");
        }

        wx.cloud.init(initOptions);
      } catch (error) {
        console.warn("云开发初始化失败，将继续使用 mock 数据", error);
      }
    }
  }
});
