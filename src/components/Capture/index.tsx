import React from 'react';

import './index.less';

// import { useDebounceEffect } from 'ahooks';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { When } from 'react-if';

import { copyImageFromBase64 } from '../../utils/image';
import Crosshair from '../Crosshair';
import { Resizer } from '../Resizer';
import { captureSelect } from '~services/capture';
import { useMouseDrag, useMouseMove } from '~hooks/hooks';
import { getMouseHoverElementPosition, TElementPosition } from '~utils/element';
// import { message } from 'antd';

interface IDrag {
  x: number;
  y: number;
  width: number;
  height: number;
}

const Btns = ({ pinBtnStyle, onCancel, onComplete }) => {
  return (
    <div className="capture-annotate" style={pinBtnStyle}>
      <button className="btn cancel" onClick={onCancel}>
        取消
      </button>
      <button className="btn primary" onClick={onComplete}>
        完成
      </button>
    </div>
  );
};

function ElementInspector({ sharp, onClick }: { sharp: TElementPosition; onClick: Function }) {
  if (sharp) {
    return (
      <div
        className="capture-element-inspector"
        onMouseUp={onClick}
        style={{
          width: sharp.right - sharp.left + 'px',
          height: sharp.bottom - sharp.top + 'px',
          left: sharp.left,
          top: sharp.top,
        }}></div>
    );
  }
}

const Capture = ({ onCancel, onComplete }: { onCancel: () => void, onComplete: (result: string) => void }) => {
  const maskRef = useRef<HTMLElement>();
  const parentRef = useRef<HTMLElement>();
  const [hidden, setHidden] = useState(false);
  // const board = useLastBoard();
  const [inspectorInfo, setInspectorInfo] = useState<TElementPosition>();

  const { axis, moving } = useMouseMove(maskRef);

  const { position, dragging, setPosition } = useMouseDrag(maskRef);

  const scrollHeight = document.documentElement.scrollHeight;

  // FIX: 拖拽框太小的情况下，强制10 X 10
  useEffect(() => {
    if (!dragging) {
      const { start, end } = position;
      if (start.x - end.x > 0 && start.x - end.x < 10) {
        position.end.x = start.x - 10;
      } else if (start.x - end.x < 0 && start.x - end.x > -10) {
        position.end.x = start.x + 10;
      }

      if (start.y - end.y > 0 && start.y - end.y < 10) {
        position.end.y = start.y + 10;
      } else if (start.y - end.y < 0 && start.y - end.y > -10) {
        position.end.y = start.y - 10;
      }
      setPosition({ ...position });
    }
  }, [dragging]);

  const resizeProps = useMemo(() => {
    const { start, end } = position;
    return {
      position: {
        x: start.x < end.x ? start.x : end.x,
        y: start.y < end.y ? start.y : end.y,
      },
      size: {
        width: Math.abs(start.x - end.x),
        height: Math.abs(start.y - end.y),
      },
    };
  }, [position]);

  const hasCapture = useMemo(() => {
    const { start, end } = position;
    return !!(Math.abs(start.x - end.x) > 0 || Math.abs(start.y - end.y) > 0);
  }, [resizeProps]);

  const onDragStop = (e: IDrag) => {
    setPosition({
      start: {
        x: e.x,
        y: e.y,
      },
      end: {
        x: e.x + e.width,
        y: e.y + e.height,
      },
    });
  };

  function resetPosition() {
    setPosition({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 0 },
    });
  }

  function inspectorClick() {
    const { left, top, right, bottom } = inspectorInfo;
    setPosition({
      start: {
        x: left,
        y: top,
      },
      end: {
        x: right,
        y: bottom,
      },
    });
    clearInspectorInfo();
  }

  function clearInspectorInfo() {
    setInspectorInfo(null);
  }

  function getHoverElement({ x, y }: typeof axis) {
    if (resizeProps.size.height) return;
    const eleInfo = getMouseHoverElementPosition({ x, y });
    if (eleInfo) {
      setInspectorInfo(eleInfo);
    }
  }

  const handleGetHoverElement = useCallback(() => {
    if (!dragging) {
      getHoverElement(axis);
    } else {
      clearInspectorInfo();
    }
  }, [axis, dragging, hasCapture]);

  useEffect(() => {
    handleGetHoverElement()
  }, [axis])

  useEffect(() => {
    resetPosition();
  }, []);

  const btnSize = {
    width: 135,
    height: 40,
  };

  function renderBtn(props) {
    const { offset } = props;
    const { start, end } = position;
    const { scrollHeight, scrollTop, clientHeight } = document.documentElement;

    let pinBtnStyle = {};
    // 选择区域到页面底部 和 选择区域底部不在当前可视区域时
    // 12为间距大小
    if (
      start.y + offset.y + resizeProps.size.height + btnSize.height + 12 >= scrollHeight ||
      end.y + offset.y + btnSize.height + 12 > scrollTop + clientHeight
    ) {
      pinBtnStyle = {
        position: 'fixed',
        bottom: '8px',
        left: end.x + offset.x - btnSize.width - 8 + 'px',
      };
    } else {
      pinBtnStyle = {
        position: 'absolute',
        bottom: '-52px',
        right: 0,
      };
    }

    async function complete() {
      setHidden(true);
      const result = await captureSelect(position);
      // copyImageFromBase64(result);
      // message.success('复制成功');
      console.log('complete', result);
      onComplete(result);
    }

    return (
      <When condition={!dragging && hasCapture}>
        <Btns
          pinBtnStyle={pinBtnStyle}
          onComplete={complete}
          onCancel={onCancel}
        />
      </When>
    );
  }

  return (
    <When condition={!hidden}>
      <div ref={parentRef} onClick={(e) => e.preventDefault()}>
        <div
          id="mask"
          className="capture-mask"
          style={{
            height: scrollHeight + 'px',
          }}
          onClick={(e) => e.preventDefault()}
          ref={maskRef}>
          <When condition={moving}>
            <Crosshair x={axis.x} y={axis.y} />
          </When>
          <ElementInspector sharp={inspectorInfo} onClick={inspectorClick} />
        </div>
        <Resizer
          position={resizeProps.position}
          size={resizeProps.size}
          onDragStop={onDragStop}
          container={parentRef}
          style={{
            pointerEvents: dragging ? 'none' : 'auto',
          }}>
          {renderBtn}
        </Resizer>
      </div>
    </When>
  );
};

export default Capture;
