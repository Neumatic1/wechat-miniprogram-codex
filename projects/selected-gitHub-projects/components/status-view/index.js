Component({
  properties: {
    title: {
      type: String,
      value: ""
    },
    description: {
      type: String,
      value: ""
    },
    actionText: {
      type: String,
      value: ""
    }
  },
  methods: {
    handleActionTap() {
      this.triggerEvent("actiontap");
    }
  }
});
