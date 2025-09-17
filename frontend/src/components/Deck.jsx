import { useEffect, useState } from "react";

export const deckStore = {};

export default function Deck({ id, cards = [], x = 100, y = 100 }) {
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
          setTimeout(() => setIsShuffling(false), 800); // duración animación
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

  // Generamos 5 cartas fantasma que se moverán en abanico
  const ghostCards = Array.from({ length: 5 }, (_, i) => i);

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

      {/* bloque principal del mazo */}
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
          zIndex: 1,
        }}
      />

      {/* cartas fantasma para la animación de abanico */}
      {isShuffling &&
        ghostCards.map((g, i) => (
          <div
            key={`ghost-${id}-${i}`}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: 100,
              height: 140,
              borderRadius: 8,
              background: "#222",
              border: "1px solid #555",
              boxShadow: "2px 2px 6px rgba(0,0,0,0.4)",
              transformOrigin: "bottom center",
              animation: `fanOut 0.8s ease-in-out forwards`,
              animationDelay: `${i * 0.05}s`,
              zIndex: 0,
              opacity: 0.7,
            }}
          />
        ))}

      {/* animaciones CSS */}
      <style>
        {`
          @keyframes fanOut {
            0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
            20%  { transform: translateY(-20px) rotate(-15deg); opacity: 0.9; }
            40%  { transform: translateY(-40px) rotate(15deg); opacity: 0.9; }
            60%  { transform: translateY(-20px) rotate(-10deg); opacity: 0.9; }
            80%  { transform: translateY(-10px) rotate(10deg); opacity: 0.8; }
            100% { transform: translateY(0) rotate(0deg); opacity: 0; }
          }
        `}
      </style>
    </>
  );
}
