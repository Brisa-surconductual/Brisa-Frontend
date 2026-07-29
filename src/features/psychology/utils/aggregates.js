export function sumCounts(items) {
  return items.reduce((total, item) => total + item.count, 0);
}

export function getSharePercentage(count, total) {
  if (!total) {
    return 0;
  }

  return Math.round((count / total) * 100);
}
