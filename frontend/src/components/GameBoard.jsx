import { useState, useRef, useEffect } from "react";
import DummyToken, { tokenStore } from "./DummyToken";
import Card, { cardStore } from "./Card";
import Deck, { deckStore } from "./Deck";

export default function GameBoard({ image, children }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [draggingSelection, setDraggingSelection] = useState(false);

  const [dynamicDecks, setDynamicDecks] = useState([]);
  const [spawnedCards, setSpawnedCards] = useState([]);

  const [textures, setTextures] = useState({});
  const [texture, setTexture] = useState(
    localStorage.getItem("tableTexture") || "wood-light"
  );

  const lastPos = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const pressOnDeck = useRef(null);
  const movingWholeDeckId = useRef(null);
  const timerRef = useRef(null);
  const tableSize = 6000;

  useEffect(() => {
    fetch("/data/textures.json").then((r) => r.json()).then(setTextures);
  }, []);

  useEffect(() => {
    localStorage.setItem("tableTexture", texture);
  }, [texture]);

  const currentTex = textures[texture] || { css: "none", color: "#f8f8f5" };

  const worldToScreen = (x, y) => ({
    x: offset.x + x * scale,
    y: offset.y + y * scale,
  });

  const getAllObjects = () => [
    ...Object.values(tokenStore),
    ...Object.values(cardStore),
    ...Object.values(deckStore),
  ];

  // ---------- Cámara ----------
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.0015;
    let newScale = scale - e.deltaY * zoomSpeed;
    newScale = Math.min(Math.max(newScale, 0.2), 3);

    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const worldX = (mouseX - offset.x) / scale;
    const worldY = (mouseY - offset.y) / scale;

    setOffset({
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale,
    });
    setScale(newScale);
  };

  // ---------- Mouse Down ----------
  const handleMouseDown = (e) => {
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const objs = getAllObjects();
    const clicked = objs.find((o) => {
      const s = worldToScreen(o.x, o.y);
      return (
        e.clientX >= s.x &&
        e.clientX <= s.x + o.width * scale &&
        e.clientY >= s.y &&
        e.clientY <= s.y + o.height * scale
      );
    });

    if (clicked) {
      if (!selectedIds.includes(clicked.id)) {
        setSelectedIds([clicked.id]);
      }

      if (clicked.type === "deck") {
        pressOnDeck.current = {
          id: clicked.id,
          startX: e.clientX,
          startY: e.clientY,
          t0: performance.now(),
          spawnedCardId: null,
        };

        // arrancar un timer que a los 800ms marque el mazo como "verde"
        timerRef.current = setTimeout(() => {
          movingWholeDeckId.current = clicked.id;
          setSelectedIds((prev) => [...prev]); // forzar re-render
        }, 800);
      } else {
        setDraggingSelection(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
      }
    } else {
      setSelectedIds([]);
      setIsSelecting(true);
      setSelectionBox({
        startX: e.clientX,
        startY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        w: 0,
        h: 0,
      });
    }
  };

  // ---------- Mouse Move ----------
  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setOffset((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    }

    if (isSelecting && selectionBox) {
      const x = Math.min(e.clientX, selectionBox.startX);
      const y = Math.min(e.clientY, selectionBox.startY);
      const w = Math.abs(e.clientX - selectionBox.startX);
      const h = Math.abs(e.clientY - selectionBox.startY);
      setSelectionBox({ ...selectionBox, x, y, w, h });
    }

    if (pressOnDeck.current) {
      const { id, startX, startY, spawnedCardId } = pressOnDeck.current;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      const deck = deckStore[id];
      if (!deck) return;

      if (!spawnedCardId && dist > 6 && !movingWholeDeckId.current) {
        // robar carta si te mueves antes del verde
        const current = deck.cards;
        if (current && current.length > 0) {
          const top = current[current.length - 1];
          deck.setCards(current.slice(0, -1));
          const newId = `${id}-card-${Date.now()}`;
          const newCard = { id: newId, img: top, x: deck.x + 120, y: deck.y };
          setSpawnedCards((prev) => [...prev, newCard]);
          setSelectedIds([newId]);
          setDraggingSelection(true);
          dragStart.current = { x: e.clientX, y: e.clientY };
          pressOnDeck.current.spawnedCardId = newId;
          clearTimeout(timerRef.current);
        }
      }

      if (movingWholeDeckId.current && !draggingSelection) {
        setDraggingSelection(true);
        dragStart.current = { x: e.clientX, y: e.clientY };
        pressOnDeck.current = null;
      }
    }

    if (draggingSelection) {
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;

      selectedIds.forEach((id) => {
        if (tokenStore[id]) tokenStore[id].setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
        if (cardStore[id])  cardStore[id].setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
        if (deckStore[id])  deckStore[id].setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
      });

      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  // ---------- Mouse Up ----------
  const handleMouseUp = (e) => {
    if (e.button === 2) {
      setIsPanning(false);
      return;
    }

    clearTimeout(timerRef.current);

    if (isSelecting && selectionBox) {
      const objs = getAllObjects();
      const selected = objs.filter((o) => {
        const s = worldToScreen(o.x, o.y);
        return (
          s.x >= selectionBox.x &&
          s.x <= selectionBox.x + selectionBox.w &&
          s.y >= selectionBox.y &&
          s.y <= selectionBox.y + selectionBox.h
        );
      });
      setSelectedIds(selected.map((s) => s.id));
    }

    setIsSelecting(false);
    setSelectionBox(null);
    setDraggingSelection(false);
    pressOnDeck.current = null;
    movingWholeDeckId.current = null;
  };

  // ---------- Tecla G ----------
  const handleKeyDown = (e) => {

    // tecla T → barajar mazo seleccionado
    if (e.key.toLowerCase() === "t") {
      const selectedDecks = selectedIds.map((id) => deckStore[id]).filter(Boolean);
      selectedDecks.forEach((d) => {
        if (d.shuffle) d.shuffle();
      });
      return;
    }

    if (e.key.toLowerCase() !== "g") return;

    const selectedCards = selectedIds.map((id) => cardStore[id]).filter(Boolean);
    const selectedDecks = selectedIds.map((id) => deckStore[id]).filter(Boolean);

    if (selectedDecks.length >= 1) {
      const deckIdsInOrder = selectedIds.filter((id) => deckStore[id]);
      const targetId = deckIdsInOrder[0];
      const target = deckStore[targetId];
      if (!target) return;

      const cardsFromCards = selectedCards.map((c) => c.img);
      const otherDecks = selectedDecks.filter((d) => d.id !== targetId);
      const cardsFromDecks = otherDecks.flatMap((d) => d.cards);
      const allToAdd = [...cardsFromCards, ...cardsFromDecks];

      target.setCards([...(target.cards || []), ...allToAdd]);

      const dynamicIds = new Set(dynamicDecks.map((d) => d.id));
      otherDecks.forEach((d) => {
        if (dynamicIds.has(d.id)) {
          setDynamicDecks((prev) => prev.filter((x) => x.id !== d.id));
          delete deckStore[d.id];
        } else {
          const ds = deckStore[d.id];
          if (ds && ds.setCards) ds.setCards([]);
          delete deckStore[d.id];
        }
      });

      setSpawnedCards((prev) => prev.filter((c) => !selectedCards.find((sc) => sc.id === c.id)));
      selectedCards.forEach((c) => delete cardStore[c.id]);

      setSelectedIds([targetId]);
      return;
    }

    if (selectedCards.length > 1) {
      const cx = selectedCards.reduce((s, c) => s + c.x, 0) / selectedCards.length;
      const cy = selectedCards.reduce((s, c) => s + c.y, 0) / selectedCards.length;
      const imgs = selectedCards.map((c) => c.img);

      setSpawnedCards((prev) => prev.filter((c) => !selectedCards.find((sc) => sc.id === c.id)));
      selectedCards.forEach((c) => delete cardStore[c.id]);

      const newId = `deck-${Date.now()}`;
      setDynamicDecks((prev) => [...prev, { id: newId, x: cx, y: cy, cards: imgs }]);
      setSelectedIds([newId]);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIds, dynamicDecks]);

  const renderDynamicDecks = dynamicDecks.map((d) => (
    <Deck key={d.id} id={d.id} x={d.x} y={d.y} cards={d.cards} />
  ));

  const renderSpawnedCards = spawnedCards.map((c) => (
    <Card key={c.id} id={c.id} x={c.x} y={c.y} img={c.img} />
  ));

  // ---------- Overlays de selección ----------
  const selectionOverlays = selectedIds
    .map((id) => {
      const o = tokenStore[id] || cardStore[id] || deckStore[id];
      if (!o) return null;
      const s = worldToScreen(o.x, o.y);
      const isWholeDeck = movingWholeDeckId.current && id === movingWholeDeckId.current;
      return (
        <div
          key={`ov-${id}`}
          style={{
            position: "absolute",
            left: s.x - (isWholeDeck ? 6 : 2),
            top: s.y - (isWholeDeck ? 6 : 2),
            width: o.width * scale + (isWholeDeck ? 12 : 4),
            height: o.height * scale + (isWholeDeck ? 12 : 4),
            border: `${isWholeDeck ? 6 : 2}px solid ${isWholeDeck ? "#28a745" : "#ff3b30"}`,
            boxShadow: isWholeDeck ? "0 0 20px rgba(40,167,69,0.9)" : "none",
            pointerEvents: "none",
            boxSizing: "border-box",
          }}
        />
      );
    })
    .filter(Boolean);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: currentTex.css,
        backgroundColor: currentTex.color,
        overflow: "hidden",
        cursor: isPanning || draggingSelection ? "grabbing" : "default",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Menú texturas */}
      {Object.keys(textures).length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            background: "rgba(255,255,255,0.95)",
            padding: "10px 14px",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            fontSize: 14,
            fontWeight: "bold",
          }}
        >
          <label style={{ marginRight: 8 }}>Fondo:</label>
          <select
            value={texture}
            onChange={(e) => setTexture(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 14 }}
          >
            {Object.entries(textures).map(([key, tex]) => (
              <option key={key} value={key}>
                {tex.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div
        style={{
          width: tableSize,
          height: tableSize,
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
        }}
      >
        {image && (
          <img
            src={image}
            alt="map"
            style={{
              position: "absolute",
              top: tableSize / 2 - 800,
              left: tableSize / 2 - 800,
              width: 1600,
              height: "auto",
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              borderRadius: 12,
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        )}

        <DummyToken id="t1" x={2900} y={2800} />
        <DummyToken id="t2" x={3100} y={2800} />
        <DummyToken id="t3" x={3000} y={3000} />

        {children}
        {renderDynamicDecks}
        {renderSpawnedCards}
      </div>

      {isSelecting && selectionBox && (
        <div
          style={{
            position: "absolute",
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.w,
            height: selectionBox.h,
            border: "2px dashed #4dd0e1",
            background: "rgba(77, 208, 225, 0.2)",
            pointerEvents: "none",
          }}
        />
      )}

      {selectionOverlays}
    </div>
  );
}
