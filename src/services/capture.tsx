import { sendMessageByPromise } from "~services/message";
import { getBase64Size, isBase64 } from "~utils/base64";
import { getClearFixFn } from "~utils/element";
import { sleep } from "~utils/tools";

const MAC_IMG_SIZE = 44444;
// import { MAC_IMG_SIZE } from "./config";

// 获取当前标签页的可视区域截图
export async function getTabCaptureImage() {
  // 拿到 base64 的图片
  const base64 = await sendMessageByPromise<string>({
    type: "getCapture"
  });

  return base64;
}

export type ClipImage = {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function getForbidScroll(el: HTMLElement) {
  function closeDefault(e) {
    if (e.preventDefault) {
      e.preventDefault(); //取消事件的默认行为
      e.stopPropagation(); //阻止冒泡
    }
    return false;
  }

  function forbidScroll() {
    el.addEventListener("wheel", closeDefault, { passive: false });
    el.addEventListener("scroll", closeDefault, { passive: false });
  }

  function cancelForbidScroll() {
    el.removeEventListener("wheel", closeDefault);
    el.removeEventListener("scroll", closeDefault);
  }

  return [forbidScroll, cancelForbidScroll];
}

// 将图片裁剪后返回
export function clipImage2Url(img: ClipImage) {
  return new Promise<string>((resolve) => {
    const image = new Image();
    image.src = img.url;
    image.onload = function () {
      const canvas = document.createElement("canvas");
      const dp = window.devicePixelRatio;
      
      // 画布尺寸需要考虑设备像素比
      canvas.width = img.width * dp;
      canvas.height = img.height * dp;
      
      const context = canvas.getContext("2d");
      
      // 裁剪时源图像和目标画布都使用相同的DPR缩放
      context.drawImage(image, img.x * dp, img.y * dp, img.width * dp, img.height * dp, 0, 0, img.width * dp, img.height * dp);
      
      console.log('clipImage2Url - DPR:', dp);
      console.log('clipImage2Url - Canvas size:', canvas.width, 'x', canvas.height);
      console.log('clipImage2Url - Logical size:', img.width, 'x', img.height);
      
      resolve(canvas.toDataURL("image/png", 1));
    };
  });
}

interface Position {
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
}

function getLoadedImage(url) {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.src = url;
    image.onload = function () {
      resolve(image);
    };
  });
}

export function pageScroll(p: Position) {
  // 视窗外
  const { start, end } = p;
  if (
    document.documentElement.scrollTop > start.y ||
    document.documentElement.scrollTop + document.documentElement.clientHeight < end.y
  ) {
    window.scrollTo(start.x, start.y);
    // console.log(start.x, start.y);
    // document.documentElement.scrollTop = start.y;
    return sleep();
  }
}

/**
 * 根据 position 截图
 * @params position
 * @return base64的 url
 */
export async function captureImageByPosition(p: Position, clip = true) {
  const { start, end } = p;

  const tabCaptureUrl = await getTabCaptureImage();

  if (clip) {
    const clipParams: ClipImage = {
      url: tabCaptureUrl,
      width: end.x - start.x,
      height: end.y - start.y,
      x: start.x,
      y: start.y - document.documentElement.scrollTop
    };
    const result = await clipImage2Url(clipParams);
    return result;
  }
  return tabCaptureUrl;
}

// 可见区域截图
export async function captureCurrent() {
  const result = await getTabCaptureImage();
  console.log(result, 'result');
  
  // 获取视窗尺寸信息，用于后续画布设置
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  console.log('Viewport dimensions:', viewportWidth, viewportHeight);
  console.log('Device pixel ratio:', devicePixelRatio);
  
  // @ts-expect-error - Chrome extension API
  chrome.runtime.sendMessage({ type: "storage", data: {
    key: 'imageData',
    data: result
  }}, () => {
    // @ts-expect-error - Chrome extension API
    chrome.runtime.sendMessage({ type: "open", url: '/tabs/edit.html' });
  });
  // return result;
}

// 截图完成采集前的相关校验限制
function validPin(url: string) {
  if (isBase64(url)) {
    const size = getBase64Size(url);
    if (size > MAC_IMG_SIZE) {
      return false;
    }
  }

  return true;
}

// 整页截图
export async function captureFullPage() {
  const { clientWidth, scrollHeight } = document.documentElement;
  const position = {
    start: {
      x: 0,
      y: 0
    },
    end: {
      x: clientWidth,
      y: scrollHeight
    }
  };
  const captureSize = {
    width: clientWidth,
    height: scrollHeight
  };
  const result = await capturePage(position, captureSize);
  const valid = validPin(result);
  if (!valid) return;
  
  console.log('Full page capture completed');
  console.log('Full page dimensions:', clientWidth, scrollHeight);
  
  // @ts-expect-error - Chrome extension API
  chrome.runtime.sendMessage({ type: "storage", data: {
    key: 'imageData',
    data: result
  }}, () => {
    // @ts-expect-error - Chrome extension API
    chrome.runtime.sendMessage({ type: "open", url: '/tabs/edit.html' });
  });

}

