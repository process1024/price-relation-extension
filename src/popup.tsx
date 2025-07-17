import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"

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

  return (
    <div id="popup-root">
      <div style={{
        padding: 0,
        minWidth: 270,
        background: '#fff',
        // borderRadius: 14, // 去掉圆角
        boxShadow: '0 4px 18px rgba(24,144,255,0.10)',
        fontFamily: 'Segoe UI, PingFang SC, Arial, sans-serif',
        color: '#222',
        maxWidth: 350,
        border: '1.5px solid #e6f7ff',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '14px 0 8px 0',
          textAlign: 'center',
          // borderTopLeftRadius: 14,
          // borderTopRightRadius: 14
        }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: 1 }}>以图搜同款</div>
        </div>
        <div style={{ padding: '18px 20px 10px 20px' }}>
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
              href="https://tenant.boyxch.com/"
              target="_blank"
              style={{
                color: '#1890ff',
                fontSize: 15,
                textDecoration: 'none',
                fontWeight: 500,
                border: '1px solid #e6f7ff',
                // borderRadius: 8,
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
