import { getChildImgs } from "./element";

// 判定最小可交互尺寸
const IMAGE_LIMIT_SIZE = {
  width: 60,
  height: 60
}

// 获取图片的原始宽高
export function getImgNaturalSize(el: HTMLImageElement) {
  const size = {
    width: 0,
    height: 0,
  };
  if (el.naturalWidth) {
    size.width = el.naturalWidth;
    size.height = el.naturalHeight;
  } else {
    const img = new Image();
    img.src = el.src;
    size.width = img.width;
    size.height = img.height;
  }
  if (size.width === 0 && size.height === 0) {
    if (el.width === 0 && el.height === 0) return size;
    size.width = el.width;
    size.height = el.height;
  }
  return size;
}

export function getElemSize(el: HTMLImageElement) {
  return {
    width: el.offsetWidth,
    height: el.offsetHeight,
  };
}

// 判断图片地址是否能正常加载
export function getImageLoad(url: string) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = function () {
      resolve(image);
    };
    image.onerror = function () {
      reject();
    };
  });
}

function isBase64(url: string) {
  return url.startsWith('data:');
}

const ALL_IMAGE_TYPE = ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff'];

export function getImageType(url: string) {
  let imgType = 'jpg';
  if (isBase64(url)) {
    // data/image,或者data/img
    imgType = url.match('\\image/\\w+')
      ? url.match('\\image/\\w+')[0].split('/')[1]
      : url.match('\\img/\\w+')[0].split('/')[1];
  } else {
    const type = url.split('?')[0].split('.').pop();
    if (ALL_IMAGE_TYPE.includes(type)) {
      imgType = type;
    }
  }
  return imgType.toUpperCase();
}

/**
 * @function 获取图片元素 原图/当前渲染 的url、元素的背景图
 * @params img 支持三种类型
 * 1. 图片元素
 * 2. 普通元素
 * 3. 带有src 属性的对象
 * @params isAsync 是否支持异步
 */
