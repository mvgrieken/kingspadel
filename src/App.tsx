import { useState } from 'react';
import PadelCanvas3D from './components/PadelCanvas3D';
import './App.css';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="app">
      <h1 className="title">Kings Padel 3D</h1>
      <p className="subtitle">Isometric Professional Padel Simulator</p>

      {!isPlaying ? (
        <div className="start-screen">
          <div className="glass-card-3d">
            <h2>Welcome to Realistic 3D Padel!</h2>

            <div className="features-section">
              <h3>🎾 Official FIP Court & Rules</h3>
              <ul className="features-list">
                <li>Isometric 2.5D view with official 20m x 10m court</li>
                <li>Realistic physics: ball can bounce off walls AFTER ground hit</li>
                <li>Service system with ball toss and diagonal serving</li>
                <li>Glass walls (3-4m high) and mesh fence sections</li>
                <li>Tennis-style scoring with deuce and advantage</li>
              </ul>
            </div>

            <div className="rules-section">
              <h3>⚖️ Padel Rally Rules</h3>
              <ul className="rules-list">
                <li><strong>Ball can bounce ONCE on ground per side</strong></li>
                <li><strong>Ball CANNOT hit wall before ground (FAULT!)</strong></li>
                <li><strong>Ball CAN hit walls after bouncing on ground</strong></li>
                <li>Ball over 4m height = OUT</li>
                <li>Ball hitting net = Point to opponent</li>
              </ul>
            </div>

            <div className="controls-section">
              <h3>🎮 4-Player Controls</h3>
              <div className="player-controls-3d">
                <div className="team team-a">
                  <h4>Team A (Red) - Bottom Court</h4>
                  <div className="players">
                    <div className="player">
                      <strong>Player A1 (Left):</strong>
                      <p>Move: W/S | Hit: SPACE</p>
                    </div>
                    <div className="player">
                      <strong>Player A2 (Right):</strong>
                      <p>Move: Q/A | Hit: TAB</p>
                    </div>
                  </div>
                </div>

                <div className="team team-b">
                  <h4>Team B (Cyan) - Top Court</h4>
                  <div className="players">
                    <div className="player">
                      <strong>Player B1 (Left):</strong>
                      <p>Move: ↑/↓ | Hit: SHIFT</p>
                    </div>
                    <div className="player">
                      <strong>Player B2 (Right):</strong>
                      <p>Move: I/K | Hit: ENTER</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="game-controls">
                <h4>Game Controls</h4>
                <p><strong>SPACE:</strong> Toss ball & Serve</p>
                <p><strong>ESC:</strong> Pause/Resume</p>
                <p><strong>D:</strong> Debug mode (show physics)</p>
                <p><strong>R:</strong> Restart match</p>
              </div>
            </div>

            <div className="service-info">
              <h3>🏓 Service System</h3>
              <ul className="service-list">
                <li>Press SPACE to toss ball up</li>
                <li>Press SPACE again when ball is in air to serve</li>
                <li>Serve diagonally to opposite service box</li>
                <li>Ball must bounce in service box to be valid</li>
                <li>2 serves per point (fault = second serve)</li>
              </ul>
            </div>

            <button
              className="play-button-3d"
              onClick={() => setIsPlaying(true)}
            >
              🚀 Start 3D Padel Match
            </button>
          </div>
        </div>
      ) : (
        <>
          <PadelCanvas3D isPlaying={isPlaying} />
          <div className="game-info-3d">
            <p>🎮 Use WASD/Arrows to move • SPACE to serve • ESC to pause • D for debug</p>
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