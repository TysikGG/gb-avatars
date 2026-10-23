import React from 'react';

export interface TelemetryHUDProps {
  gaze: [number, number] | null;
  shape: string;
  color: string;
  expression: string;
}

export function TelemetryHUD({
  gaze,
  shape,
  color,
  expression
}: TelemetryHUDProps) {
  const gazeX = gaze ? gaze[0].toFixed(2) : '0.00';
  const gazeY = gaze ? gaze[1].toFixed(2) : '0.00';

  // Estimate 3D Euler angles based on perspective projection formula:
  // Non-sphere: Pitch = -19° * cy * 0.55; Yaw = 26° * cx * 0.55
  const gx = gaze ? gaze[0] : 0;
  const gy = gaze ? gaze[1] : 0;
  const estimatedPitch = (-19 * gy * 0.55).toFixed(1);
  const estimatedYaw = (26 * gx * 0.55).toFixed(1);

  return (
    <div
      style={{
        background: '#111318',
        border: '1px solid #242731',
        borderRadius: '14px',
        padding: '12px 18px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '12px',
        fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
        fontSize: '0.8rem',
        width: '100%',
        maxWidth: '520px',
        boxSizing: 'border-box'
      }}
    >
      <div>
        <div style={{ color: '#8b91a0', fontSize: '0.72rem', textTransform: 'uppercase' }}>Gaze [X, Y]</div>
        <div style={{ color: '#00C972', fontWeight: 600 }}>{gazeX}, {gazeY}</div>
      </div>

      <div>
        <div style={{ color: '#8b91a0', fontSize: '0.72rem', textTransform: 'uppercase' }}>3D Pitch / Yaw</div>
        <div style={{ color: '#1084FE', fontWeight: 600 }}>{estimatedPitch}°, {estimatedYaw}°</div>
      </div>

      <div style={{ overflow: 'hidden' }}>
        <div style={{ color: '#8b91a0', fontSize: '0.72rem', textTransform: 'uppercase' }}>Shape</div>
        <div
          title={shape}
          style={{
            color: '#f0f2f5',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {shape.includes('<') ||
          shape.startsWith('M') ||
          shape.startsWith('inline_') ||
          shape.startsWith('svg_') ||
          shape.startsWith('preview_')
            ? 'custom (SVG)'
            : shape}
        </div>
      </div>

      <div>
        <div style={{ color: '#8b91a0', fontSize: '0.72rem', textTransform: 'uppercase' }}>Color</div>
        <div style={{ color: color, fontWeight: 600 }}>{color}</div>
      </div>

      <div>
        <div style={{ color: '#8b91a0', fontSize: '0.72rem', textTransform: 'uppercase' }}>Emotion</div>
        <div style={{ color: '#FF9800', fontWeight: 600 }}>{expression}</div>
      </div>
    </div>
  );
}
