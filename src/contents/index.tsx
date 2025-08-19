import styleText from 'data-text:../styles/content.less';
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { Storage } from "@plasmohq/storage";
import { DOMAIN } from "../constant/domain";
import Capture from "../components/Capture";
import { When } from "react-if";

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

export const getStyle = () => {
  const style = document.createElement('style');
  style.textContent = styleText;
  return style;
};

// 只支持左上角
const getButtonXY = (rect: DOMRect) => ({
  x: rect.left + window.scrollX + 6,
  y: rect.top + window.scrollY + 6
})

function getDomain(url: string) {
  try {
    const u = new URL(url)
    return u.hostname
  } catch {
    return ""
  }
}

interface SearchButtonProps {
  imageUrl: string
  getTargetRect: () => DOMRect | null
  onClose: () => void
  onButtonMouseEnter: () => void
  onButtonMouseLeave: () => void
}

const SearchButton: React.FC<SearchButtonProps> = ({ imageUrl, getTargetRect, onClose, onButtonMouseEnter, onButtonMouseLeave }) => {
  const buttonRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const updatePosition = () => {
      const rect = getTargetRect()
      if (rect) {
        setPosition(getButtonXY(rect))
      }
    }
    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [getTargetRect])

  const handleSearch = (): void => {
    const searchUrl = `${DOMAIN}?image_url=${encodeURIComponent(imageUrl)}`
    window.open(searchUrl, '_blank', 'noopener,noreferrer')
    onClose()
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    setExpanded(true)
    onButtonMouseEnter()
  }
  const handleMouseLeave = (e: React.MouseEvent) => {
    setExpanded(false)
    onButtonMouseLeave()
  }

  return (
    <div
      ref={buttonRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 2147483647,
        backgroundColor: '#1890ff',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        cursor: 'pointer',
        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '4px',
        pointerEvents: 'auto',
        minHeight: '22px',
        minWidth: expanded ? '90px' : '28px',
        maxWidth: expanded ? '160px' : '28px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      onClick={handleSearch}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span style={{ fontSize: '15px', marginRight: expanded ? 4 : 0, transition: 'margin 0.2s' }}>🔍</span>
      <span
        style={{
          opacity: expanded ? 1 : 0,
          width: expanded ? 'auto' : 0,
          marginLeft: expanded ? 2 : 0,
          transition: 'opacity 0.18s, margin 0.18s',
          fontWeight: 500,
          fontSize: '11.5px',
          pointerEvents: expanded ? 'auto' : 'none',
        }}
      >以图搜同款</span>
    </div>
  )
}

