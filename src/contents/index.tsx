import styleText from "data-text:../styles/content.less"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect,  useState } from "react"
import { When } from "react-if"
import Capture from "../components/Capture"
import CompareBtn from "../components/CompareBtn"
import { DOMAIN } from "../constant/domain"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

export const getShadowHostId = () => "price-compare-shadow";

export default function PlasmoOverlay() {
  const [contentUiType, setContentUiType] = useState("")

  useEffect(() => {
    const listenerEventMap = {
      START_SCREENSHOT: function () {
        setContentUiType("capture")
      },
      START_UPLOAD_IMAGE: function () {
        handleUploadImage()
      }
    }

    const messageListener = (request) => {
      console.log(request)
      listenerEventMap[request.type] && listenerEventMap[request.type](request)
    }

    chrome.runtime.onMessage.addListener(messageListener)
  }, [])

  // 处理上传图片
  const handleUploadImage = () => {
    // 创建隐藏的文件输入框
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.style.display = "none"

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      // 转换为base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        if (base64) {
          // 跳转到搜索页面，传入image_data参数
          const searchUrl = `${DOMAIN}?image_url=${encodeURIComponent(base64)}`
          window.open(searchUrl, "_blank", "noopener,noreferrer")
        }
      }
      reader.readAsDataURL(file)
    }

    // 触发文件选择
    document.body.appendChild(input)
    input.click()

    // 清理
    setTimeout(() => {
      document.body.removeChild(input)
    }, 100)
  }

  const onComplete = (result: string) => {
    // 跳转到搜索页面，传入image_data参数
    const searchUrl = `${DOMAIN}?image_url=${encodeURIComponent(result)}`
    window.open(searchUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <CompareBtn />
      <When condition={contentUiType === "capture"}>
        <Capture
          onCancel={() => setContentUiType("default")}
          onComplete={onComplete}
        />
      </When>
    </>
  )
}
