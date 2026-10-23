import React, { useState } from 'react';
import { useEngineConfig } from '../react/useEngineConfig';
import type { EngineConfig, DeepPartial } from '../core/config';

export interface CodeSnippetProps {
  shape: string;
  color: string;
  eyeColor: string;
  expression: string;
}

function formatConfigDiff(diff: DeepPartial<EngineConfig>): string {
  const lines: string[] = ['// Custom engine configuration', 'updateEngineConfig({'];
  const categories = Object.keys(diff) as Array<keyof EngineConfig>;

  categories.forEach((cat, catIdx) => {
    const props = diff[cat];
    if (!props) return;
    const propKeys = Object.keys(props);
    if (propKeys.length === 0) return;

    lines.push(`  ${cat}: {`);
    propKeys.forEach((key, propIdx) => {
      const val = (props as any)[key];
      const isLastProp = propIdx === propKeys.length - 1;
      const formattedVal =
        typeof val === 'number'
          ? Number.isInteger(val)
            ? String(val)
            : Number(val.toFixed(4))
          : JSON.stringify(val);
      lines.push(`    ${key}: ${formattedVal}${isLastProp ? '' : ','}`);
    });
    const isLastCat = catIdx === categories.length - 1;
    lines.push(`  }${isLastCat ? '' : ','}`);
  });

  lines.push('});\n');
  return lines.join('\n');
}

export function CodeSnippet({
  shape,
  color,
  eyeColor,
  expression
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);
  const { diff } = useEngineConfig();

  const isSvg =
    shape.includes('<') ||
    shape.startsWith('M') ||
    shape.startsWith('svg_') ||
    shape.startsWith('inline_') ||
    shape.startsWith('preview_');

  const hasConfigDiff = diff !== null && Object.keys(diff).length > 0;
  const configBlock = hasConfigDiff ? `${formatConfigDiff(diff)}\n` : '';
  const importStatement = hasConfigDiff
    ? "import { Avatar, updateEngineConfig } from 'gb-avatars';"
    : "import { Avatar } from 'gb-avatars';";

  let snippet = '';

  if (isSvg) {
    // Preserve entire SVG markup without truncation or ellipsis
    const cleanSvg = shape.trim().replace(/`/g, '\\`');
    const eyeColorProp = eyeColor !== '#000000' ? `\n      eyeColor="${eyeColor}"` : '';
    const exprProp = expression !== 'neutral' ? `\n      expression="${expression}"` : '';

    snippet = `${importStatement}\n\n${configBlock}const CUSTOM_SVG = \`${cleanSvg}\`;\n\nexport function MyBot() {\n  return (\n    <Avatar\n      svg={CUSTOM_SVG}\n      color="${color}"${eyeColorProp}${exprProp}\n      size={140}\n      isFollowingPointer\n      interactive\n    />\n  );\n}`;
  } else {
    const eyeColorProp = eyeColor !== '#000000' ? `\n      eyeColor="${eyeColor}"` : '';
    const exprProp = expression !== 'neutral' ? `\n      expression="${expression}"` : '';

    snippet = `${importStatement}\n\n${configBlock}export function MyBot() {\n  return (\n    <Avatar\n      shape="${shape}"\n      color="${color}"${eyeColorProp}${exprProp}\n      size={140}\n      isFollowingPointer\n      interactive\n    />\n  );\n}`;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: '#16181e',
        border: '1px solid #242731',
        borderRadius: '16px',
        padding: '16px 20px',
        width: '100%',
        maxWidth: '520px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#8b91a0' }}>
            React Code Snippet
          </span>
          {hasConfigDiff && (
            <span
              style={{
                fontSize: '0.68rem',
                color: '#1084fe',
                background: '#1084fe18',
                border: '1px solid #1084fe33',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}
            >
              + custom config
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={copyToClipboard}
          style={{
            background: copied ? '#00C972' : '#242731',
            border: 'none',
            color: '#fff',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.15s ease'
          }}
        >
          {copied ? '✓ Copied!' : 'Copy JSX'}
        </button>
      </div>

      <pre
        style={{
          background: '#0e1014',
          borderRadius: '8px',
          padding: '12px',
          margin: 0,
          fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
          fontSize: '0.78rem',
          color: '#e6edf3',
          overflowX: 'auto',
          maxHeight: '260px',
          overflowY: 'auto',
          lineHeight: '1.45',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
