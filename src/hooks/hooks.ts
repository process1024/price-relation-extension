import type { MutableRefObject } from "react";
import { useEffect, useState } from "react";

const initialPosition = {
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 }
};

export function useMouseMove(target: Element | MutableRefObject<Element>) {
  const [axis, setAxis] = useState({ x: 0, y: 0 });
  const [moving, setMoving] = useState(true);
  const handleMouse = (e: MouseEvent) => {
    setAxis({
      x: e.clientX,
      y: e.clientY
    });
  };

  function handleEnter() {
    setMoving(true);
  }
  function handleOut() {
    setMoving(false);
  }

  useEffect(() => {
    const el = "current" in target ? target.current : target;

    el.addEventListener("mousemove", handleMouse);
    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseout", handleOut);

    return () => {
      el.removeEventListener("mousemove", handleMouse);
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseout", handleOut);
    };
  }, []);

  return {
    axis,
    moving
  };
}

export function useMouseDrag(target: Element | MutableRefObject<Element>) {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    function mouseMoveEv(e) {
      setDragging(true);
      const { pageX, pageY } = e;
      position.end.x = pageX;
      position.end.y = pageY;
      setPosition({ ...position });
    }

    const onMouseDown = (e: MouseEvent) => {
      // console.log(e, "useMouseDrag mouse down");
      const { pageX, pageY } = e;
      position.start.x = pageX;
      position.start.y = pageY;
      position.end.x = pageX;
      position.end.y = pageY;
      // setPosition({ ...position });
      el.addEventListener("mousemove", mouseMoveEv);
    };

    const onMouseUp = () => {
      setDragging(false);
      el.removeEventListener("mousemove", mouseMoveEv);
    };

    const el = "current" in target ? target.current : target;
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseup", onMouseUp);
      setPosition(initialPosition);
    };
  }, []);

  return { position, dragging, setPosition };
}

export function useDelayState(initial: any) {
  const [state, setState] = useState(initial);
  const [timerQueue, setTimerQueue] = useState([]);

  function setStateDelay(value: any, time: number = 300) {
    const timer = setTimeout(() => {
      setState(value);
      let timers = timerQueue.filter((t) => t !== timer);
      setTimerQueue(timers);
    }, time);
    timerQueue.push(timer);
    setTimerQueue(timerQueue);
  }

  function setStateImmediately(value: any) {
    timerQueue.forEach((timer) => {
      clearTimeout(timer);
    });
    timerQueue.length = 0;
    setTimerQueue(timerQueue);
    setState(value);
  }

  return [state, setStateImmediately, setStateDelay];
}

/**
 * 监听按键是否正按着
 */
export function useKeyPressing(key: string, target: Element | MutableRefObject<Element> = document.body) {
  const [pressing, setPressing] = useState(false);

  function onKeydown(e) {
    if (e.key === key) {
      setPressing(true);
    }
  }

  function onKeyup(e) {
    if (e.key === key) {
      setPressing(false);
    }
  }

  useEffect(() => {
    const el = "current" in target ? target.current : target;
    el.addEventListener("keydown", onKeydown);
    el.addEventListener("keyup", onKeyup);

    return () => {
      el.removeEventListener("keydown", onKeydown);
      el.removeEventListener("keyup", onKeyup);
    };
  }, []);

  return [pressing];
}
