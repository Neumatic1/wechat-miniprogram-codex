Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/rankings/index",
        text: "榜单",
        icon: "榜"
      },
      {
        pagePath: "/pages/favorites/index",
        text: "收藏",
        icon: "藏"
      }
    ]
  },
  methods: {
    switchTab(event) {
      const { path, index } = event.currentTarget.dataset;
      const selected = Number(index);

      if (!Number.isNaN(selected)) {
        this.setData({ selected });
      }

      wx.switchTab({
        url: path
      });
    }
  }
});
