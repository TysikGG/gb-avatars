import React, { useState, useRef } from 'react';
import { Avatar } from './react/Avatar';
import { AvatarPicker } from './demo/AvatarPicker';
import { useAvatarGaze } from './react/useAvatarGaze';
import { EXPRESSIONS } from './core/expressions';
import { TelemetryHUD } from './demo/TelemetryHUD';
import { CustomShapeStudio } from './demo/CustomShapeStudio';
import { ConfigStudio } from './demo/ConfigStudio';
import { CodeSnippet } from './demo/CodeSnippet';
import { AvatarHandle, PokeType, Expression, AgentState } from './core/types';
import { LIFECYCLE_GROUPS } from './core/index';

export function App() {
  const [shape, setShape] = useState<string>('sparkle');
  const [color, setColor] = useState<string>('#00C972');
  const [eyeColor, setEyeColor] = useState<string>('#000000');
  const [expression, setExpression] = useState<Expression>('neutral');
  const [agentState, setAgentState] = useState<AgentState>('idle');
  const [activeGroupIndex, setActiveGroupIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'picker' | 'studio' | 'config'>(() =>
    typeof window !== 'undefined' &&
    (window.location.hash === '#studio' || window.location.search.includes('studio'))
      ? 'studio'
      : typeof window !== 'undefined' &&
        (window.location.hash === '#config' || window.location.search.includes('config'))
        ? 'config'
        : 'picker'
  );

  const heroRef = useRef<AvatarHandle>(null);
  const heroHostRef = useRef<HTMLDivElement>(null);

  // Track pointer gaze for telemetry
  const liveGaze = useAvatarGaze(heroHostRef, {
    enabled: true,
    global: true,
    gazeScale: 0.5
  });

  const handlePoke = (type: PokeType) => {
    if (heroRef.current) {
      heroRef.current.poke(type);
    }
  };

  const handleBlink = () => {
    if (heroRef.current) {
      heroRef.current.blink();
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1 className="title">GB Avatars</h1>
        <div className="tags">
          <span className="tag">Pure SVG Math</span>
          <span className="tag">Zero Canvas / WebGL</span>
          <span className="tag">Dynamic Perspective Eyes</span>
          <span className="tag">Custom Shape API</span>
        </div>
      </header>

      {/* Main Avatar Stage */}
      <div className="stage-card">
        <div
          ref={heroHostRef}
          className="avatar-stage"
          title="Click to spin the bot!"
        >
          <Avatar
            ref={heroRef}
            shape={shape}
            color={color}
            eyeColor={eyeColor}
            size={160}
            state={agentState}
            expression={expression}
            isFollowingPointer
            interactive
            pokeOnClick="spin"
          />
        </div>

        {/* Tab Switcher: Official Picker vs Custom Studio vs Engine Tuning */}
        <div className="tab-buttons">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'picker' ? 'active' : ''}`}
            onClick={() => setActiveTab('picker')}
          >
            🎨 Shape & Color
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('studio')}
          >
            ✨ Custom Studio
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            ⚙️ Engine Tuning
          </button>
        </div>

        {/* Tab 1: Shape & Color Picker */}
        {activeTab === 'picker' && (
          <AvatarPicker
            shape={shape}
            color={color}
            onShapeChange={(newShape) => setShape(newShape)}
            onColorChange={(newColor) => setColor(newColor)}
          />
        )}

        {/* Tab 2: Custom Shape Studio (Screenshots 2 & 3 removed) */}
        {activeTab === 'studio' && (
          <CustomShapeStudio
            onSvgChange={(svgStr) => {
              setShape(svgStr);
            }}
          />
        )}

        {/* Tab 3: Dynamic Engine Config Studio */}
        {activeTab === 'config' && <ConfigStudio />}
      </div>

      {/* Expressions & Poke Actions */}
      <div className="controls-card">
        {/* Agent Lifecycle States (53 States in 5 Groups) */}
        <div>
          <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🤖 Agent Lifecycle States (53 States)</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 400 }}>
              Active: <strong>{agentState}</strong>
            </span>
          </div>

          {/* Group category tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {LIFECYCLE_GROUPS.map((grp, idx) => (
              <button
                key={grp.label}
                type="button"
                onClick={() => setActiveGroupIndex(idx)}
                style={{
                  background: activeGroupIndex === idx ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: activeGroupIndex === idx ? '#fff' : '#9aa0a6',
                  border: activeGroupIndex === idx ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {grp.label} ({grp.states.length})
              </button>
            ))}
          </div>

          {/* State chips */}
          <div className="chips-group" style={{ maxHeight: '160px', overflowY: 'auto', padding: '2px' }}>
            {LIFECYCLE_GROUPS[activeGroupIndex]?.states.map((st) => (
              <button
                key={st}
                type="button"
                className={`chip-btn ${agentState === st ? 'active' : ''}`}
                onClick={() => {
                  setAgentState(st);
                  if (heroRef.current) {
                    heroRef.current.setState(st);
                  }
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Expressions */}
        <div>
          <div className="section-title">Facial Expressions Override (9 Expressions)</div>
          <div className="chips-group">
            {EXPRESSIONS.map((expr) => (
              <button
                key={expr}
                type="button"
                className={`chip-btn ${expression === expr ? 'active' : ''}`}
                onClick={() => setExpression(expr)}
              >
                {expr.charAt(0).toUpperCase() + expr.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Poke Triggers */}
        <div>
          <div className="section-title">Animations & Triggers (13 3D Physics Animations)</div>
          <div className="chips-group">
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('spin')}
            >
              💫 Spin
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('bounce')}
            >
              🏀 Bounce
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('nod')}
            >
              👇 Nod
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('wave')}
            >
              👋 Wave
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('hop')}
            >
              🐰 Hop
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('wiggle')}
            >
              🍮 Wiggle
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('shake')}
            >
              🙅 Shake
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('tilt')}
            >
              🤔 Tilt
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('pulse')}
            >
              💓 Pulse
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('groove')}
            >
              🎶 Groove
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('dizzy')}
            >
              🌀 Dizzy
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('recoil')}
            >
              ⚡ Recoil
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={() => handlePoke('celebrate')}
            >
              🎉 Celebrate
            </button>
            <button
              type="button"
              className="chip-btn action"
              onClick={handleBlink}
            >
              👁️ Blink
            </button>
          </div>
        </div>
      </div>

      {/* Live Telemetry HUD */}
      <TelemetryHUD
        gaze={liveGaze}
        shape={shape}
        color={color}
        expression={expression}
      />

      {/* React Code Snippet */}
      <CodeSnippet
        shape={shape}
        color={color}
        eyeColor={eyeColor}
        expression={expression}
        state={agentState}
      />
    </div>
  );
}
export default App;