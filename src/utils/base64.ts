export function getBase64Size(base64: string) {
  const str = base64.split(",")[1].split("=")[0]
  const strLength = str.length
  const size = Math.ceil(strLength - (strLength / 8) * 2)
  // 单位为m
  return +(size / 1024 / 1024).toFixed(2)
}

export const isBase64 = (url: string) => {
  if (!url) {
    return false
  }
  return url.startsWith("data:image")
}
