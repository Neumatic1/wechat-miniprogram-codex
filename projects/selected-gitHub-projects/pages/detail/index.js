const { getRepoDetail } = require("../../services/repo-service");
const { isFavorite, toggleFavorite } = require("../../utils/favorites");

Page({
  data: {
    repoId: "",
    repo: null,
    loading: true,
    errorMessage: "",
    favorite: false
  },

  onLoad(options) {
    const repoId = options.repoId || "";

    this.setData({ repoId });
    this.loadRepoDetail(repoId);
  },

  onShow() {
    this.setData({
      favorite: isFavorite(this.data.repoId)
    });
  },

  loadRepoDetail(repoId) {
    if (!repoId) {
      this.setData({
        loading: false,
        errorMessage: "缺少项目标识"
      });
      return;
    }

    this.setData({
      loading: true,
      errorMessage: ""
    });

    getRepoDetail(repoId)
      .then((repo) => {
        this.setData({
          repo,
          favorite: isFavorite(repoId),
          loading: false
        });
      })
      .catch((error) => {
        this.setData({
          loading: false,
          errorMessage: error.message || "项目详情加载失败"
        });
      });
  },

  retryLoad() {
    this.loadRepoDetail(this.data.repoId);
  },

  handleFavoriteTap() {
    if (!this.data.repo) {
      return;
    }

    const favorite = toggleFavorite(this.data.repo);

    this.setData({ favorite });
    wx.showToast({
      title: favorite ? "已收藏" : "已取消收藏",
      icon: "none"
    });
  },

  handleCopyTap() {
    if (!this.data.repo) {
      return;
    }

    wx.setClipboardData({
      data: this.data.repo.githubUrl,
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
