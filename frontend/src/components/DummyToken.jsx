import { useState, useEffect } from "react";

export const tokenStore = {};

export default function DummyToken({ id, x, y }) {
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    tokenStore[id] = {
      id,
      x: pos.x,
      y: pos.y,
      width: 80,
      height: 80,
      setPos,
      type: "token",
    };
    return () => delete tokenStore[id];
  }, [id, pos]);

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: "#2196f3",
        border: "1px solid rgba(0,0,0,0.2)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
        userSelect: "none",
        pointerEvents: "none" // GameBoard gestiona los clicks
      }}
    />
  );
}
