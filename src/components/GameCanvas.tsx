import React, { useRef, useEffect } from 'react'
import { Game } from '../game/Game'

interface GameCanvasProps {
  isPlaying: boolean
}

const GameCanvas: React.FC<GameCanvasProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      gameRef.current = new Game(canvasRef.current)
    }
  }, [])

  useEffect(() => {
    if (gameRef.current) {
      if (isPlaying) {
        gameRef.current.start()
      } else {
        gameRef.current.stop()
      }
    }

    return () => {
      if (gameRef.current && isPlaying) {
        gameRef.current.stop()
      }
    }
  }, [isPlaying])

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '15px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 70%, #2d8659 100%)',
          display: 'block',
          margin: '0 auto'
        }}
      />
    </div>
  )
}

export default GameCanvas