const ImageSearchContent: React.FC = () => {
  const [searchButton, setSearchButton] = useState<{
    imageUrl: string
    getTargetRect: () => DOMRect | null
    target: HTMLElement | null
  } | null>(null)
  const [isHoveringButton, setIsHoveringButton] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentImageRef = useRef<HTMLElement | null>(null)

  // 检查当前域名是否启用
  useEffect(() => {
    const storage = new Storage()
    const domain = getDomain(window.location.href)
    if (!domain) return
    const key = `site-enable-${domain}`
    storage.get(key).then((val) => {
      setEnabled(val !== false && val !== "false")
    })
    // 实时监听 popup 设置变化
    let unsub: (() => void) | undefined
    const watchResult = storage.watch({
      [key]: (c) => {
        setEnabled(c.newValue !== false && c.newValue !== "false")
      }
    })
    if (typeof watchResult === 'function') {
      unsub = watchResult
    } else if (watchResult && typeof (watchResult as unknown as Promise<any>).then === 'function') {
      (watchResult as unknown as Promise<any>).then((u) => {
        if (typeof u === 'function') unsub = u
      })
    }
    return () => { if (typeof unsub === 'function') unsub() }
  }, [])

  // 检查元素是否为有效的图片元素
  const isValidImage = (img: HTMLImageElement): boolean => {
    if (img.naturalWidth < 100 || img.naturalHeight < 100) return false
    const src = img.src.toLowerCase()
    const excludePatterns = [
      'icon', 'logo', 'avatar', 'button', 'arrow', 
      'loading', 'spinner', 'placeholder', 'banner'
    ]
    return !excludePatterns.some(pattern => src.includes(pattern))
  }

  // 获取图片元素的URL
  const getImageUrl = (img: HTMLImageElement): string => {
    const originalUrl = img.getAttribute('data-original') || img.getAttribute('data-src') || img.src
    try {
      return new URL(originalUrl, window.location.href).href
    } catch {
      return img.src
    }
  }

  // 检查元素是否有CSS背景图片
  const hasBackgroundImage = (element: HTMLElement): boolean => {
    const style = window.getComputedStyle(element)
    const backgroundImage = style.backgroundImage
    return backgroundImage && backgroundImage !== 'none' && backgroundImage !== 'initial'
  }

  // 从CSS背景图片中提取URL
  const getBackgroundImageUrl = (element: HTMLElement): string | null => {
    const style = window.getComputedStyle(element)
    const backgroundImage = style.backgroundImage
    
    if (!backgroundImage || backgroundImage === 'none' || backgroundImage === 'initial') {
      return null
    }

    // 匹配 url() 格式的图片，支持多种格式
    const urlMatches = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/g)
    if (urlMatches && urlMatches.length > 0) {
      // 取第一个有效的图片URL（通常是最主要的图片）
      for (const urlMatch of urlMatches) {
        const url = urlMatch.replace(/url\(['"]?([^'"]+)['"]?\)/, '$1')
        
        // 跳过CSS渐变和无效URL
        if (url.includes('gradient') || url.includes('data:')) {
          continue
        }
        
        try {
          return new URL(url, window.location.href).href
        } catch {
          // 如果是相对路径，尝试直接返回
          if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
            return url
          }
        }
      }
    }

    return null
  }

  // 检查背景图片是否有效（排除小图标等）
  const isValidBackgroundImage = (element: HTMLElement): boolean => {
    const url = getBackgroundImageUrl(element)
    if (!url) return false

    const urlLower = url.toLowerCase()
    const excludePatterns = [
      'icon', 'logo', 'avatar', 'button', 'arrow', 
      'loading', 'spinner', 'placeholder', 'banner', 'gradient',
      'sprite', 'pattern', 'texture', 'bg-', 'background-'
    ]
    
    // 排除CSS渐变和数据URL
    if (urlLower.includes('gradient') || urlLower.startsWith('data:')) return false
    
    // 排除明显的图标和装饰性图片
    if (excludePatterns.some(pattern => urlLower.includes(pattern))) return false

    // 检查元素尺寸，确保不是太小的装饰元素
    const rect = element.getBoundingClientRect()
    if (rect.width < 50 || rect.height < 50) return false

    // 检查元素是否可见
    if (rect.width === 0 || rect.height === 0) return false

    // 检查元素的样式，排除一些装饰性元素
    const style = window.getComputedStyle(element)
    if (style.display === 'none' || style.visibility === 'hidden') return false

    return true
  }

  // 检查元素是否为图片容器（包含img标签或背景图片）
  const isImageContainer = (element: HTMLElement): boolean => {
    // 跳过一些明显不是图片容器的元素
    const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK', 'INPUT', 'TEXTAREA', 'SELECT']
    if (skipTags.includes(element.tagName)) {
      return false
    }

    // 检查是否包含img标签
    const imgElements = element.querySelectorAll('img')
    for (const img of imgElements) {
      if (isValidImage(img)) return true
    }
    
    // 检查是否有背景图片
    if (hasBackgroundImage(element) && isValidBackgroundImage(element)) {
      return true
    }

    // 检查元素本身是否有图片相关的类名或属性
    const className = element.className?.toLowerCase() || ''
    const classNames = ['image', 'img', 'photo', 'picture', 'banner', 'hero', 'cover']
    if (classNames.some(name => className.includes(name))) {
      // 进一步检查是否有背景图片
      if (hasBackgroundImage(element) && isValidBackgroundImage(element)) {
        return true
      }
    }

    return false
  }

  // 获取图片容器的图片URL
  const getImageContainerUrl = (element: HTMLElement): string | null => {
    // 优先检查img标签
    const imgElements = element.querySelectorAll('img')
    for (const img of imgElements) {
      if (isValidImage(img)) {
        return getImageUrl(img)
      }
    }
    
    // 检查背景图片
    if (hasBackgroundImage(element) && isValidBackgroundImage(element)) {
      return getBackgroundImageUrl(element)
    }

    return null
  }

  const handleImageHover = (e: MouseEvent): void => {
    const target = e.target as HTMLElement
    if (!target) return

    let imageUrl: string | null = null
    let targetElement: HTMLElement | null = null

    // 检查是否为img标签
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement
      if (isValidImage(img)) {
        imageUrl = getImageUrl(img)
        targetElement = img
      }
    } else {
      // 检查是否为图片容器（包含背景图片或子img标签）
      if (isImageContainer(target)) {
        imageUrl = getImageContainerUrl(target)
        targetElement = target
      }
    }

    if (!imageUrl || !targetElement) return

    // 调试信息（仅在开发模式下显示）
    if (process.env.NODE_ENV === 'development') {
      console.log('检测到图片元素:', {
        tagName: targetElement.tagName,
        className: targetElement.className,
        imageUrl,
        rect: targetElement.getBoundingClientRect()
      })
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    currentImageRef.current = targetElement
    timeoutRef.current = setTimeout(() => {
      setSearchButton({
        imageUrl,
        getTargetRect: () => targetElement!.getBoundingClientRect(),
        target: targetElement
      })
    }, 300)
  }

  const handleImageLeave = (e: MouseEvent): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHoveringButton) {
        setSearchButton(null)
        currentImageRef.current = null
      }
    }, 100)
  }

  const handleButtonMouseEnter = () => {
    setIsHoveringButton(true)
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
  }
  const handleButtonMouseLeave = () => {
    setIsHoveringButton(false)
    hideTimeoutRef.current = setTimeout(() => {
      setSearchButton(null)
      currentImageRef.current = null
    }, 100)
  }

  const handleButtonClose = (): void => {
    setSearchButton(null)
    currentImageRef.current = null
  }

  useEffect(() => {
    if (!enabled) return
    const handleMouseOver = (e: MouseEvent): void => {
      const target = e.target as HTMLElement
      if (!target) return
      
      // 检查是否为img标签或包含图片的元素
      if (target.tagName === 'IMG' || isImageContainer(target)) {
        handleImageHover(e)
      }
    }
    const handleMouseOut = (e: MouseEvent): void => {
      const target = e.target as HTMLElement
      if (!target) return
      
      // 检查是否为img标签或包含图片的元素
      if (target.tagName === 'IMG' || isImageContainer(target)) {
        handleImageLeave(e)
      }
    }

    document.addEventListener('mouseover', handleMouseOver, true)
    document.addEventListener('mouseout', handleMouseOut, true)
    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true)
      document.removeEventListener('mouseout', handleMouseOut, true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [isHoveringButton, enabled])

  useEffect(() => {
    if (!enabled) return
    let buttonContainer: HTMLDivElement | null = null
    if (searchButton) {
      buttonContainer = document.createElement('div')
      buttonContainer.id = 'image-search-btn-container'
      buttonContainer.style.position = 'absolute'
      buttonContainer.style.top = '0'
      buttonContainer.style.left = '0'
      buttonContainer.style.width = '0'
      buttonContainer.style.height = '0'
      buttonContainer.style.zIndex = '2147483647'
      buttonContainer.style.pointerEvents = 'none'
      document.body.appendChild(buttonContainer)
      const root = createRoot(buttonContainer)
      root.render(
        <SearchButton
          imageUrl={searchButton.imageUrl}
          getTargetRect={searchButton.getTargetRect}
          onClose={handleButtonClose}
          onButtonMouseEnter={handleButtonMouseEnter}
          onButtonMouseLeave={handleButtonMouseLeave}
        />
      )
    }
    return () => {
      if (buttonContainer && buttonContainer.parentNode) {
        buttonContainer.parentNode.removeChild(buttonContainer)
      }
    }
  }, [searchButton, enabled])

  return null
}
console.log('content.js');

