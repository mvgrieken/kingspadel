import { useState } from 'react'
import GameCanvas from './components/GameCanvas'
import './App.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="app">
      <h1 className="title">👑 Kings Padel</h1>
      <p className="subtitle">Official FIP Rules • 4 Players • Side-View Action</p>

      {!isPlaying ? (
        <div className="start-screen">
          <div className="glass-card">
            <h2>🎾 Welcome to Kings Padel!</h2>

            <div className="info-section">
              <h3>📋 Game Rules</h3>
              <ul className="rules-list">
                <li>🔴 <strong>Ball bounces ONCE maximum per side</strong></li>
                <li>❌ <strong>Ball CANNOT hit wall before ground (FAULT!)</strong></li>
                <li>✅ <strong>Ball CAN hit walls AFTER ground bounce</strong></li>
                <li>🎯 Service must land in diagonal service box</li>
                <li>✌️ 2 serves per point (fault = second serve)</li>
                <li>🎪 Tennis scoring: 0, 15, 30, 40, Game</li>
                <li>🏆 Best of 3 sets to win match</li>
              </ul>
            </div>

            <div className="controls-section">
              <h3>🎮 4-Player Controls</h3>
              <div className="teams-grid">
                <div className="team team-a">
                  <h4>Team A (Red) - Left Side</h4>
                  <div className="player-controls">
                    <div className="player-card">
                      <strong>A1 (Front)</strong>
                      <p>Move: W/S</p>
                      <p>Hit: SPACE</p>
                    </div>
                    <div className="player-card">
                      <strong>A2 (Back)</strong>
                      <p>Move: Q/A</p>
                      <p>Hit: TAB</p>
                    </div>
                  </div>
                </div>

                <div className="team team-b">
                  <h4>Team B (Cyan) - Right Side</h4>
                  <div className="player-controls">
                    <div className="player-card">
                      <strong>B1 (Front)</strong>
                      <p>Move: ↑/↓</p>
                      <p>Hit: SHIFT</p>
                    </div>
                    <div className="player-card">
                      <strong>B2 (Back)</strong>
                      <p>Move: I/K</p>
                      <p>Hit: ENTER</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="game-controls">
                <h4>Game Controls</h4>
                <div className="control-list">
                  <span>ESC: Pause</span>
                  <span>R: Reset</span>
                  <span>D: Debug</span>
                  <span>C: Controls</span>
                  <span>H: Auto-serve</span>
                </div>
              </div>
            </div>

            <div className="features-section">
              <h3>✨ Features</h3>
              <ul className="features-list">
                <li>🏟️ Official 20m x 10m FIP court with glass walls</li>
                <li>👀 Clear side-view perspective for perfect visibility</li>
                <li>⚡ Realistic 2D physics with proper gravity</li>
                <li>🎯 Service system with toss and target boxes</li>
                <li>💥 Visual effects: shadows, trails, particles</li>
                <li>📊 Professional tennis scoring system</li>
                <li>🎮 Responsive controls for 4 simultaneous players</li>
              </ul>
            </div>

            <button
              className="play-button"
              onClick={() => setIsPlaying(true)}
            >
              🚀 Start Match
            </button>
          </div>
        </div>
      ) : (
        <>
          <GameCanvas isPlaying={isPlaying} />
          <div className="game-info">
            <p>Press <strong>C</strong> for controls • <strong>ESC</strong> to pause • <strong>H</strong> for auto-serve</p>
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
  )
}

export default App