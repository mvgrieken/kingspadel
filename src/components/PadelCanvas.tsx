import React, { useRef, useEffect } from 'react';
import { PadelGame } from '../game/PadelGame';

interface PadelCanvasProps {
  isPlaying: boolean;
}

const PadelCanvas: React.FC<PadelCanvasProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<PadelGame | null>(null);

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new PadelGame(canvasRef.current);
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
        className="padel-canvas"
        style={{
          border: '3px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '15px',
          boxShadow: '0 15px 50px rgba(0, 0, 0, 0.4)',
          background: 'linear-gradient(45deg, #1a1a2e, #16213e)',
        }}
      />
    </div>
  );
};

export default PadelCanvas;