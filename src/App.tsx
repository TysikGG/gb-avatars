import React, { useState, useRef } from 'react';
import { Avatar } from './react/Avatar';
import { AvatarPicker } from './demo/AvatarPicker';
import { useAvatarGaze } from './react/useAvatarGaze';
import { EXPRESSIONS } from './core/expressions';
import { TelemetryHUD } from './demo/TelemetryHUD';
import { CustomShapeStudio } from './demo/CustomShapeStudio';
import { ConfigStudio } from './demo/ConfigStudio';
import { CodeSnippet } from './demo/CodeSnippet';
import { AvatarHandle, PokeType, Expression } from './core/types';

export function App() {
  const [shape, setShape] = useState<string>('sparkle');
  const [color, setColor] = useState<string>('#00C972');
  const [eyeColor, setEyeColor] = useState<string>('#000000');
  const [expression, setExpression] = useState<Expression>('neutral');
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
        {/* Expressions */}
        <div>
          <div className="section-title">Facial Expressions (9 Expressions)</div>
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
      />
    </div>
  );
}
export default App;