const { getTemplateById, getTemplateTip } = require("../../utils/item-store")

Page({
  data: {
    template: null,
    tip: null
  },

  onLoad(options) {
    const template = getTemplateById((options && options.templateId) || "tpl-custom")
    const tip = getTemplateTip(template.id)

    this.setData({
      template,
      tip
    })
  },

  handleCopySource() {
    if (!this.data.tip) {
      return
    }

    wx.setClipboardData({
      data: this.data.tip.sourceUrl
    })
  }
})
