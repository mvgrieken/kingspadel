import React, { useRef, useEffect } from 'react';
import { SideViewPadelGame } from '../game/SideViewPadelGame';

interface SideViewCanvasProps {
  isPlaying: boolean;
}

const SideViewCanvas: React.FC<SideViewCanvasProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<SideViewPadelGame | null>(null);

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new SideViewPadelGame(canvasRef.current);
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
    <div className="side-view-container">
      <canvas
        ref={canvasRef}
        className="side-view-canvas"
        style={{
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '15px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 70%, #2d8659 100%)',
        }}
      />
    </div>
  );
};

export default SideViewCanvas;