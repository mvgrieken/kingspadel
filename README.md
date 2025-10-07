# Kings Padel - Pong Game

Een moderne implementatie van het klassieke Pong spel met glazen wanden en glasmorfisme effecten.

## Features

- 2-speler gameplay
- Glazen wanden aan beide zijkanten waar de bal vanaf kaatst
- Smooth 60fps gameloop
- Moderne UI met glasmorfisme effecten
- Score tracking
- Responsive controls

## Installatie

```bash
# Installeer dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in je browser om het spel te spelen.

## Controls

### Speler 1 (Links)
- **W** - Omhoog
- **S** - Omlaag

### Speler 2 (Rechts)
- **↑** - Omhoog
- **↓** - Omlaag

## Gameplay

- De bal start vanuit het midden met een willekeurige richting
- Scoor punten door de bal voorbij de tegenstander te krijgen
- De bal kaatst van de glazen wanden aan de zijkanten
- De bal wordt geleidelijk sneller tijdens het spelen
- De hoek van de bal verandert afhankelijk van waar deze de paddle raakt

## Tech Stack

- React 18
- TypeScript
- Vite
- HTML5 Canvas

## Build

```bash
# Build voor productie
npm run build

# Preview productie build
npm run preview
```

## Project Structuur

```
src/
├── game/
│   ├── entities/
│   │   ├── Ball.ts      # Bal physics en rendering
│   │   ├── Paddle.ts    # Paddle controls en collision
│   │   └── Wall.ts      # Glazen wanden met transparant effect
│   └── Game.ts          # Hoofdgame class met gameloop
├── components/
│   └── GameCanvas.tsx   # React wrapper voor canvas
├── App.tsx              # Hoofdapplicatie met start scherm
└── main.tsx             # React entry point
```