import React, { useState } from 'react';
import { X, Video, Copy, Check, ExternalLink } from 'lucide-react';

interface OBSGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleStreamMode: () => void;
}

export const OBSGuideModal: React.FC<OBSGuideModalProps> = ({
  isOpen,
  onClose,
  onToggleStreamMode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const streamUrl = window.location.origin + '?stream=true';

  const copyUrl = () => {
    navigator.clipboard.writeText(streamUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        maxWidth: 540,
        padding: 30,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
        color: '#fff',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: '#e5a93c',
              color: '#000',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Video size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Virtual Webcam Broadcast Guide</h2>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
                Stream Fruit Ninja live into Zoom, Discord, Google Meet & Teams
              </div>
            </div>
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

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {/* Step 1 */}
          <div style={stepItemStyle}>
            <div style={stepNumberStyle}>1</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 2 }}>
                Open OBS Studio
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                Download free for Mac from{' '}
                <a href="https://obsproject.com" target="_blank" rel="noreferrer" style={{ color: '#e5a93c', textDecoration: 'none' }}>
                  obsproject.com <ExternalLink size={10} style={{ verticalAlign: 'middle' }} />
                </a>.
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div style={stepItemStyle}>
            <div style={stepNumberStyle}>2</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 2 }}>
                Add Source in OBS
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 6 }}>
                Under <b>Sources</b> click <b>+</b> &gt; select <b>Window Capture</b> (choose browser) OR <b>Browser Source</b> with this clean URL:
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,0,0,0.5)',
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <code style={{ fontSize: 11, color: '#e5a93c', flex: 1, wordBreak: 'break-all' }}>{streamUrl}</code>
                <button
                  onClick={copyUrl}
                  style={{
                    background: copied ? '#39ff14' : 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    color: copied ? '#000' : '#fff',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={stepItemStyle}>
            <div style={stepNumberStyle}>3</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 2 }}>
                Click "Start Virtual Camera" in OBS
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                Located in the bottom-right Controls dock of OBS Studio.
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div style={stepItemStyle}>
            <div style={stepNumberStyle}>4</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 2 }}>
                Select "OBS Virtual Camera" in Zoom / Discord
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                In your video call settings, switch camera to <b>OBS Virtual Camera</b>. You're now live!
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              onToggleStreamMode();
              onClose();
            }}
            style={{
              flex: 1,
              background: '#e5a93c',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ENTER CLEAN STREAM VIEW
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 8,
              padding: '12px 20px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

const stepItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 8,
  padding: '10px 14px',
  alignItems: 'flex-start',
};

const stepNumberStyle: React.CSSProperties = {
  background: '#e5a93c',
  color: '#000',
  width: 22,
  height: 22,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 900,
  flexShrink: 0,
};
