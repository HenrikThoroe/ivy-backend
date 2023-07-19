export function createDayTimestamp(date: Date) {
  const timestamp = date.getTime()
  const day = Math.floor(timestamp / (24 * 60 * 60 * 1000))

  return day
}