const initImageSearch = (): void => {
  if (document.getElementById('image-search-extension-root')) return
  const container = document.createElement('div')
  container.id = 'image-search-extension-root'
  document.body.appendChild(container)
  const root = createRoot(container)
  console.log('initImageSearch');
  root.render(<ImageSearchContent />)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initImageSearch)
} else {
  initImageSearch()
}

export default function PlasmoOverlay() {
  const [contentUiType, setContentUiType] = useState('');

  useEffect(() => {
    const listenerEventMap = {
      START_SCREENSHOT: function () {
        setContentUiType('capture');
        console.log('START_SCREENSHOT');
      },
      START_UPLOAD_IMAGE: function () {
        handleUploadImage();
      },
    };

    const messageListener = (request) => {
      console.log(request);
      listenerEventMap[request.type] && listenerEventMap[request.type](request);
    };

    chrome.runtime.onMessage.addListener(messageListener);
  }, []);

  // 处理上传图片
  const handleUploadImage = () => {
    // 创建隐藏的文件输入框
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // 转换为base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          // 跳转到搜索页面，传入image_data参数
          const searchUrl = `${DOMAIN}?image_url=${encodeURIComponent(base64)}`;
          window.open(searchUrl, '_blank', 'noopener,noreferrer');
        }
      };
      reader.readAsDataURL(file);
    };
    
    // 触发文件选择
    document.body.appendChild(input);
    input.click();
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(input);
    }, 100);
  };

  const onComplete = (result: string) => {
    // 跳转到搜索页面，传入image_data参数
    const searchUrl = `${DOMAIN}?image_url=${encodeURIComponent(result)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <When condition={contentUiType === 'capture'}>
      <Capture onCancel={() => setContentUiType('default')} onComplete={onComplete}/>
    </When>
  )
} 