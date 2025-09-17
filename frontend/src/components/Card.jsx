import { useState, useEffect } from "react";

export const cardStore = {};

export default function Card({ id, x, y, img }) {
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    cardStore[id] = {
      id,
      img,
      x: pos.x,
      y: pos.y,
      width: 100,
      height: 140,
      setPos,
      type: "card",
    };
    return () => delete cardStore[id];
  }, [id, img, pos]);

  return (
    <img
      src={img}
      alt={id}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: 100,
        height: 140,
        borderRadius: 8,
        boxShadow: "2px 2px 6px rgba(0,0,0,0.5)",
        border: "1px solid rgba(0,0,0,0.2)",
        userSelect: "none",
        pointerEvents: "none" // GameBoard gestiona los clicks/arrastres
      }}
    />
  );
}
