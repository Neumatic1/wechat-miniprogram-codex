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

function formatUpdatedAt(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
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
  formatUpdatedAt,
  formatPeriodLabel,
  withLanguageFallback
};
