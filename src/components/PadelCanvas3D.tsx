import React, { useRef, useEffect } from 'react';
import { PadelGame3D } from '../game/PadelGame3D';

interface PadelCanvas3DProps {
  isPlaying: boolean;
}

const PadelCanvas3D: React.FC<PadelCanvas3DProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<PadelGame3D | null>(null);

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new PadelGame3D(canvasRef.current);
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
    <div className="game-container-3d">
      <canvas
        ref={canvasRef}
        className="padel-canvas-3d"
        style={{
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '15px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          background: 'linear-gradient(135deg, #0D47A1, #1565C0, #1976D2)',
        }}
      />
    </div>
  );
};

export default PadelCanvas3D;