import { MutableRefObject, useEffect } from "react";
import { useCallback, useMemo, useState } from "react";
import { When } from "react-if";

import "./index.less";

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface IProps {
  position: Position;
  style: Partial<React.CSSProperties>;
  size: Size;
  container: MutableRefObject<HTMLElement>;
  onDragStop: (e: any) => void;
  children: React.FC;
}

type PosMap = "e" | "w" | "s" | "n" | "ne" | "nw" | "se" | "sw" | "move";
type PageEvent = Pick<MouseEvent, "pageX" | "pageY">;

function calcOffset(endEvent: PageEvent, startEvent: PageEvent) {
  const x = endEvent.pageX - startEvent.pageX;
  const y = endEvent.pageY - startEvent.pageY;

  return { x, y };
}

export function Resizer({ position, style = {}, size, container, onDragStop, children }: IProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ pageX: 0, pageY: 0 });
  const [dragType, setDragType] = useState<PosMap>("move");

  const resizeStyle: Partial<React.CSSProperties> = useMemo(() => {
    return {
      left: position.x + offset.x,
      top: position.y + offset.y,
      width: `${size.width + offset.width}px`,
      height: `${size.height + offset.height}px`
    };
  }, [position, size, offset]);

  const points = ["e", "w", "s", "n", "ne", "nw", "se", "sw"];

  const onResize = (e: MouseEvent) => {
    if (!dragging) return;
    const result = calcOffset(e, dragOrigin);
    switch (dragType) {
      case "move":
        offset.x = result.x;
        offset.y = result.y;
        break;

      case "e":
        offset.width = result.x;
        break;

      case "w":
        offset.width = -result.x;
        offset.x = result.x;
        break;

      case "s":
        offset.height = result.y;
        break;

      case "n":
        offset.height = -result.y;
        offset.y = result.y;
        break;

      case "ne":
        offset.y = result.y;
        offset.width = result.x;
        offset.height = -result.y;
        break;

      case "nw":
        offset.width = -result.x;
        offset.height = -result.y;
        offset.x = result.x;
        offset.y = result.y;
        break;

      case "se":
        offset.width = result.x;
        offset.height = result.y;
        break;

      case "sw":
        offset.x = result.x;
        offset.width = -result.x;
        offset.height = result.y;
        break;

      default:
        break;
    }

    // 拖拽超出页面边界处理
    if (dragType === "move") {
      if (position.x + offset.x <= 0) {
        offset.x = -position.x;
      } else if (position.x + offset.x + size.width >= document.body.clientWidth) {
        offset.x = document.body.clientWidth - position.x - size.width;
      }
      if (position.y + offset.y <= 0) {
        offset.y = -position.y;
      } else if (position.y + offset.y + size.height + 12 >= document.documentElement.scrollHeight) {
        // 12 为拖拽点的大小
        offset.y = document.documentElement.scrollHeight - position.y - size.height - 12;
      }
    } else {
      // 拉伸宽高小于10的情况
      if (size.width + offset.width < 10 || size.height + offset.height < 10) {
        return;
      }
    }

    setOffset({ ...offset });
  };

  const onResizeMouseup = () => {
    if (!dragging) return;
    setDragging(false);

    onDragStop({
      x: position.x + offset.x,
      y: position.y + offset.y,
      width: size.width + offset.width,
      height: size.height + offset.height
    });

    offset.x = 0;
    offset.y = 0;
    offset.width = 0;
    offset.height = 0;
    setOffset({ ...offset });
  };

  const onDragMouseDown = useCallback(
    (dir: PosMap, e: React.MouseEvent<HTMLElement>) => {
      setDragging(true);
      setDragOrigin({
        pageX: e.pageX,
        pageY: e.pageY
      });
      e.stopPropagation();
      setDragType(dir);
    },

    [dragging, offset]
  );

  useEffect(() => {
    container.current.addEventListener("mousemove", onResize);
    return () => {
      container.current?.removeEventListener("mousemove", onResize);
    };
  }, [dragging]);

  return (
    <div
      className="resizer"
      onMouseDown={(e) => onDragMouseDown("move", e)}
      onMouseUp={onResizeMouseup}
      style={{ ...style, ...resizeStyle }}>
      <When condition={size.width > 0 || size.height > 0}>
        <div className="capture-size" style={{ top: position.y + offset.y <= 40 ? "10px" : "-40px" }}>
          {size.width + offset.width}x{size.height + offset.height}
        </div>
        {points.map((item) => (
          <div
            className={`control-point resize-${item}`}
            key={item}
            onMouseDown={(e: React.MouseEvent<HTMLElement>) => onDragMouseDown(item as PosMap, e)}></div>
        ))}
      </When>

      {children({ offset: offset })}
    </div>
  );
}
