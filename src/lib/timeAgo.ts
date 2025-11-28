export function timeAgo(input?: string | Date | number | null) {
  const now = Date.now()
  if (input == null) return "알 수 없음"

  let then: number
  if (typeof input === 'string') {
    then = new Date(input).getTime()
  } else if (typeof input === 'number') {
    then = input
  } else if (input instanceof Date) {
    then = input.getTime()
  } else {
    return '알 수 없음'
  }
  const diff = Math.floor((now - then) / 1000) // seconds

  if (isNaN(then) || !isFinite(then)) return "알 수 없음"

  const units: [number, string, string][] = [
    [60, "초", "초 전"],
    [60, "분", "분 전"],
    [24, "시간", "시간 전"],
    [7, "일", "일 전"],
    [4.34524, "주", "주 전"],
    [12, "개월", "개월 전"],
  ]

  let seconds = diff
  if (seconds < 5) return "방금 전"
  if (seconds < 0) return "방금 전"

  for (let i = 0; i < units.length; i++) {
    const [limit, _name, suffix] = units[i]
    if (seconds < limit) {
      // for first unit, seconds < 60 -> show seconds
      const value = Math.floor(seconds)
      return `${value}${suffix}`
    }
    seconds = Math.floor(seconds / limit)
  }

  // years fallback
  const years = Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24 * 365))
  return years > 0 ? `${years}년 전` : "오래됨"
}

export default timeAgo
