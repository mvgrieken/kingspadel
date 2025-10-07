import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="app">
      <h1 className="title">Kings Padel</h1>

      {!isPlaying ? (
        <div className="start-screen">
          <div className="glass-card">
            <h2>Welcome to Padel Pong!</h2>
            <div className="instructions">
              <div className="player-controls">
                <div className="player">
                  <h3>Player 1</h3>
                  <p>W - Move Up</p>
                  <p>S - Move Down</p>
                </div>
                <div className="player">
                  <h3>Player 2</h3>
                  <p>↑ - Move Up</p>
                  <p>↓ - Move Down</p>
                </div>
              </div>
              <p className="info">First to score wins the round!</p>
              <p className="info">Ball bounces off glass walls on the sides</p>
            </div>
            <button
              className="play-button"
              onClick={() => setIsPlaying(true)}
            >
              Start Game
            </button>
          </div>
        </div>
      ) : (
        <>
          <GameCanvas isPlaying={isPlaying} />
          <button
            className="back-button"
            onClick={() => setIsPlaying(false)}
          >
            Back to Menu
          </button>
        </>
      )}
    </div>
  );
}

export default App;