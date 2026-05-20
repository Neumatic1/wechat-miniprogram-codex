Component({
  properties: {
    repo: {
      type: Object,
      value: null
    },
    isFavorite: {
      type: Boolean,
      value: false
    },
    showRank: {
      type: Boolean,
      value: false
    },
    showGrowth: {
      type: Boolean,
      value: false
    },
    showCopyButton: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    handleTap() {
      const { repo } = this.properties;
      this.triggerEvent("cardtap", { repoId: repo.repoId });
    },
    handleFavoriteTap() {
      this.triggerEvent("favoritetap", { repo: this.properties.repo });
    },
    handleCopyTap() {
      this.triggerEvent("copytap", { repo: this.properties.repo });
    }
  }
});
