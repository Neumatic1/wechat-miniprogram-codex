const { getFavoriteList, toggleFavorite } = require("../../utils/favorites");

Page({
  data: {
    favorites: []
  },

  onShow() {
    this.loadFavorites();
    this.updateTabBar();
  },

  updateTabBar() {
    if (this.getTabBar && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  loadFavorites() {
    const favorites = getFavoriteList();
    this.setData({ favorites });
  },

  goRankings() {
    wx.switchTab({
      url: "/pages/rankings/index"
    });
  },

  handleCardTap(event) {
    const { repoId } = event.detail;

    wx.navigateTo({
      url: `/pages/detail/index?repoId=${repoId}`
    });
  },

  handleFavoriteTap(event) {
    const { repo } = event.detail;
    toggleFavorite(repo);
    this.loadFavorites();

    wx.showToast({
      title: "已取消收藏",
      icon: "none"
    });
  },

  handleCopyTap(event) {
    const { repo } = event.detail;

    wx.setClipboardData({
      data: repo.githubUrl,
      success: () => {
        wx.showToast({
          title: "链接已复制",
          icon: "none"
        });
      },
      fail: () => {
        wx.showToast({
          title: "复制失败，请重试",
          icon: "none"
        });
      }
    });
  }
});
