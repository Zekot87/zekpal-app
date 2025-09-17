import { useEffect, useState } from "react";

export const deckStore = {};

export default function Deck({ id, cards = [], x = 100, y = 100, shuffleTrigger }) {
  const [pos, setPos] = useState({ x, y });
  const [deckCards, setDeckCards] = useState(cards);
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    if (deckCards.length > 0) {
      deckStore[id] = {
        id,
        type: "deck",
        x: pos.x,
        y: pos.y,
        width: 100,
        height: 140,
        get cards() {
          return deckCards;
        },
        setPos: (fn) => {
          const next = fn({ x: pos.x, y: pos.y });
          setPos(next);
          deckStore[id].x = next.x;
          deckStore[id].y = next.y;
        },
        setCards: (nextArr) => setDeckCards(nextArr),
        shuffle: () => {
          setIsShuffling(true);
          setTimeout(() => setIsShuffling(false), 600); // duración animación
        },
      };
      return () => {
        delete deckStore[id];
      };
    } else {
      delete deckStore[id];
    }
  }, [id, pos, deckCards]);

  if (deckCards.length === 0) return null;

  return (
    <>
      {/* contador debajo */}
      <div
        style={{
          position: "absolute",
          left: pos.x + 50 - 20,
          top: pos.y + 145,
          minWidth: 40,
          textAlign: "center",
          fontSize: 32,
          fontWeight: "bold",
          background: "#fff",
          borderRadius: 12,
          padding: "2px 6px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {deckCards.length}
      </div>

      {/* bloque del mazo */}
      <div
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: 100,
          height: 140,
          borderRadius: 8,
          background: "#111",
          border: "2px solid #333",
          boxShadow: "2px 2px 8px rgba(0,0,0,0.6)",
          userSelect: "none",
          pointerEvents: "none",
          transformOrigin: "center center",
          animation: isShuffling ? "shuffleAnim 0.6s ease-in-out" : "none",
        }}
      />
      {/* animación CSS */}
      <style>
        {`
          @keyframes shuffleAnim {
            0%   { transform: rotate(0deg); }
            20%  { transform: rotate(300deg); }
            40%  { transform: rotate(-300deg); }
            60%  { transform: rotate(6deg); }
            80%  { transform: rotate(-6deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
    </>
  );
}
