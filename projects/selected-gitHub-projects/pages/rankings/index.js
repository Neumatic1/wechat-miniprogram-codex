const { getRankings } = require("../../services/repo-service");
const { formatPeriodLabel, formatUpdatedAt } = require("../../utils/format");
const { getFavoriteMap, toggleFavorite } = require("../../utils/favorites");

Page({
  data: {
    currentPeriod: "daily",
    periodLabel: "日榜",
    skeletonRows: [1, 2, 3],
    periods: [
      { key: "daily", label: "日榜" },
      { key: "weekly", label: "周榜" },
      { key: "monthly", label: "月榜" }
    ],
    updatedAt: "",
    items: [],
    favoriteMap: {},
    loading: true,
    errorMessage: "",
    observableNotice: "",
    observableNoticeTone: ""
  },

  onLoad() {
    this.loadRankings("daily");
  },

  onShow() {
    this.syncFavoriteMap();
    this.updateTabBar();
  },

  onPullDownRefresh() {
    this.loadRankings(this.data.currentPeriod, false);
  },

  updateTabBar() {
    if (this.getTabBar && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  syncFavoriteMap() {
    const favoriteMap = getFavoriteMap();

    this.setData({
      favoriteMap,
      items: this.data.items.map((item) =>
        Object.assign({}, item, {
          isFavorite: Boolean(favoriteMap[item.repoId])
        })
      )
    });
  },

  setPeriod(event) {
    const { period } = event.currentTarget.dataset;

    if (!period || period === this.data.currentPeriod) {
      return;
    }

    this.loadRankings(period);
  },

  loadRankings(period, withLoading = true) {
    const nextState = {
      currentPeriod: period,
      periodLabel: formatPeriodLabel(period),
      errorMessage: ""
    };

    if (withLoading) {
      nextState.loading = true;
      nextState.observableNotice = "";
      nextState.observableNoticeTone = "";
    }

    this.setData(nextState);

    getRankings(period)
      .then((result) => {
        const favoriteMap = getFavoriteMap();
        const items = (result.items || []).map((item) =>
          Object.assign({}, item, {
            isFavorite: Boolean(favoriteMap[item.repoId])
          })
        );

        this.setData({
          updatedAt: formatUpdatedAt(result.updatedAt),
          items,
          loading: false,
          errorMessage: "",
          favoriteMap,
          observableNotice: result.observableNotice || "",
          observableNoticeTone: result.observableNoticeTone || ""
        });
      })
      .catch((error) => {
        this.setData({
          loading: false,
          errorMessage: error.message || "榜单加载失败"
        });
      })
      .finally(() => {
        wx.stopPullDownRefresh();
      });
  },

  retryLoad() {
    this.loadRankings(this.data.currentPeriod);
  },

  handleCardTap(event) {
    const { repoId } = event.detail;

    wx.navigateTo({
      url: `/pages/detail/index?repoId=${repoId}`
    });
  },

  handleFavoriteTap(event) {
    const { repo } = event.detail;
    const nextFavoriteState = toggleFavorite(repo);

    this.syncFavoriteMap();
    wx.showToast({
      title: nextFavoriteState ? "已收藏" : "已取消收藏",
      icon: "none"
    });
  }
});
