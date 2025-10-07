import { useState } from 'react';
import SideViewCanvas from './components/SideViewCanvas';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="app">
      <h1 className="title">Kings Padel Side View</h1>
      <p className="subtitle">Classic Side-View Padel Experience</p>

      {!isPlaying ? (
        <div className="start-screen">
          <div className="glass-card-side">
            <h2>🎾 Welcome to Side-View Padel!</h2>

            <div className="features-section">
              <h3>🏟️ Classic Tennis-Style View</h3>
              <ul className="features-list">
                <li>Side-view perspective (like Tennis for Two classic)</li>
                <li>Clear visibility of all court elements and ball height</li>
                <li>Official 20m x 10m FIP court with glass walls</li>
                <li>Realistic 2D physics with proper gravity</li>
                <li>Visual ball trail and impact effects</li>
              </ul>
            </div>

            <div className="rules-section">
              <h3>⚖️ Official Padel Rules</h3>
              <ul className="rules-list">
                <li><strong>Ball bounces ONCE maximum per side</strong></li>
                <li><strong>Ball CANNOT hit wall before ground (FAULT!)</strong></li>
                <li><strong>Ball CAN hit walls AFTER ground bounce</strong></li>
                <li>Service must land in diagonal service box</li>
                <li>2 serves per point (fault = second serve)</li>
                <li>Tennis-style scoring: 0, 15, 30, 40, Game</li>
              </ul>
            </div>

            <div className="controls-section">
              <h3>🎮 Simple 4-Player Controls</h3>
              <div className="side-view-controls">
                <div className="team team-a">
                  <h4>Team A (Red) - Left Side</h4>
                  <div className="players">
                    <div className="player">
                      <strong>A1 (Front Player):</strong>
                      <p>Move: W/S | Hit: SPACE</p>
                    </div>
                    <div className="player">
                      <strong>A2 (Back Player):</strong>
                      <p>Move: A/D | Hit: Q</p>
                    </div>
                  </div>
                </div>

                <div className="team team-b">
                  <h4>Team B (Cyan) - Right Side</h4>
                  <div className="players">
                    <div className="player">
                      <strong>B1 (Front Player):</strong>
                      <p>Move: ↑/↓ | Hit: SHIFT</p>
                    </div>
                    <div className="player">
                      <strong>B2 (Back Player):</strong>
                      <p>Move: I/K | Hit: ENTER</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="game-controls">
                <h4>🕹️ Game Controls</h4>
                <div className="control-grid">
                  <p><strong>SPACE:</strong> Toss ball & Serve</p>
                  <p><strong>ESC:</strong> Pause/Resume</p>
                  <p><strong>D:</strong> Debug mode</p>
                  <p><strong>H:</strong> Auto-assist (easier gameplay)</p>
                  <p><strong>R:</strong> Restart match</p>
                </div>
              </div>
            </div>

            <div className="gameplay-info">
              <h3>🏓 How to Play</h3>
              <ul className="gameplay-list">
                <li><strong>Service:</strong> Press SPACE to toss, SPACE again to serve</li>
                <li><strong>Rally:</strong> Hit ball with your racket (timing matters!)</li>
                <li><strong>Strategy:</strong> Use walls after ground bounce for tactical shots</li>
                <li><strong>Teamwork:</strong> Coordinate with your teammate</li>
                <li><strong>Auto-assist:</strong> Enable with H key for easier ball tracking</li>
              </ul>
            </div>

            <div className="visual-features">
              <h3>✨ Visual Features</h3>
              <ul className="visual-list">
                <li>Ball shadows show height and distance from ground</li>
                <li>Speed lines indicate fast-moving ball</li>
                <li>Impact particles on hits and bounces</li>
                <li>Glass walls with realistic transparency</li>
                <li>Professional scoreboard with tennis scoring</li>
              </ul>
            </div>

            <button
              className="play-button-side"
              onClick={() => setIsPlaying(true)}
            >
              🚀 Start Side-View Match
            </button>
          </div>
        </div>
      ) : (
        <>
          <SideViewCanvas isPlaying={isPlaying} />
          <div className="game-info-side">
            <p>🎮 Move with WASD/Arrows • Hit with SPACE/SHIFT/Q/ENTER • SPACE to serve • ESC to pause</p>
            <p>💡 Press H for auto-assist • D for debug mode</p>
          </div>
          <button
            className="back-button"
            onClick={() => setIsPlaying(false)}
          >
            ← Back to Menu
          </button>
        </>
      )}
    </div>
  );
}

export default App;