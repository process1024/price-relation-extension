import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"
import { DOMAIN } from "./constant/domain"

function getDomain(url: string) {
  try {
    const u = new URL(url)
    return u.hostname
  } catch {
    return ""
  }
}

// 全局样式注入，去除html,body默认margin
function injectGlobalStyle() {
  if (document.getElementById('popup-global-style')) return
  const style = document.createElement('style')
  style.id = 'popup-global-style'
  style.innerHTML = `
    html, body {
      margin: 0;
      padding: 0;
      background: #f7f9fb;
      min-width: 100vw;
      min-height: 100vh;
      box-sizing: border-box;
    }
    #popup-root {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      min-width: 100vw;
    }
  `
  document.head.appendChild(style)
}

function IndexPopup() {
  const [enabled, setEnabled] = useState(true)
  const [domain, setDomain] = useState("")
  const [loading, setLoading] = useState(true)
  const storage = new Storage()

  useEffect(() => {
    injectGlobalStyle()
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const url = tabs[0]?.url || ""
      const d = getDomain(url)
      setDomain(d)
      if (d) {
        const key = `site-enable-${d}`
        const val = await storage.get(key)
        setEnabled(val !== false && val !== "false")
      }
      setLoading(false)
    })
  }, [])

  const handleToggle = async () => {
    if (!domain) return
    const key = `site-enable-${domain}`
    const newVal = !enabled
    setEnabled(newVal)
    await storage.set(key, newVal)
  }

  // 截图按钮点击
  const handleScreenshot = async () => {
    // 发送截图指令到当前tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'START_SCREENSHOT' })
        window.close() // 关闭popup
      }
    })
  }

  // 上传图片按钮点击
  const handleUploadImage = async () => {
    // 发送上传图片指令到当前tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'START_UPLOAD_IMAGE' })
        window.close() // 关闭popup
      }
    })
  }

  const handleSearch = async () => {
    chrome.tabs.create({ url: `${DOMAIN}/#/all/gift` })
  }

  return (
    <div id="popup-root">
      <div style={{
        padding: 0,
        minWidth: 320,
        background: '#fafbfc',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        fontFamily: 'Segoe UI, PingFang SC, Arial, sans-serif',
        color: '#222',
        maxWidth: 400,
        border: '1px solid #ececec',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#fff',
          padding: '16px 0 8px 0',
          textAlign: 'center',
          color: '#222',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: 1 }}>以图搜同款</div>
        </div>
        <div style={{ padding: '22px 18px 10px 18px' }}>
          {/* 三大功能入口 - 横向卡片风格 */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 16, justifyContent: 'center', marginBottom: 22 }}>
            {/* 一键截图找同款 */}
            <div
              style={{
                flex: 1,
                minWidth: 90,
                maxWidth: 120,
                background: '#f5f5f7',
                borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '22px 0 16px 0',
                cursor: 'pointer',
                transition: 'box-shadow 0.18s, background 0.18s',
                border: '1px solid #ececec',
                userSelect: 'none',
                textAlign: 'center',
              }}
              tabIndex={0}
              onMouseOver={e => (e.currentTarget.style.background = '#ededed')}
              onMouseOut={e => (e.currentTarget.style.background = '#f5f5f7')}
              onClick={handleScreenshot}
            >
              <span style={{ fontSize: 28, marginBottom: 10, color: '#222' }}>🖼️</span>
              <span style={{ fontSize: 15, color: '#222', fontWeight: 500 }}>一键截图找同款</span>
            </div>
            {/* 上传图片找同款 */}
            <div
              style={{
                flex: 1,
                minWidth: 90,
                maxWidth: 120,
                background: '#f5f5f7',
                borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '22px 0 16px 0',
                cursor: 'pointer',
                transition: 'box-shadow 0.18s, background 0.18s',
                border: '1px solid #ececec',
                userSelect: 'none',
                textAlign: 'center',
              }}
              tabIndex={0}
              onMouseOver={e => (e.currentTarget.style.background = '#ededed')}
              onMouseOut={e => (e.currentTarget.style.background = '#f5f5f7')}
              onClick={handleUploadImage}
            >
              <span style={{ fontSize: 28, marginBottom: 10, color: '#222' }}>➕</span>
              <span style={{ fontSize: 15, color: '#222', fontWeight: 500 }}>上传图片找同款</span>
            </div>
            {/* 关键词搜索 */}
            <div
              style={{
                flex: 1,
                minWidth: 90,
                maxWidth: 120,
                background: '#f5f5f7',
                borderRadius: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '22px 0 16px 0',
                cursor: 'pointer',
                transition: 'box-shadow 0.18s, background 0.18s',
                border: '1px solid #ececec',
                userSelect: 'none',
                textAlign: 'center',
              }}
              tabIndex={0}
              onMouseOver={e => (e.currentTarget.style.background = '#ededed')}
              onMouseOut={e => (e.currentTarget.style.background = '#f5f5f7')}
              onClick={handleSearch}
            >
              <span style={{ fontSize: 28, marginBottom: 10, color: '#222' }}>🔍</span>
              <span style={{ fontSize: 15, color: '#222', fontWeight: 500 }}>关键词搜索</span>
            </div>
          </div>
          {/* 原有网站开关和官网链接 */}
          {!loading && domain && (
            <>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 2, display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#888', fontWeight: 400, fontSize: 14 }}>当前网站：</span>
                <span style={{ color: '#1890ff', fontWeight: 600, marginLeft: 4, fontSize: 15 }}>{domain}</span>
              </div>
              <div style={{ margin: '14px 0 10px 0', borderTop: '1px solid #f0f0f0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 15, color: enabled ? '#1890ff' : '#aaa', fontWeight: 500 }}>
                  {enabled ? '已启用搜同款按钮' : '已关闭搜同款按钮'}
                </span>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginLeft: 8 }}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={handleToggle}
                    style={{
                      marginRight: 0,
                      width: 20,
                      height: 20,
                      accentColor: '#1890ff',
                      cursor: 'pointer',
                      borderRadius: 7
                    }}
                  />
                </label>
              </div>
            </>
          )}
          <div style={{ margin: '18px 0 0 0', textAlign: 'center' }}>
            <a
              href={DOMAIN}
              target="_blank"
              style={{
                color: '#1890ff',
                fontSize: 15,
                textDecoration: 'none',
                fontWeight: 500,
                border: '1px solid #e6f7ff',
                padding: '7px 22px',
                background: '#f7f9fb',
                display: 'inline-block',
                boxShadow: '0 1px 4px rgba(24,144,255,0.06)'
              }}
            >
              官网
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
