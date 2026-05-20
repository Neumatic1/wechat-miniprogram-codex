function formatCompactNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  const number = Number(value);

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}k`;
  }

  return `${number}`;
}

function formatGrowth(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "+0 stars";
  }

  return `+${formatCompactNumber(value)} stars`;
}

function formatPeriodLabel(period) {
  const labelMap = {
    daily: "日榜",
    weekly: "周榜",
    monthly: "月榜"
  };

  return labelMap[period] || "榜单";
}

function withLanguageFallback(value) {
  return value || "未标注语言";
}

module.exports = {
  formatCompactNumber,
  formatGrowth,
  formatPeriodLabel,
  withLanguageFallback
};
