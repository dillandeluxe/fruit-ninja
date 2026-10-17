import React from 'react';
import { BladeColor, GameSettings } from '../game/types';
import { X, Sparkles, SlidersHorizontal, Eye, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

const BLADE_COLORS: { id: BladeColor; name: string; color: string }[] = [
  { id: 'crimson', name: 'Crimson Fury', color: '#ff2d55' },
  { id: 'cyan', name: 'Cyber Cyan', color: '#00f0ff' },
  { id: 'gold', name: 'Solar Gold', color: '#ffd700' },
  { id: 'neonGreen', name: 'Acid Green', color: '#39ff14' },
  { id: 'cyberViolet', name: 'Neon Violet', color: '#d946ef' },
  { id: 'rainbow', name: 'Rainbow Chroma', color: 'linear-gradient(135deg, #ff007f, #00f0ff, #39ff14)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(6, 9, 15, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 20,
    }}>
      <div style={{
        background: '#0d111a',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 480,
        padding: 28,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
        color: '#fff',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SlidersHorizontal size={18} color="#e5a93c" />
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: 0.5 }}>Dojo Settings</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Blade Glow Palette */}
        <div style={{ marginBottom: 20 }}>
          <label style={sectionLabelStyle}>
            <Sparkles size={14} color="#e5a93c" /> BLADE TRAIL COLOR
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {BLADE_COLORS.map((b) => (
              <button
                key={b.id}
                onClick={() => onUpdateSettings({ bladeColor: b.id })}
                style={{
                  background: settings.bladeColor === b.id ? 'rgba(229, 169, 60, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1.5px solid ${settings.bladeColor === b.id ? '#e5a93c' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  transition: 'border-color 0.15s',
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: b.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Slice Sensitivity Slider */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={sectionLabelStyle}>
              HIT SENSITIVITY & REACH
            </label>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#e5a93c' }}>
              {Math.round(settings.sliceSensitivity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.05"
            value={settings.sliceSensitivity}
            onChange={(e) => onUpdateSettings({ sliceSensitivity: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#e5a93c', cursor: 'pointer' }}
          />
        </div>

        {/* Camera Controls */}
        <div style={{ marginBottom: 22 }}>
          <label style={sectionLabelStyle}>
            <Eye size={14} color="#e5a93c" /> CAMERA OPTIONS
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Mirror */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Mirror Camera (Selfie View)</span>
              <input
                type="checkbox"
                checked={settings.mirrorCamera}
                onChange={(e) => onUpdateSettings({ mirrorCamera: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#e5a93c', cursor: 'pointer' }}
              />
            </div>

            {/* Video Filter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>Video Filter</span>
              <select
                value={settings.cameraFilter}
                onChange={(e) => onUpdateSettings({ cameraFilter: e.target.value as any })}
                style={{
                  background: '#151b26',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                <option value="normal">Natural Webcam</option>
                <option value="vibrant">Vibrant & Punchy</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="comic">Comic High-Contrast</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audio FX Volume */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={sectionLabelStyle}>
              <Volume2 size={14} color="#e5a93c" /> SOUND VOLUME
            </label>
            <span style={{ fontSize: 12, fontWeight: 800 }}>
              {Math.round(settings.sfxVolume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.sfxVolume}
            onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: '#e5a93c', cursor: 'pointer' }}
          />
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: '#e5a93c',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '12px',
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 1,
            cursor: 'pointer',
          }}
        >
          CONFIRM & CLOSE
        </button>
      </div>
    </div>
  );
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: 'rgba(255, 255, 255, 0.6)',
  letterSpacing: 1.5,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 8,
  textTransform: 'uppercase',
};