export async function captureSelect(position: Position) {
  const captureHeight = position.end.y - position.start.y;
  // 分页滚动截图
  if (document.documentElement.clientHeight < captureHeight) {
    const captureSize = {
      height: captureHeight,
      width: Math.abs(position.start.x - position.end.x)
    };

    return capturePage(position, captureSize, {
      forceClearFix: true,
      // 选定区域截图时候不隐藏滚动条，隐藏的话在window场景下选定区域内容位移
      hiddenScroll: false
    });
  }
  // FIX: 不滚到顶部，兼容多数页面头部有固定栏遮盖的情况
  await pageScroll({
    start: {
      x: position.start.x,
      y: position.start.y - 200
    },
    end: {
      x: position.end.x,
      y: position.end.y - 200
    }
  });

  const result = await captureImageByPosition(position);
  return result;
}

function keyDownEvent() {
  const res = {
    isEscape: false,
    removeListener
  };
  function handleEscape(e: KeyboardEvent) {
    if (e.key === "Escape") {
      res.isEscape = true;
    }
  }

  window.addEventListener("keydown", handleEscape);

  function removeListener() {
    window.removeEventListener("keydown", handleEscape);
  }

  return res;
}

// 滚动截图
// NOTE: captureVisibleTab 限制，一秒最多调用2次
async function capturePage(
  position: Position,
  captureSize: Record<"width" | "height", number>,
  option = {
    // 是否强制清楚 fixed 元素
    forceClearFix: false,
    // 是否隐藏滚动条
    hiddenScroll: true
  }
) {
  // 监听esc 事件，提前完成截图事件
  const escapeEvent = keyDownEvent();

  const { hiddenScroller, hiddenFixed, removeHidden, unSmoothContainer } = getClearFixFn();
  const [forbidScroll, cancelForbidScroll] = getForbidScroll(document.documentElement);
  option.hiddenScroll && hiddenScroller();
  unSmoothContainer();
  forbidScroll();
  const clientHeight = document.documentElement.clientHeight;
  const height = position.end.y - position.start.y;
  const pageSize = Math.ceil(height / clientHeight);
  // const pageNum = pageSize > CAPTURE_LIMIT ? CAPTURE_LIMIT : pageSize;
  const pagePosition = [] as Position[];
  if (pageSize === 1) {
    pagePosition.push(position);
  } else {
    for (let index = 0; index < pageSize; index++) {
      pagePosition.push({
        start: {
          x: position.start.x,
          y: position.start.y + clientHeight * index
        },
        end: {
          x: position.end.x,
          y:
            index + 1 === pageSize
              ? (height % clientHeight) + pagePosition[index - 1].end.y
              : position.start.y + clientHeight * (index + 1)
        }
      });
    }
  }

  // 二维数组，存放每次 drawImage 的参数
  const drawImageArr: Array<[HTMLImageElement, number, number, number, number, number, number, number, number]> = [];

  for (let i = 0; i < pagePosition.length; i++) {
    if (escapeEvent.isEscape) {
      removeHidden();
      cancelForbidScroll();
      escapeEvent.removeListener();
      break;
    }

    const curPosition = pagePosition[i];
    await pageScroll(curPosition);
    if (i > 0 || option.forceClearFix) {
      hiddenFixed();
      // FIX: 百度图片 第二页滚动位置不对
      pageScroll(curPosition);
    }
    await sleep();
    const result = await captureImageByPosition(curPosition);

    const image = await getLoadedImage(result);

    const { start, end } = curPosition;

    // console.log(
    //   "%c+",
    //   `padding: ${image.height}px ${image.width}px;
    //   font-size: 0;
    //   background-image: url(${result});
    //   background-size: contain;
    //   background-repeat: no-repeat`
    // );

    if (i === pagePosition.length - 1) {
      removeHidden();
      cancelForbidScroll();
    }

    drawImageArr.push([
      image,
      0,
      0,
      end.x - start.x,
      end.y - start.y,
      0,
      document.documentElement.clientHeight * i,
      end.x - start.x,
      end.y - start.y
    ]);
  }

  const canvas = document.createElement("canvas");
  const dp = window.devicePixelRatio;
  
  // 最终画布尺寸需要考虑设备像素比
  canvas.width = captureSize.width * dp;
  const lastPageHeight = drawImageArr[drawImageArr.length - 1][4];
  canvas.height = ((drawImageArr.length - 1) * clientHeight + lastPageHeight) * dp;
  
  console.log('capturePage - Final canvas size:', canvas.width, 'x', canvas.height);
  console.log('capturePage - DPR:', dp);
  console.log('capturePage - Logical size:', captureSize.width, 'x', (drawImageArr.length - 1) * clientHeight + lastPageHeight);
  
  const context = canvas.getContext("2d");
  
  // 绘制时需要调整每个片段的位置和尺寸以匹配DPR
  drawImageArr.forEach((draw) => {
    const [image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight] = draw;
    // 所有坐标和尺寸都需要乘以DPR
    context.drawImage(image, sx * dp, sy * dp, sWidth * dp, sHeight * dp, dx * dp, dy * dp, dWidth * dp, dHeight * dp);
  });

  return canvas.toDataURL("image/png", 1);
}

export default {
  captureCurrent,
  captureFullPage,
  captureSelect
};
