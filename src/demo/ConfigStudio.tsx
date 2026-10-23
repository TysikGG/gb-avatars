import React, { useState } from 'react';
import { useEngineConfig } from '../react/useEngineConfig';
import type { EngineConfig } from '../core/config';

export function ConfigStudio() {
  const { config, defaults, updateConfig, resetConfig } = useEngineConfig();
  const [activeCategory, setActiveCategory] = useState<keyof EngineConfig>('gaze');
  const [copied, setCopied] = useState(false);

  // Quick tuning presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'default':
        resetConfig();
        break;
      case 'snappy':
        updateConfig({
          physics: { bodyBlendSpeed: 22, decayBase: 0.78 },
          gaze: { gazeFactor: 1.15, maxPitchDeg: 28, maxYawDeg: 38 },
          motion: { blinkDuration: 0.14, morphDuration: 0.15, lookTransitionDuration: 0.25 }
        });
        break;
      case 'chill':
        updateConfig({
          physics: { bodyBlendSpeed: 5, decayBase: 0.94 },
          gaze: { gazeFactor: 0.38, maxPitchDeg: 12, maxYawDeg: 16 },
          motion: { blinkDuration: 0.5, morphDuration: 0.55, lookTransitionDuration: 0.9 }
        });
        break;
      case 'deep3d':
        updateConfig({
          mesh: { defaultHalfDepth: 0.65, defaultBevel: 0.38, bevelSteps: 6 },
          gaze: { maxPitchDeg: 32, maxYawDeg: 42, shiftX: 0.12, shiftY: 0.09 }
        });
        break;
    }
  };

  const copyConfigJson = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const categories: Array<{ id: keyof EngineConfig; label: string; icon: string }> = [
    { id: 'gaze', label: 'Gaze & Tracking', icon: '👀' },
    { id: 'physics', label: 'Physics & Springs', icon: '⚡' },
    { id: 'motion', label: 'Motion & Timing', icon: '🎬' },
    { id: 'eyes', label: 'Eye Geometry', icon: '👁️' },
    { id: 'mesh', label: '3D Mesh & Bevels', icon: '🧊' }
  ];

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        animation: 'fadeIn 0.2s ease-in-out'
      }}
    >
      {/* Presets Bar */}
      <div>
        <div style={{ fontSize: '0.74rem', color: '#8b91a0', marginBottom: '8px', fontWeight: 600 }}>
          Quick behavioral presets:
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => applyPreset('default')}
            style={presetBtnStyle}
            onMouseEnter={onBtnHover}
            onMouseLeave={onBtnLeave}
          >
            🎯 Default
          </button>
          <button
            type="button"
            onClick={() => applyPreset('snappy')}
            style={presetBtnStyle}
            onMouseEnter={onBtnHover}
            onMouseLeave={onBtnLeave}
          >
            ⚡ Snappy
          </button>
          <button
            type="button"
            onClick={() => applyPreset('chill')}
            style={presetBtnStyle}
            onMouseEnter={onBtnHover}
            onMouseLeave={onBtnLeave}
          >
            🧘 Chill
          </button>
          <button
            type="button"
            onClick={() => applyPreset('deep3d')}
            style={presetBtnStyle}
            onMouseEnter={onBtnHover}
            onMouseLeave={onBtnLeave}
          >
            🗿 Deep 3D
          </button>
        </div>
      </div>

      {/* Category selector */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: '#111318',
          border: '1px solid #242731',
          borderRadius: '10px',
          padding: '4px',
          overflowX: 'auto'
        }}
      >
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategory(c.id)}
            style={{
              flex: 1,
              whiteSpace: 'nowrap',
              background: activeCategory === c.id ? '#252833' : 'transparent',
              color: activeCategory === c.id ? '#fff' : '#8b91a0',
              border: 'none',
              borderRadius: '7px',
              padding: '6px 10px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.12s'
            }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Sliders Container */}
      <div
        style={{
          background: '#111318',
          border: '1px solid #242731',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Category Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#f0f2f5', fontWeight: 700 }}>
            {categories.find((c) => c.id === activeCategory)?.icon}{' '}
            {categories.find((c) => c.id === activeCategory)?.label}
          </span>
          <button
            type="button"
            onClick={() => resetConfig(activeCategory)}
            style={{
              background: '#1c1e26',
              border: '1px solid #303542',
              color: '#8b91a0',
              padding: '3px 9px',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🔄 Reset Category
          </button>
        </div>

        {/* Dynamic Category Sliders */}
        {activeCategory === 'gaze' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SliderField
              label="Gaze Influence (Gaze Factor)"
              description="Weight of pointer tracking influence on head rotation"
              min={0}
              max={1.5}
              step={0.05}
              value={config.gaze.gazeFactor}
              defaultValue={defaults.gaze.gazeFactor}
              onChange={(val) => updateConfig({ gaze: { gazeFactor: val } })}
            />
            <SliderField
              label="Max Vertical Tilt (Pitch Max)"
              description="Maximum vertical head pitch limit in degrees"
              unit="°"
              min={0}
              max={45}
              step={1}
              value={config.gaze.maxPitchDeg}
              defaultValue={defaults.gaze.maxPitchDeg}
              onChange={(val) => updateConfig({ gaze: { maxPitchDeg: val } })}
            />
            <SliderField
              label="Max Horizontal Turn (Yaw Max)"
              description="Maximum horizontal head yaw limit in degrees"
              unit="°"
              min={0}
              max={60}
              step={1}
              value={config.gaze.maxYawDeg}
              defaultValue={defaults.gaze.maxYawDeg}
              onChange={(val) => updateConfig({ gaze: { maxYawDeg: val } })}
            />
            <SliderField
              label="Head Center Shift X (Shift X)"
              description="Horizontal parallax offset during head turn"
              min={0}
              max={0.2}
              step={0.005}
              value={config.gaze.shiftX}
              defaultValue={defaults.gaze.shiftX}
              onChange={(val) => updateConfig({ gaze: { shiftX: val } })}
            />
            <SliderField
              label="Head Center Shift Y (Shift Y)"
              description="Vertical parallax offset during head tilt"
              min={0}
              max={0.15}
              step={0.005}
              value={config.gaze.shiftY}
              defaultValue={defaults.gaze.shiftY}
              onChange={(val) => updateConfig({ gaze: { shiftY: val } })}
            />
            <SliderField
              label="Tracking Bounding Box (Default Gaze Scale)"
              description="Scale divisor for pointer coordinate normalization"
              min={0.1}
              max={1.0}
              step={0.05}
              value={config.gaze.defaultGazeScale}
              defaultValue={defaults.gaze.defaultGazeScale}
              onChange={(val) => updateConfig({ gaze: { defaultGazeScale: val } })}
            />
          </div>
        )}

        {activeCategory === 'physics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SliderField
              label="Spring Sub-step Frequency (Spring Sub-step Hz)"
              description="Numerical physics integration (120 Hz = 0.0083s dt)"
              unit=" Hz"
              min={60}
              max={240}
              step={10}
              value={Math.round(1 / config.physics.springSubStepDt)}
              defaultValue={Math.round(1 / defaults.physics.springSubStepDt)}
              onChange={(val) => updateConfig({ physics: { springSubStepDt: 1 / val } })}
            />
            <SliderField
              label="Body Morph Speed (Body Blend Speed)"
              description="Spring stiffness when transitioning between 3D shapes"
              unit=" rad/s"
              min={2}
              max={30}
              step={1}
              value={config.physics.bodyBlendSpeed}
              defaultValue={defaults.physics.bodyBlendSpeed}
              onChange={(val) => updateConfig({ physics: { bodyBlendSpeed: val } })}
            />
            <SliderField
              label="Decay Smoothing Base (Decay Base)"
              description="Exponential pointer gaze smoothing (higher = silkier)"
              min={0.7}
              max={0.98}
              step={0.01}
              value={config.physics.decayBase}
              defaultValue={defaults.physics.decayBase}
              onChange={(val) => updateConfig({ physics: { decayBase: val } })}
            />
            <SliderField
              label="Shape Transition Damping (Blend Damping)"
              description="1.0 = critically damped without overshoot"
              min={0.3}
              max={2.0}
              step={0.05}
              value={config.physics.bodyBlendDamping}
              defaultValue={defaults.physics.bodyBlendDamping}
              onChange={(val) => updateConfig({ physics: { bodyBlendDamping: val } })}
            />
          </div>
        )}

        {activeCategory === 'motion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SliderField
              label="Blink Duration"
              description="Total duration of eyelid closing and opening"
              unit=" s"
              min={0.08}
              max={0.8}
              step={0.02}
              value={config.motion.blinkDuration}
              defaultValue={defaults.motion.blinkDuration}
              onChange={(val) => updateConfig({ motion: { blinkDuration: val } })}
            />
            <SliderField
              label="Blink Reopen Bounce"
              description="Micro-overshoot elastic bounce on snap open"
              min={1.0}
              max={1.25}
              step={0.01}
              value={config.motion.blinkBounce}
              defaultValue={defaults.motion.blinkBounce}
              onChange={(val) => updateConfig({ motion: { blinkBounce: val } })}
            />
            <SliderField
              label="Expression Morph Duration"
              description="Bézier curve interpolation duration on emotion change"
              unit=" s"
              min={0.08}
              max={0.8}
              step={0.02}
              value={config.motion.morphDuration}
              defaultValue={defaults.motion.morphDuration}
              onChange={(val) => updateConfig({ motion: { morphDuration: val } })}
            />
            <SliderField
              label="Blink Expression Morph (Lid Morph)"
              description="Expression morphing during closed eyelid phase"
              unit=" s"
              min={0.1}
              max={1.0}
              step={0.05}
              value={config.motion.lidMorphDuration}
              defaultValue={defaults.motion.lidMorphDuration}
              onChange={(val) => updateConfig({ motion: { lidMorphDuration: val } })}
            />
            <SliderField
              label="Look Transition Duration"
              description="Smooth interpolation time between gaze coordinates"
              unit=" s"
              min={0.1}
              max={1.2}
              step={0.05}
              value={config.motion.lookTransitionDuration}
              defaultValue={defaults.motion.lookTransitionDuration}
              onChange={(val) => updateConfig({ motion: { lookTransitionDuration: val } })}
            />
            <SliderField
              label="Default Camera Zoom"
              description="Baseline perspective camera zoom factor"
              min={0.3}
              max={1.4}
              step={0.05}
              value={config.motion.defaultZoom}
              defaultValue={defaults.motion.defaultZoom}
              onChange={(val) => updateConfig({ motion: { defaultZoom: val } })}
            />
          </div>
        )}

        {activeCategory === 'eyes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SliderField
              label="Interpupillary Distance (Base Eye Gap)"
              description="Canonical distance between centers of both eyes"
              min={0.3}
              max={1.0}
              step={0.02}
              value={config.eyes.baseEyeGap}
              defaultValue={defaults.eyes.baseEyeGap}
              onChange={(val) => updateConfig({ eyes: { baseEyeGap: val } })}
            />
            <SliderField
              label="Vertical Eye Offset (Eye Shift Y)"
              description="Vertical eye placement relative to face center"
              min={-0.2}
              max={0.2}
              step={0.01}
              value={config.eyes.eyeShiftY}
              defaultValue={defaults.eyes.eyeShiftY}
              onChange={(val) => updateConfig({ eyes: { eyeShiftY: val } })}
            />
            <SliderField
              label="Individual Eye Width (Base Eye Width)"
              description="Horizontal radius of individual eye oval contour"
              min={0.1}
              max={0.5}
              step={0.01}
              value={config.eyes.baseEyeWidth}
              defaultValue={defaults.eyes.baseEyeWidth}
              onChange={(val) => updateConfig({ eyes: { baseEyeWidth: val } })}
            />
            <SliderField
              label="Individual Eye Height (Base Eye Height)"
              description="Vertical radius of individual eye oval contour"
              min={0.2}
              max={0.8}
              step={0.02}
              value={config.eyes.baseEyeHeight}
              defaultValue={defaults.eyes.baseEyeHeight}
              onChange={(val) => updateConfig({ eyes: { baseEyeHeight: val } })}
            />
            <SliderField
              label="Eye Contour Precision (Eye Loop Points)"
              description="Number of spline discretization points"
              min={16}
              max={128}
              step={8}
              value={config.eyes.eyeLoopPoints}
              defaultValue={defaults.eyes.eyeLoopPoints}
              onChange={(val) => updateConfig({ eyes: { eyeLoopPoints: Math.round(val) } })}
            />
          </div>
        )}

        {activeCategory === 'mesh' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <SliderField
              label="3D Model Scale (Default Scale)"
              description="Baseline scale factor for custom extruded 3D models"
              min={0.8}
              max={1.8}
              step={0.05}
              value={config.mesh.defaultScale}
              defaultValue={defaults.mesh.defaultScale}
              onChange={(val) => updateConfig({ mesh: { defaultScale: val } })}
            />
            <SliderField
              label="3D Extrusion Depth (Default Half Depth)"
              description="Z-axis thickness of the 3D body"
              min={0.1}
              max={1.0}
              step={0.02}
              value={config.mesh.defaultHalfDepth}
              defaultValue={defaults.mesh.defaultHalfDepth}
              onChange={(val) => updateConfig({ mesh: { defaultHalfDepth: val } })}
            />
            <SliderField
              label="Edge Bevel Radius (Default Bevel)"
              description="Curvature radius of front and back rounded edges"
              min={0.05}
              max={0.5}
              step={0.01}
              value={config.mesh.defaultBevel}
              defaultValue={defaults.mesh.defaultBevel}
              onChange={(val) => updateConfig({ mesh: { defaultBevel: val } })}
            />
            <SliderField
              label="Bevel Steps"
              description="Subdivision count for bevel edge curvature"
              min={1}
              max={8}
              step={1}
              value={config.mesh.bevelSteps}
              defaultValue={defaults.mesh.bevelSteps}
              onChange={(val) => updateConfig({ mesh: { bevelSteps: Math.round(val) } })}
            />
            <SliderField
              label="Revolution Segments"
              description="Circumference smoothness for cylinders and pebbles"
              min={16}
              max={128}
              step={8}
              value={config.mesh.revolutionSegments}
              defaultValue={defaults.mesh.revolutionSegments}
              onChange={(val) => updateConfig({ mesh: { revolutionSegments: Math.round(val) } })}
            />
            <SliderField
              label="Loft Surface Profile (Loft Power)"
              description="Dome convexity exponent for heart and cloud shapes"
              min={0.3}
              max={1.5}
              step={0.02}
              value={config.mesh.loftPower}
              defaultValue={defaults.mesh.loftPower}
              onChange={(val) => updateConfig({ mesh: { loftPower: val } })}
            />
          </div>
        )}
      </div>

      {/* Footer Controls: Reset All and Copy JSON */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => resetConfig()}
          style={{
            background: '#20232c',
            border: '1px solid #303542',
            color: '#d0d4dc',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.12s'
          }}
          onMouseEnter={onBtnHover}
          onMouseLeave={onBtnLeave}
        >
          ♻️ Reset All Parameters
        </button>
        <button
          type="button"
          onClick={copyConfigJson}
          style={{
            background: copied ? '#00C972' : '#1084fe',
            border: 'none',
            color: '#fff',
            borderRadius: '8px',
            padding: '7px 14px',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.12s'
          }}
        >
          {copied ? '✓ Copied to clipboard!' : '📋 Export JSON Config'}
        </button>
      </div>
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  value: number;
  defaultValue: number;
  onChange: (val: number) => void;
}

