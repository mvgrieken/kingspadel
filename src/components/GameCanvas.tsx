import React, { useRef, useEffect } from 'react';
import { Game } from '../game/Game';

interface GameCanvasProps {
  isPlaying: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new Game(canvasRef.current);
    }
  }, []);

  useEffect(() => {
    if (gameRef.current) {
      if (isPlaying) {
        gameRef.current.start();
      } else {
        gameRef.current.stop();
      }
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.stop();
      }
    };
  }, [isPlaying]);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          border: '2px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  );
};

export default GameCanvas;