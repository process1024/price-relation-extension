export function getElementLeft(element: HTMLElement) {
  // return element.getBoundingClientRect().left + document.documentElement.scrollLeft;
  return getElPosition(element).left;
}

export function getElementTop(element: HTMLElement) {
  // return element.getBoundingClientRect().top + document.documentElement.scrollTop;
  return getElPosition(element).top;
}

export function getElPosition(el) {
  const rect = el.getBoundingClientRect();
  return {
    top: Math.round(rect.top + window.scrollY),
    left: Math.round(rect.left + window.scrollX),
    bottom: Math.round(rect.bottom + window.scrollY),
    right: Math.round(rect.right + window.scrollX)
  };
}

interface FixElement extends HTMLElement {
  hasOrigin?: boolean;
  originCssText?: string;
}

/**
 * 滚动截图 插入 移除滚动条、固定元素的样式函数
 */
export function getClearFixFn() {
  const allFixedEl = [] as FixElement[];
  const fixedPosition = ["fixed", "sticky"];
  const style = document.createElement("style");
  style.type = "text/css";

  // 移除固定定位的元素样式
  document.head.appendChild(style);

  style.textContent = "";

  // 隐藏滚动条
  function hiddenScroller() {
    const hiddenScrollStyle =
      "body::-webkit-scrollbar { display: none; } body { -ms-overflow-style: none; }  body,html, html *{scrollbar-color: transparent transparent !important;scrollbar-width: none !important;} ";
    style.textContent += hiddenScrollStyle;
  }

  const scrollBehavior = document.documentElement.style["scrollBehavior"];
  // 去除滚动动画
  function unSmoothContainer() {
    document.documentElement.style["scrollBehavior"] = "auto";
  }

  function hiddenFixed() {
    // console.time();
    const allEle = document.querySelectorAll("*");
    const currentFixEl = [] as FixElement[];
    const square = window.innerHeight * window.innerWidth;
    allEle.forEach((el) => {
      const style = window.getComputedStyle(el);
      const position = style.getPropertyValue("position");
      if (fixedPosition.includes(position) && !isElContainWindow(el)) {
        if (style.position === "sticky") {
          // 以下条件判断参考 eagle
          if (
            (el.clientHeight * el.clientWidth < 0.2 * square &&
              +style.top.replace("px", "") > 10 &&
              el.clientWidth < 0.8 * window.innerWidth &&
              el.clientHeight < window.innerHeight) ||
            (style.right === "0px" &&
              style.top === "0px" &&
              el.clientHeight === window.innerHeight &&
              el.clientWidth < 0.3 * window.innerWidth) ||
            ("0px" === style.bottom && "0px" !== style.top && el.clientHeight < window.innerHeight) ||
            ("0px" === style.top && "100%" !== style.height && el.clientHeight < window.innerHeight) ||
            (el.clientHeight < 100 &&
              el.clientWidth < 100 &&
              el.clientHeight * el.clientWidth < 5625 &&
              el.clientHeight < window.innerHeight)
          ) {
            if (!allFixedEl.includes(el)) {
              allFixedEl.push(el);
            }
            currentFixEl.push(el);
          }
        } else {
          // console.log(allFixedEl.includes(el));
          if (!allFixedEl.includes(el)) {
            allFixedEl.push(el);
          }
          currentFixEl.push(el);
        }
      }
    });
    // console.log(currentFixEl, "currentFixEl");
    currentFixEl.forEach((e) => {
      // 暂存元素原有的内联样式
      if (!e.hasOrigin) {
        e.originCssText = e.style.cssText;
        e.hasOrigin = true;
      }
      e.style.cssText =
        "visibility: hidden !important;overflow: hidden !important;opacity: 0 !important;transition: none 0s ease 0s";
    });
    // console.timeEnd();
  }

  // 固定元素 充满屏幕
  function isElContainWindow(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const { top, width, left, height } = rect;
    const { clientWidth, clientHeight } = document.documentElement;
    if (top === 0 && left === 0 && width === clientWidth && height === clientHeight) {
      return true;
    }
  }

  function removeHidden() {
    allFixedEl.forEach((e) => {
      e.style.cssText = e.originCssText;
    });
    document.head.removeChild(style);
    document.documentElement.style["scrollBehavior"] = scrollBehavior;
  }

  return {
    hiddenScroller,
    unSmoothContainer,
    hiddenFixed,
    removeHidden
  };
}

// 获取所有的子元素图片
export function getChildImgs(e: HTMLElement): Array<HTMLImageElement> {
  return Array.from(e.querySelectorAll("IMG"));
}

export function getHoverImgElement(e: MouseEvent) {
  // console.time();
  const imgs = getVisibleImgElements();
  const img = imgs.find((img) => isMouseInElement(img, { x: e.x, y: e.y }));
  // console.log(imgs.length);
  // console.timeEnd();
  return img;
}

export function getVisibleImgElements() {
  const imgs = Array.from(document.getElementsByTagName("img")).filter((ele) => isElementVisible(ele));
  return imgs;
}

function isElementVisible(elem: HTMLElement) {
  return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
}

/**
 * 当前鼠标是否在元素内
 */
export function isMouseInElement(ele: HTMLElement | Element, axis: { x: number; y: number }) {
  const { x, y, width, height } = ele.getBoundingClientRect();
  if (axis.x >= x && axis.x <= x + width && axis.y >= y && axis.y <= y + height) {
    return true;
  }
  return false;
}

export function getMouseHoverElementPosition(axis: { x: number; y: number }) {
  const elements = document.elementsFromPoint(axis.x, axis.y);
  const length = elements.length;
  for (let index = 0; index < length - 1; index++) {
    const element = elements[index];
    const { width, height, opacity, display, visibility, pointerEvents } = getComputedStyle(element);
    if (
      width !== "0" &&
      height !== "0" &&
      opacity !== "0" &&
      display !== "none" &&
      visibility !== "hidden" &&
      pointerEvents !== "none"
    ) {
      const elementInfo = isMouseInElement(element, axis);
      if (elementInfo) {
        return getElPosition(element);
      }
    }
  }
  return null;
}

export type TElementPosition = ReturnType<typeof getMouseHoverElementPosition>;
