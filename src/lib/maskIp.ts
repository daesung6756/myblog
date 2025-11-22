export function maskIp(ip?: string | null) {
  if (!ip) return "";
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length >= 4) {
      parts[parts.length - 1] = '***'
      return parts.join('.')
    }
  }
  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':')
    parts[parts.length - 1] = '***'
    return parts.join(':')
  }
  return ip.slice(0, Math.max(0, ip.length - 3)) + '***'
}

export default maskIp
