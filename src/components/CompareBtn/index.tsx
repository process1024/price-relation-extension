import { useEffect, useMemo, useRef, useState } from "react";
import PinBtn from "./PinBtn";
import {
  getShowImgElement,
} from "~utils/imageDetect";
import { getElPosition } from "~utils/element";
import { getImageOriginUrl } from "~utils/image";
import { DOMAIN } from "~constant/domain";

const btnPositionOffset = {
  x: 0,
  y: 0
}

const PinWrap = ({ type, position: buttonPosition, mode }) => {
  const buttonPositionRef = useRef(buttonPosition);
  const [position, setPosition] = useState({
    x: 0,
    y: 0
  });

  const plasmoCsui = document.querySelector("#price-compare-shadow");
  // 按住 alt 键
  const altKeyPressing = useRef(false);
  const eventRef = useRef(null);

  const loading = useRef(false);

  const pinRef = useRef(null);

  const [visible, setVisible, ] = useState(false);

  const [imgEle, setImgEle] = useState(null as unknown as HTMLImageElement);

  function getButtonPosition(el, positionType, offset) {
    const { left, right, top } = getElPosition(el);
    if (positionType === "leftTop") {
      return {
        x: left + offset.x,
        y: top + offset.y
      };
    }
    if (positionType === "rightTop") {
      return {
        // 71 为按钮宽度
        x: right - offset.x - 71,
        y: top + offset.y
      };
    }
  }

  useEffect(() => {
    buttonPositionRef.current = buttonPosition;
  }, [buttonPosition]);

  const handleHoverImg = (e) => {
    if (loading.current) return;
    // 在重复采集确认框下
    if (pinRef.current && pinRef.current.confirmVisible) return;

    const el = e.target as HTMLElement;

    const imgElement = getShowImgElement(el);

    if (imgElement) {
      if (!visible) {
        setVisible(true);
      }
      // huaban-custom-img 属性存在则为js创建的img元素（背景图），页面上并不存在
      const targetElement = imgElement.getAttribute("huaban-custom-img") ? el : imgElement;
      const positionResult = getButtonPosition(targetElement, buttonPositionRef.current, btnPositionOffset);
      setPosition(positionResult);
      setImgEle(imgElement);
    } else {
      // setVisible(false);
    }
  };

  function onMouseOver(e) {
    eventRef.current = e;
    // 当鼠标在按钮容器或其子元素上时，不触发隐藏逻辑
    if (
      plasmoCsui &&
      (e.target === plasmoCsui || (plasmoCsui as any).contains?.(e.target))
    ) {
      if (!visible) setVisible(true);
      return;
    }
    handleHoverImg(e);
  }

  function onKeydown(e) {
    if (e.key === "Alt") {
      eventRef.current && handleHoverImg(eventRef.current);
      altKeyPressing.current = true;
    }
  }

  useEffect(() => {
    document.addEventListener("mouseover", onMouseOver);
    document.body.addEventListener("keydown", onKeydown);

    return () => {
      document.removeEventListener("mouseover", onMouseOver);
      document.body.removeEventListener("keydown", onKeydown);
    };
  }, []);

  // 唤起采集弹窗
  async function onPin() {

    const pinData = {
      img_url: await getImageOriginUrl(imgEle, { isAsync: true }),
      link: window.location.href,
    };

    const searchUrl = `${DOMAIN}?image_url=${encodeURIComponent(pinData.img_url)}`
    window.open(searchUrl, "_blank", "noopener,noreferrer")
  }

  const style = useMemo(() => {
    return {
      position: "absolute",
      top: position.y,
      left: position.x
    };
  }, [position]);

  function onMouseEnter() {
    setVisible(true);
  }

  return (
    <>
      {visible && (
        <PinBtn
          type={type}
          style={style}
          size={loading.current ? "default" : "small"}
          loading={loading}
          onPin={onPin}
          onMouseEnter={onMouseEnter}
        />
      )}
    </>
  );
};

export default () => {


  return (
    <PinWrap
      type={'primary'}
      position={'leftTop'}
      mode={'hover'}
    />
  );
};
