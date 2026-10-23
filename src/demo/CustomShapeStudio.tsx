import React, { useState, useEffect } from 'react';
import { normalizeSvgPathToMotionLab } from '../core/shapes';
import { useEngineConfig } from '../react/useEngineConfig';

export interface SvgOptions {
  scale?: number;
  eyeGap?: number;
  eyeShiftY?: number;
}

export interface CustomShapeStudioProps {
  onSvgChange?: (svgStr: string, options?: SvgOptions) => void;
}

interface Preset {
  name: string;
  label: string;
  svg: string;
  scale: number;
  gap: number;
  shiftY: number;
}

const SVG_PRESETS: Preset[] = [
  {
    name: 'diamond',
    label: '💎 Diamond',
    svg: `<svg viewBox="0 0 24 24"><polygon points="12,2 22,8.5 12,22 2,8.5" /></svg>`,
    scale: 1.25,
    gap: 0.48,
    shiftY: 0
  },
  {
    name: 'ghost',
    label: '👻 Ghost',
    svg: `<svg viewBox="0 0 24 24"><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>`,
    scale: 1.2,
    gap: 0.46,
    shiftY: 0.06
  },
  {
    name: 'kitty',
    label: '🐱 Kitty',
    svg: `M 40 80 L 55 35 L 90 60 C 105 55 125 55 140 60 L 175 35 L 190 80 C 210 115 210 165 180 195 C 150 215 80 215 50 195 C 20 165 20 115 40 80 Z`,
    scale: 1.15,
    gap: 0.52,
    shiftY: 0.05
  },
  {
    name: 'star8',
    label: '⭐ Star',
    svg: `M 114.27 15 L 138 78 L 202 52 L 176 114.27 L 213.54 150 L 150 162 L 138 213.54 L 114.27 172 L 78 213.54 L 78 150 L 15 150 L 52 114.27 L 26 52 L 90 78 Z`,
    scale: 1.3,
    gap: 0.44,
    shiftY: 0
  },
  {
    name: 'shield',
    label: '🛡️ Shield',
    svg: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    scale: 1.2,
    gap: 0.48,
    shiftY: 0.05
  },
  {
    name: 'heart',
    label: '❤️ Heart',
    svg: `<svg viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    scale: 1.25,
    gap: 0.44,
    shiftY: 0.04
  },
  {
    name: 'plus',
    label: '➕ Plus',
    svg: `M 85 20 L 143 20 L 143 85 L 208 85 L 208 143 L 143 143 L 143 208 L 85 208 L 85 143 L 20 143 L 20 85 L 85 85 Z`,
    scale: 1.2,
    gap: 0.5,
    shiftY: 0
  }
];

export function CustomShapeStudio({ onSvgChange }: CustomShapeStudioProps) {
  const { config, updateConfig } = useEngineConfig();
  const [svgInput, setSvgInput] = useState<string>(SVG_PRESETS[1].svg); // Ghost preset default
  const scale = config.mesh.defaultScale;
  const eyeGap = config.eyes.baseEyeGap;
  const shiftY = config.eyes.eyeShiftY;
  const [status, setStatus] = useState<string>('✓ Preset loaded and applied to avatar');
  const [isError, setIsError] = useState<boolean>(false);

  const notifyChange = (inputStr: string) => {
    try {
      if (!inputStr || !inputStr.trim()) {
        setStatus('Please enter an SVG icon or path');
        setIsError(true);
        return;
      }

      // Test SVG normalizer
      normalizeSvgPathToMotionLab(inputStr);

      setStatus('✓ SVG parsed successfully and applied to avatar');
      setIsError(false);

      if (onSvgChange) {
        onSvgChange(inputStr);
      }
    } catch (err: any) {
      setStatus(`Error: ${err?.message || String(err)}`);
      setIsError(true);
    }
  };

  // Initial trigger
  useEffect(() => {
    notifyChange(svgInput);
  }, []);

  const handleInputPasteOrChange = (newVal: string) => {
    setSvgInput(newVal);
    notifyChange(newVal);
  };

  const handleSliderChange = (newScale: number, newGap: number, newSy: number) => {
    updateConfig({
      mesh: { defaultScale: newScale },
      eyes: { baseEyeGap: newGap, eyeShiftY: newSy }
    });
    notifyChange(svgInput);
  };

  const loadPreset = (preset: Preset) => {
    setSvgInput(preset.svg);
    updateConfig({
      mesh: { defaultScale: preset.scale },
      eyes: { baseEyeGap: preset.gap, eyeShiftY: preset.shiftY }
    });
    notifyChange(preset.svg);
  };

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Quick SVG Presets */}
      <div>
        <div style={{ fontSize: '0.76rem', color: '#8b91a0', marginBottom: '8px', fontWeight: 600 }}>
          Quick SVG Presets:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {SVG_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadPreset(p)}
              style={{
                background: '#20232c',
                border: '1px solid #303542',
                color: '#d0d4dc',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.12s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2c313d')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#20232c')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Paste Field */}
      <div>
        <label style={{ display: 'block', fontSize: '0.78rem', color: '#f0f2f5', marginBottom: '6px', fontWeight: 600 }}>
          📋 Paste SVG Icon (XML or d="..." path):
        </label>
        <textarea
          value={svgInput}
          onChange={(e) => handleInputPasteOrChange(e.target.value)}
          placeholder='Paste SVG: <svg viewBox="0 0 24 24"><path d="..."/></svg> or M12 2L2 7...'
          rows={4}
          style={{
            width: '100%',
            background: '#0e1014',
            border: isError ? '1px solid #FF263C' : '1px solid #242731',
            borderRadius: '10px',
            padding: '10px 12px',
            color: '#f0f2f5',
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: '0.76rem',
            resize: 'vertical',
            boxSizing: 'border-box',
            outline: 'none',
            lineHeight: '1.4'
          }}
        />
        <div style={{ fontSize: '0.72rem', color: isError ? '#FF263C' : '#00C972', marginTop: '4px', fontWeight: 500 }}>
          {status}
        </div>
      </div>

      {/* Sliders for 3D Geometry Tuning */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '12px',
          background: '#111318',
          border: '1px solid #242731',
          borderRadius: '12px',
          padding: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8b91a0', marginBottom: '4px' }}>
            <span>3D Scale</span>
            <span style={{ color: '#1084fe', fontWeight: 600 }}>{scale}</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.6"
            step="0.05"
            value={scale}
            onChange={(e) => handleSliderChange(parseFloat(e.target.value), eyeGap, shiftY)}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8b91a0', marginBottom: '4px' }}>
            <span>Eye Spacing</span>
            <span style={{ color: '#1084fe', fontWeight: 600 }}>{eyeGap}</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="0.7"
            step="0.02"
            value={eyeGap}
            onChange={(e) => handleSliderChange(scale, parseFloat(e.target.value), shiftY)}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#8b91a0', marginBottom: '4px' }}>
            <span>Eye Height</span>
            <span style={{ color: '#1084fe', fontWeight: 600 }}>{shiftY}</span>
          </div>
          <input
            type="range"
            min="-0.2"
            max="0.2"
            step="0.02"
            value={shiftY}
            onChange={(e) => handleSliderChange(scale, eyeGap, parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
export default CustomShapeStudio;