function SliderField({
  label,
  description,
  min,
  max,
  step,
  unit = '',
  value,
  defaultValue,
  onChange
}: SliderFieldProps) {
  const isModified = Math.abs(value - defaultValue) > 1e-4;

  return (
    <div
      style={{
        background: '#0e1014',
        border: isModified ? '1px solid #1084fe55' : '1px solid #1c1f28',
        borderRadius: '9px',
        padding: '10px 12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.74rem', color: '#f0f2f5', fontWeight: 600 }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isModified && (
            <button
              type="button"
              title="Reset to default"
              onClick={() => onChange(defaultValue)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8b91a0',
                cursor: 'pointer',
                fontSize: '0.66rem',
                padding: '0 2px'
              }}
            >
              ↺
            </button>
          )}
          <span
            style={{
              fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
              fontSize: '0.74rem',
              color: isModified ? '#1084fe' : '#8b91a0',
              fontWeight: 700,
              background: '#161922',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            {value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0)}
            {unit}
          </span>
        </div>
      </div>
      <div style={{ fontSize: '0.68rem', color: '#747b8c', marginBottom: '8px', lineHeight: '1.2' }}>
        {description}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          accentColor: '#1084fe',
          cursor: 'pointer'
        }}
      />
    </div>
  );
}

const presetBtnStyle: React.CSSProperties = {
  background: '#20232c',
  border: '1px solid #303542',
  color: '#d0d4dc',
  borderRadius: '8px',
  padding: '6px 11px',
  fontSize: '0.72rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.12s'
};

const onBtnHover = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = '#2c313d';
};

const onBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.style.backgroundColor = '#20232c';
};
