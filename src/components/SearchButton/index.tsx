import { useEffect, useRef, useState } from "react"

import { DOMAIN } from "../../constant/domain"

// 只支持左上角
const getButtonXY = (rect: DOMRect) => ({
  x: rect.left + window.scrollX + 6,
  y: rect.top + window.scrollY + 6
})

interface SearchButtonProps {
  imageUrl: string
  getTargetRect: () => DOMRect | null
  onClose: () => void
  onButtonMouseEnter: () => void
  onButtonMouseLeave: () => void
}

const SearchButton: React.FC<SearchButtonProps> = ({
  imageUrl,
  getTargetRect,
  onClose,
  onButtonMouseEnter,
  onButtonMouseLeave
}) => {
  const buttonRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0
  })
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
    window.open(searchUrl, "_blank", "noopener,noreferrer")
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
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 2147483647,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        color: "white",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "11px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        cursor: "pointer",
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
        userSelect: "none",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "4px",
        pointerEvents: "auto",
        minHeight: "22px",
        minWidth: expanded ? "90px" : "32px",
        whiteSpace: "nowrap",
        overflow: "hidden"
      }}
      onClick={handleSearch}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      <img
        style={{
          width: "15px",
          height: "15px",
          marginRight: expanded ? 4 : 0,
          transition: "margin 0.2s"
        }}
        src="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20fill%3D%22none%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22b%22%20x1%3D%221%22%20x2%3D%220%22%20y1%3D%22.525%22%20y2%3D%22.5%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23FF4000%22%2F%3E%3Cstop%20offset%3D%2298.571%25%22%20stop-color%3D%22%23FF702D%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22c%22%20x1%3D%221%22%20x2%3D%220%22%20y1%3D%22.525%22%20y2%3D%22.5%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23FF4000%22%2F%3E%3Cstop%20offset%3D%2298.571%25%22%20stop-color%3D%22%23FF702D%22%2F%3E%3C%2FlinearGradient%3E%3ClinearGradient%20id%3D%22d%22%20x1%3D%221%22%20x2%3D%220%22%20y1%3D%22.525%22%20y2%3D%22.5%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23FF4000%22%2F%3E%3Cstop%20offset%3D%2298.571%25%22%20stop-color%3D%22%23FF702D%22%2F%3E%3C%2FlinearGradient%3E%3CclipPath%20id%3D%22a%22%3E%3Crect%20width%3D%2224%22%20height%3D%2224%22%20rx%3D%220%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3Cpath%20fill%3D%22url%28%27%23b%27%29%22%20fill-rule%3D%22evenodd%22%20d%3D%22M9%201.072q-1.528.074-3.056.223c-2.692.263-4.704%202.442-4.832%205.144q-.037.774-.061%201.56h2q.024-.738.059-1.466.061-1.3.917-2.215.85-.91%202.11-1.033Q7.57%203.145%209%203.075zm0%2019.853q-1.351-.067-2.703-.195-1.29-.123-2.182-1.083-.902-.97-.966-2.314-.056-1.189-.09-2.333H1.056q.036%201.19.095%202.427c.13%202.753%202.212%205.033%204.956%205.294q1.446.137%202.892.207zm7%201.945v-2.004q.845-.056%201.69-.136%201.294-.123%202.192-1.085.905-.97.968-2.312.056-1.189.091-2.333h2.001q-.035%201.19-.094%202.427c-.13%202.755-2.224%205.034-4.97%205.294q-.94.089-1.878.15m0-19.736V1.129q1.021.066%202.044.166c2.693.262%204.716%202.44%204.844%205.144q.036.774.06%201.56h-2q-.024-.738-.058-1.466-.061-1.297-.921-2.213-.854-.911-2.12-1.034-.924-.09-1.85-.152%22%2F%3E%3Cpath%20fill%3D%22url%28%27%23c%27%29%22%20fill-rule%3D%22evenodd%22%20d%3D%22M16.438%2010.969a4.969%204.969%200%201%201-9.938%200%204.969%204.969%200%200%201%209.938%200m-2%200q0-1.23-.87-2.1Q12.698%208%2011.47%208t-2.1.87q-.869.87-.869%202.099t.87%202.1%202.099.869%202.1-.87q.869-.87.869-2.099%22%2F%3E%3Cpath%20fill%3D%22url%28%27%23d%27%29%22%20fill-rule%3D%22evenodd%22%20d%3D%22M15.761%2015.282a1%201%200%200%201%200-2h2.46a1%201%200%201%201%200%202z%22%20transform%3D%22rotate%2845%2014.761%2013.282%29%22%2F%3E%3C%2Fsvg%3E"
        alt="logo"
      />
      <span
        style={{
          opacity: expanded ? 1 : 0,
          width: expanded ? "auto" : 0,
          marginLeft: expanded ? 2 : 0,
          transition: "opacity 0.18s, margin 0.18s",
          fontWeight: 500,
          fontSize: "14px",
          pointerEvents: expanded ? "auto" : "none"
        }}>
        同款比价
      </span>
    </div>
  )
}

export default SearchButton
