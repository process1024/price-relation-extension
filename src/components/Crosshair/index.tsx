import "./index.less";

export default function Crosshair({ x, y }) {
  return (
    <>
      <div className="crosshair-vertical" style={{ top: y + "px" }}></div>
      <div className="crosshair-horizon" style={{ left: x + "px" }}></div>
    </>
  );
}