export function getImageOriginUrl(
  img: HTMLImageElement | HTMLElement | Pick<HTMLImageElement, 'currentSrc' | 'src'>,
  { isAsync } = { isAsync: false },
): string | Promise<string> {
  const src = img.currentSrc || img.getAttribute('src');
  if (img.getAttribute('srcset') && img.currentSrc) {
    // 将srcset 值取出来并排序
    const t = /^-?\d+$/;
    const srcset = img.getAttribute('srcset');
    const handleSrcData = srcset.split(/,+/).map((curSrc) => {
      const srcData = {} as {
        url: string;
        width: number;
      };
      curSrc
        .trim()
        .split(/\s+/)
        .forEach((e, o) => {
          if (o === 0) {
            return (srcData.url = e);
          }
          const width = e.slice(0, -1);
          // 宽度单位
          const unitStr = e[e.length - 1];
          const unit = Number.parseInt(width, 10);
          // Number.parseFloat(n);
          if (unitStr === 'w' && t.test(width)) {
            unit > 0 && (srcData.width = unit);
          } else {
            unitStr === 'x' && t.test(width) && unit > 0 && (srcData.width = unit);
          }
        });

      return srcData;
    });
    const srcSort = handleSrcData
      .filter((e, index) => JSON.stringify(e) !== JSON.stringify(handleSrcData[index - 1]))
      .sort(function (a, b) {
        return a.width > b.width ? -1 : a.width < b.width ? 1 : 0;
      });
    if (srcSort.length > 0 && srcSort[0].url && srcSort[0].width > 0) {
      return handlePrefixUrl(srcSort[0].url);
    }
    return handlePrefixUrl(src);
  } else if (src) {
    return src
  } else if (getComputedStyle(img).getPropertyValue('background-image') !== 'none') {
    const backgroundImage = getComputedStyle(img).getPropertyValue('background-image');
    return handlePrefixUrl(backgroundImage.replace(/.*url\(\"([^\)]+)\"\).*/gi, '$1'));
  }
  return '';
}

function handlePrefixUrl(url: string) {
  if (url.startsWith('//')) {
    return location.protocol + url;
  } else if (url.startsWith('/')) {
    return location.origin + url;
  }
  return url;
}

export async function copyImageFromBase64(base64Image: string) {
  // 将 base64 数据转换为 Blob
  const byteCharacters = atob(base64Image.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/png' });

  // 创建一个 ClipboardItem 并复制到剪贴板
  const clipboardItem = new ClipboardItem({ [blob.type]: blob });
  await navigator.clipboard.write([clipboardItem]);
  console.log('Image copied to clipboard');
}

export function batchDownloadImages(imageUrls, format = 'jpg') {
  imageUrls.forEach((url, index) => {
      chrome.downloads.download({
          url: url,
          filename: `image_${index}.${format}`,
          saveAs: false // 设置为false以避免弹出保存对话框
      }, (downloadId) => {
          if (chrome.runtime.lastError) {
              console.error(`Error downloading image ${url}:`, chrome.runtime.lastError);
          } else {
              console.log(`Started downloading image_${index}.${format} with ID:`, downloadId);
          }
      });
  });
}

export function getBase64ImageDimensions(base64: string) {
  return new Promise<{width: number, height: number}>((resolve, reject) => {
      const img = new Image();
      img.src = base64;

      img.onload = () => {
          resolve({
              width: img.width,
              height: img.height
          });
      };

      img.onerror = (error) => {
          reject(error);
      };
  });
}

/**
 * 获取考虑设备像素比的实际显示尺寸
 * @param width 图片原始宽度
 * @param height 图片原始高度
 * @param devicePixelRatio 设备像素比，默认从window获取
 * @returns 实际显示尺寸
 */
export function getActualDisplayDimensions(
  width: number, 
  height: number, 
  devicePixelRatio?: number
): { width: number; height: number } {
  const ratio = devicePixelRatio || window.devicePixelRatio || 1;
  return {
    width: width / ratio,
    height: height / ratio
  };
}

/**
 * 调试函数：打印尺寸相关信息
 */
export function debugImageDimensions(
  originalWidth: number,
  originalHeight: number,
  devicePixelRatio?: number
): void {
  const ratio = devicePixelRatio || window.devicePixelRatio || 1;
  const actual = getActualDisplayDimensions(originalWidth, originalHeight, ratio);
  
  console.group('🖼️ Image Dimensions Debug');
  console.log('📏 Original size:', `${originalWidth} × ${originalHeight}`);
  console.log('📱 Device pixel ratio:', ratio);
  console.log('🎯 Actual display size:', `${actual.width} × ${actual.height}`);
  console.log('🖥️ Viewport size:', `${window.innerWidth} × ${window.innerHeight}`);
  console.groupEnd();
}

export const getImgByVideo = (el) => {
  if (el.tagName.toLowerCase() !== "video") {
    return null;
  }

  // 只有设置了 crossorigin 的 video 才能渲染到画布
  if (el.getAttribute("crossorigin")) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    const { videoWidth, videoHeight } = el as HTMLVideoElement;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx.drawImage(el as HTMLVideoElement, 0, 0, canvas.width, canvas.height);
    const imgEl = document.createElement("img");
    imgEl.src = canvas.toDataURL("image/png", 1);
    imgEl.width = videoWidth;
    imgEl.height = videoHeight;
    imgEl.setAttribute("huaban-custom-img", "1");
    return imgEl;
  }
  // 采集有设置封面图的video
  else if (el.getAttribute("poster")) {
    const imgEl = document.createElement("img");
    imgEl.src = el.getAttribute("poster");
    imgEl.width = (el as HTMLVideoElement).videoWidth;
    imgEl.height = (el as HTMLVideoElement).videoHeight;
    imgEl.setAttribute("huaban-custom-img", "1");
    return imgEl;
  }
};


// 从目标元素的子元素中找到图片
export const getImgByTargetSon = (el) => {
  if (el.nodeName !== "A" && el.nodeName !== "DIV") {
    return null;
  }
  const img = el?.getElementsByTagName("img")[0];

  if (img) {
    const inLimit = inLimitSize(img);

    if (!inLimit && checkValid(img, el)) {
      return img;
    }
  }
};
// 从目标元素的父元素中找图片
export const getImgByTargetFather = (el) => {
  if (!el?.parentElement || (el.nodeName !== "A" && el.nodeName !== "DIV")) {
    return null;
  }

  const imgs = getChildImgs(el.parentElement);

  if (imgs.length) {
    const sideImg = imgs.find((imgEl) => !inLimitSize(imgEl));

    if (sideImg && checkValid(sideImg, el)) return sideImg;
  }
};

export function inLimitSize(el: HTMLElement) {
  const size = getImgNaturalSize(el as HTMLImageElement);
  const elemSize = getElemSize(el as HTMLImageElement);
  if (
    size.width < IMAGE_LIMIT_SIZE.width ||
    size.height < IMAGE_LIMIT_SIZE.height ||
    elemSize.width < IMAGE_LIMIT_SIZE.width ||
    elemSize.height < IMAGE_LIMIT_SIZE.height
  ) {
    return true;
  }
  return false;
}


const checkValid = (imgEl, targetEl) => {
  // 判断鼠标如果移动上去的元素和查询到的图片元素大小差距过大则不显示
  const { width, height } = getElemSize(imgEl);
  const { width: targetWidth, height: targetHeight } = getElemSize(targetEl);
  if (width * 2 < targetWidth || height * 2 < targetHeight) {
    return false;
  } else {
    return true;
  }
};



export const getImgByBackground = (el) => {
  if (getComputedStyle(el).getPropertyValue("background-image") !== "none") {
    if (el.clientWidth < IMAGE_LIMIT_SIZE.width || el.clientHeight < IMAGE_LIMIT_SIZE.height) {
      return null;
    }
    const backgroundImage = getComputedStyle(el).getPropertyValue("background-image");
    if (!backgroundImage.startsWith("url")) {
      return null;
    }

    const url = backgroundImage.replace(/.*url\(([^\)]+)\).*/gi, "$1").replace(/"/g, "");
    if (isBase64(url)) {
      return null;
    }
    const imgEl = document.createElement("img");
    imgEl.src = url;
    imgEl.width = el.clientWidth;
    imgEl.height = el.clientHeight;
    imgEl.setAttribute("huaban-custom-img", "1");
    return imgEl;
  } else {
    return null;
  }
};