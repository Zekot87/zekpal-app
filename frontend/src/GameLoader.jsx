import { useEffect, useState } from "react";
import GameBoard from "./components/GameBoard";
import Deck from "./components/Deck";

export default function GameLoader() {
  const [mapImage, setMapImage] = useState(null);

  useEffect(() => {
    fetch("/data/maps/sunnydale.json")
      .then((r) => r.json())
      .then((data) => setMapImage(data.image));
  }, []);

  const deck1 = [
    "https://i.imgur.com/rn4liye.png",
    "https://i.imgur.com/casuWdw.png",
    "https://i.imgur.com/c45EYSf.png",
    "https://i.imgur.com/8xpD8S1.png",
    "https://i.imgur.com/rn4liye.png",
  ];

  const deck2 = [
    "https://i.imgur.com/casuWdw.png",
    "https://i.imgur.com/8xpD8S1.png",
    "https://i.imgur.com/c45EYSf.png",
    "https://i.imgur.com/rn4liye.png",
  ];

  return (
    <GameBoard image={mapImage}>
      <Deck id="deck-1" cards={deck1} x={3100} y={2700} />
      <Deck id="deck-2" cards={deck2} x={3300} y={2900} />
    </GameBoard>
  );
}
