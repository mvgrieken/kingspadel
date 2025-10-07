import { useState } from 'react';
import PadelCanvas from './components/PadelCanvas';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="app">
      <h1 className="title">Kings Padel</h1>
      <p className="subtitle">Professional Padel Experience</p>

      {!isPlaying ? (
        <div className="start-screen">
          <div className="glass-card">
            <h2>Welcome to Professional Padel!</h2>
            <div className="rules-section">
              <h3>Game Rules</h3>
              <ul className="rules-list">
                <li>4 players in 2 teams (2 vs 2)</li>
                <li>Tennis-style scoring (0, 15, 30, 40, Game)</li>
                <li>Service system with first and second serves</li>
                <li>Ball can bounce off walls after hitting ground</li>
                <li>First to 6 games wins a set (best of 3 sets)</li>
              </ul>
            </div>

            <div className="controls-section">
              <h3>Controls</h3>
              <div className="player-controls">
                <div className="team">
                  <h4>Team A (Red)</h4>
                  <div className="player">
                    <p><strong>Player 1:</strong> W/S</p>
                    <p><strong>Player 2:</strong> Q/A</p>
                  </div>
                </div>
                <div className="team">
                  <h4>Team B (Cyan)</h4>
                  <div className="player">
                    <p><strong>Player 1:</strong> ↑/↓</p>
                    <p><strong>Player 2:</strong> I/K</p>
                  </div>
                </div>
              </div>
              <div className="game-controls">
                <p><strong>SPACE:</strong> Serve the ball</p>
                <p><strong>ESC:</strong> Pause/Resume game</p>
                <p><strong>R:</strong> Restart match (when finished)</p>
              </div>
            </div>

            <button
              className="play-button"
              onClick={() => setIsPlaying(true)}
            >
              Start Padel Match
            </button>
          </div>
        </div>
      ) : (
        <>
          <PadelCanvas isPlaying={isPlaying} />
          <div className="game-info">
            <p>Press ESC to pause • SPACE to serve</p>
          </div>
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