import React, { useRef } from 'react';
import { Avatar } from '../react/Avatar.js';
import { OFFICIAL_SHAPES } from '../core/shapes.js';
import { OFFICIAL_COLORS } from '../core/colors.js';
import type { ColorDefinition } from '../core/types.js';

export interface AvatarPickerProps {
  shape?: string;
  color?: string;
  onShapeChange?: (shape: string) => void;
  onColorChange?: (color: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AvatarPicker Component
 *
 * Clean shape and color selector.
 * Renders live 3D avatar thumbnails for every shape option.
 */
export function AvatarPicker({
  shape = 'sparkle',
  color = '#00C972',
  onShapeChange,
  onColorChange,
  className = '',
  style = {}
}: AvatarPickerProps) {
  return (
    <div
      className={`gb-avatar-picker gravatar-picker ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center',
        width: '100%',
        ...style
      }}
    >
      {/* 13 Official Shapes Grid */}
      <div style={{ width: '100%' }}>
        <div
          style={{
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#8b91a0',
            fontWeight: 600,
            marginBottom: '10px',
            textAlign: 'center'
          }}
        >
          Shape
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          {/* Row 1: 5 shapes */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {OFFICIAL_SHAPES.slice(0, 5).map((sh) => (
              <ShapeButton
                key={sh}
                shape={sh}
                active={shape === sh}
                color={color}
                onClick={() => onShapeChange && onShapeChange(sh)}
              />
            ))}
          </div>

          {/* Row 2: 5 shapes */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {OFFICIAL_SHAPES.slice(5, 10).map((sh) => (
              <ShapeButton
                key={sh}
                shape={sh}
                active={shape === sh}
                color={color}
                onClick={() => onShapeChange && onShapeChange(sh)}
              />
            ))}
          </div>

          {/* Row 3: 3 shapes */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {OFFICIAL_SHAPES.slice(10, 13).map((sh) => (
              <ShapeButton
                key={sh}
                shape={sh}
                active={shape === sh}
                color={color}
                onClick={() => onShapeChange && onShapeChange(sh)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Colors Palette & Custom RGB Picker */}
      <div style={{ width: '100%' }}>
        <div
          style={{
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#8b91a0',
            fontWeight: 600,
            marginBottom: '10px',
            textAlign: 'center'
          }}
        >
          Color
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center'
          }}
        >
          {/* Row 1: 6 colors */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {OFFICIAL_COLORS.slice(0, 6).map((col) => (
              <ColorSwatch
                key={col.id}
                color={col}
                active={color.toLowerCase() === col.hex.toLowerCase()}
                onClick={() => onColorChange && onColorChange(col.hex)}
              />
            ))}
          </div>

          {/* Row 2: 5 colors + 1 Custom RGB Color Picker */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
            {OFFICIAL_COLORS.slice(6, 11).map((col) => (
              <ColorSwatch
                key={col.id}
                color={col}
                active={color.toLowerCase() === col.hex.toLowerCase()}
                onClick={() => onColorChange && onColorChange(col.hex)}
              />
            ))}

            {/* Custom RGB Color Picker */}
            <CustomColorPicker currentColor={color} onColorChange={onColorChange} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ShapeButtonProps {
  shape: string;
  label?: string;
  active: boolean;
  color: string;
  onClick: () => void;
}

function ShapeButton({ shape, label, active, color, onClick }: ShapeButtonProps) {
  return (
    <button
      type="button"
      title={label || shape}
      onClick={onClick}
      style={{
        background: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
        border: active
          ? '2px solid rgba(255, 255, 255, 0.35)'
          : '2px solid transparent',
        borderRadius: '14px',
        width: '48px',
        height: '48px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.12s, border-color 0.12s, background-color 0.12s',
        padding: 0,
        outline: 'none',
        boxShadow: active ? '0 0 14px rgba(0, 0, 0, 0.5)' : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        if (!active) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <Avatar
        shape={shape}
        color={color}
        size={36}
        isStatic
        interactive={false}
      />
    </button>
  );
}

interface ColorSwatchProps {
  color: ColorDefinition;
  active: boolean;
  onClick: () => void;
}

function ColorSwatch({ color, active, onClick }: ColorSwatchProps) {
  return (
    <button
      type="button"
      title={`${color.label} (${color.hex})`}
      onClick={onClick}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: color.hex,
        border: '2px solid transparent',
        cursor: 'pointer',
        transition: 'transform 0.15s',
        outline: 'none',
        padding: 0,
        boxShadow: active
          ? '0 0 0 2px #16181e, 0 0 0 4px #888e9d'
          : 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    />
  );
}

interface CustomColorPickerProps {
  currentColor: string;
  onColorChange?: (color: string) => void;
}

function CustomColorPicker({ currentColor, onColorChange }: CustomColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isPreset = OFFICIAL_COLORS.some(
    (c) => c.hex.toLowerCase() === currentColor.toLowerCase()
  );

  return (
    <div
      title={`Custom RGB / HEX Color (${currentColor})`}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: isPreset
          ? 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
          : currentColor,
        boxShadow: !isPreset
          ? '0 0 0 2px #16181e, 0 0 0 4px #888e9d'
          : 'none',
        transition: 'transform 0.15s',
        boxSizing: 'border-box'
      }}
      onClick={() => inputRef.current && inputRef.current.click()}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <input
        ref={inputRef}
        type="color"
        value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#00C972'}
        onChange={(e) => onColorChange && onColorChange(e.target.value)}
        style={{
          position: 'absolute',
          opacity: 0,
          width: '100%',
          height: '100%',
          cursor: 'pointer',
          left: 0,
          top: 0
        }}
      />
      {isPreset && (
        <span style={{ fontSize: '13px', lineHeight: 1, pointerEvents: 'none' }}>🎨</span>
      )}
    </div>
  );
}
