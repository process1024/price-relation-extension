import {
  getImgByBackground,
  getImgByTargetFather,
  getImgByTargetSon,
  getImgByVideo,
  inLimitSize
} from "./image"

// import { pipe } from "lodash-es";

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x)

export interface DetectedImageResult {
  imageUrl: string
  element: HTMLElement
  getTargetRect: () => DOMRect | null
}

// 判定最小可交互尺寸
const IMAGE_LIMIT_SIZE = {
  width: 100,
  height: 100
}

// 过滤掉不需要的图片关键词
const EXCLUDE_PATTERNS = [
  "icon",
  "logo",
  "avatar",
  "button",
  "arrow",
  "loading",
  "spinner",
  "placeholder",
  "banner",
  "gradient",
  "sprite",
  "pattern",
  "texture",
  "bg-",
  "background-"
]

export const isValidImgElement = (img: HTMLImageElement): boolean => {
  if (
    img.naturalWidth < IMAGE_LIMIT_SIZE.width ||
    img.naturalHeight < IMAGE_LIMIT_SIZE.height
  )
    return false
  const src = (img.currentSrc || img.src || "").toLowerCase()
  if (!src) return false
  return !EXCLUDE_PATTERNS.some((p) => src.includes(p))
}

export const getImgUrl = (img: HTMLImageElement): string => {
  const originalUrl =
    img.getAttribute("data-original") ||
    img.getAttribute("data-src") ||
    img.currentSrc ||
    img.src
  try {
    return new URL(originalUrl, window.location.href).href
  } catch {
    return originalUrl
  }
}

export const hasBackgroundImage = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element)
  const backgroundImage = style.backgroundImage
  return (
    backgroundImage &&
    backgroundImage !== "none" &&
    backgroundImage !== "initial"
  )
}

export const getBackgroundImageUrl = (element: HTMLElement): string | null => {
  const style = window.getComputedStyle(element)
  const backgroundImage = style.backgroundImage
  if (
    !backgroundImage ||
    backgroundImage === "none" ||
    backgroundImage === "initial"
  )
    return null

  const urlMatches = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/g)
  if (!urlMatches) return null
  for (const urlMatch of urlMatches) {
    const url = urlMatch.replace(/url\(['"]?([^'"]+)['"]?\)/, "$1")
    if (url.includes("gradient") || url.includes("data:")) continue
    try {
      return new URL(url, window.location.href).href
    } catch {
      if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../"))
        return url
    }
  }
  return null
}

export const isValidBackgroundImage = (element: HTMLElement): boolean => {
  const url = (getBackgroundImageUrl(element) || "").toLowerCase()
  if (!url) return false
  if (url.includes("gradient") || url.startsWith("data:")) return false
  if (EXCLUDE_PATTERNS.some((p) => url.includes(p))) return false

  const rect = element.getBoundingClientRect()
  if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) return false
  if (rect.width === 0 || rect.height === 0) return false

  const style = window.getComputedStyle(element)
  if (style.display === "none" || style.visibility === "hidden") return false
  return true
}

export const isImageContainer = (element: HTMLElement): boolean => {
  const skipTags = [
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "META",
    "LINK",
    "INPUT",
    "TEXTAREA",
    "SELECT"
  ]
  if (skipTags.includes(element.tagName)) return false

  // 包含有效 img
  const imgList = element.querySelectorAll("img")
  for (const img of imgList) {
    if (isValidImgElement(img)) return true
  }

  // 自身背景图
  if (hasBackgroundImage(element) && isValidBackgroundImage(element))
    return true

  // 类名提示 - 只有当有背景图片时才考虑类名
  const className = (element.className || "").toString().toLowerCase()
  const classHints = [
    "image",
    "img",
    "photo",
    "picture",
    "banner",
    "hero",
    "cover"
  ]
  if (classHints.some((n) => className.includes(n))) {
    // 只有当确实有有效的背景图片时才返回true
    if (hasBackgroundImage(element) && isValidBackgroundImage(element))
      return true
  }

  return false
}

export const getImageContainerUrl = (element: HTMLElement): string | null => {
  const imgList = element.querySelectorAll("img")
  for (const img of imgList) {
    if (isValidImgElement(img)) return getImgUrl(img)
  }
  if (hasBackgroundImage(element) && isValidBackgroundImage(element))
    return getBackgroundImageUrl(element)
  return null
}

export const isHoverableImageElement = (element: HTMLElement): boolean => {
  // 首先检查元素是否可见和有内容
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return false

  const style = window.getComputedStyle(element)
  if (style.display === "none" || style.visibility === "hidden") return false

  // 检查是否为img标签或包含图片的容器
  return element.tagName === "IMG" || isImageContainer(element)
}

export const detectImageFromElement = (
  element: HTMLElement
): DetectedImageResult | null => {
  let imageUrl: string | null = null
  let targetElement: HTMLElement | null = null

  if (element.tagName === "IMG") {
    const img = element as HTMLImageElement
    if (isValidImgElement(img)) {
      imageUrl = getImgUrl(img)
      targetElement = img
    }
  } else if (isImageContainer(element)) {
    imageUrl = getImageContainerUrl(element)
    targetElement = element
  }

  if (!imageUrl || !targetElement) return null

  // 最终验证：确保元素确实有图片内容
  const rect = targetElement.getBoundingClientRect()
  if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) return null

  // 额外检查：确保图片URL不为空且有效
  if (!imageUrl || imageUrl.trim() === "") return null

  return {
    imageUrl,
    element: targetElement,
    getTargetRect: () => targetElement!.getBoundingClientRect()
  }
}

export const detectImageFromEvent = (
  e: MouseEvent
): DetectedImageResult | null => {
  const target = e.target as HTMLElement | null
  if (!target) return null

  // 调试信息（仅在开发模式下显示）
  if (process.env.NODE_ENV === "development") {
    const isHoverable = isHoverableImageElement(target)
    if (isHoverable) {
      console.log("检测到可能的图片元素:", {
        tagName: target.tagName,
        className: target.className,
        rect: target.getBoundingClientRect(),
        hasBackgroundImage: hasBackgroundImage(target),
        imgCount: target.querySelectorAll("img").length
      })
    }
  }

  return detectImageFromElement(target)
}

// 该图片是否应该过滤
export function isImgFilter(img: HTMLImageElement | null) {
  // svg图片&nopin图片不采集
  return img &&
    !img.currentSrc?.includes(".svg") &&
    img.getAttribute("huaban") !== "nopin"
    ? img
    : null
}

/**获取采集的图片元素，包含多种情况
 * 1. 元素为图片
 * 2. 元素为 a 标签，子元素包含图片
 * 3. 元素有背景图
 */
export const getImgElement = (el: HTMLElement) => {
  // 如果目标直接是图片则返回
  if (el.tagName.toLowerCase() === "img") {
    const inLimit = inLimitSize(el)
    if (inLimit) {
      return null
    }
    return el
  }

  let targetImg =
    getImgByVideo(el) ??
    getImgByTargetSon(el) ??
    getImgByTargetFather(el) ??
    getImgByBackground(el) ??
    null

  // 如果鼠标事件的目标元素和图片大小差距过大则不展示

  return targetImg
}

export const getShowImgElement = pipe(getImgElement, isImgFilter)
