import React from 'react';
import { GameMode, GameStats } from '../game/types';
import { Volume2, VolumeX, SlidersHorizontal, Video, RefreshCw, Swords, Users, User, Flame } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  highScore: number;
  gameMode: GameMode;
  isStreamMode: boolean;
  isMuted: boolean;
  trackerStatus: 'loading' | 'ready' | 'error' | 'no-camera';
  trackerMessage?: string;
  onToggleMute: () => void;
  onOpenSettings: () => void;
  onOpenOBSGuide: () => void;
  onToggleStreamMode: () => void;
  onRestart: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  highScore,
  gameMode,
  isStreamMode,
  isMuted,
  trackerStatus,
  trackerMessage,
  onToggleMute,
  onOpenSettings,
  onOpenOBSGuide,
  onToggleStreamMode,
  onRestart,
}) => {
  const isDuel = gameMode === 'duel';

  // Minimalist Broadcast Overlay (OBS Clean Mode)
  if (isStreamMode) {
    return (
      <div style={{
        position: 'absolute',
        top: 24,
        left: 24,
        right: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 50,
      }}>
        {isDuel ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'rgba(9, 12, 18, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '8px 22px',
            borderRadius: 14,
          }}>
            <span style={{ color: '#ff2d55', fontWeight: 900, fontSize: 24, fontFamily: "'Bangers', cursive" }}>
              P1: {stats.duel.p1Score}
            </span>
            <span style={{ color: '#ffd700', fontWeight: 900, fontSize: 13, letterSpacing: 1.5 }}>VS</span>
            <span style={{ color: '#00f0ff', fontWeight: 900, fontSize: 24, fontFamily: "'Bangers', cursive" }}>
              P2: {stats.duel.p2Score}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>⏱️ {Math.ceil(stats.timeLeft)}s</span>
          </div>
        ) : (
          <div style={{
            background: 'rgba(9, 12, 18, 0.88)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '8px 20px',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: '#e5a93c' }}>SCORE</span>
            <span style={{ fontFamily: "'Bangers', cursive", fontSize: 28, color: '#fff', letterSpacing: 1 }}>
              {stats.score}
            </span>
          </div>
        )}

        <button
          onClick={onToggleStreamMode}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Exit Stream View
        </button>
      </div>
    );
  }

  // DUEL MODE HEAD-TO-HEAD SCOREBOARD
  if (isDuel) {
    const totalScore = stats.duel.p1Score + stats.duel.p2Score;
    const p1Ratio = totalScore > 0 ? (stats.duel.p1Score / totalScore) * 100 : 50;

    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 40,
      }}>
        {/* Top Battle Bar */}
        <div style={{
          width: '100%',
          maxWidth: 960,
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 20,
        }}>
          {/* PLAYER 1 (Crimson Samurai) */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(255, 45, 85, 0.22), rgba(20, 15, 25, 0.85))',
            border: '1px solid rgba(255, 45, 85, 0.5)',
            borderLeft: '4px solid #ff2d55',
            borderRadius: 12,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(255, 45, 85, 0.15)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#ff2d55', letterSpacing: 1.5 }}>
                  PLAYER 1
                </span>
                {stats.duel.p1Combo > 1 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    background: '#ff2d55',
                    color: '#fff',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}>
                    {stats.duel.p1Combo}x COMBO
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>Crimson Blade</div>
            </div>
            <div style={{
              fontFamily: "'Bangers', cursive",
              fontSize: 48,
              lineHeight: 1,
              color: '#ff2d55',
              textShadow: '0 0 15px rgba(255, 45, 85, 0.5)',
            }}>
              {stats.duel.p1Score}
            </div>
          </div>

          {/* CENTER: Countdown Timer & VS Crest */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              background: '#0d111a',
              border: '2px solid #ffd700',
              borderRadius: '50%',
              width: 58,
              height: 58,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.35)',
            }}>
              <span style={{
                fontFamily: "'Bangers', cursive",
                fontSize: 24,
                color: stats.timeLeft <= 10 ? '#ff3b30' : '#fff',
                lineHeight: 1,
              }}>
                {Math.ceil(stats.timeLeft)}
              </span>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#ffd700', letterSpacing: 1 }}>SEC</span>
            </div>

            {/* Presence Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(0,0,0,0.6)',
              padding: '3px 10px',
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: stats.playersDetected === 2 ? '#39ff14' : '#ffd700',
            }}>
              {stats.playersDetected === 2 ? <Users size={12} /> : <User size={12} />}
              <span>{stats.playersDetected === 2 ? '2 PLAYERS READY' : '1 PLAYER (JOIN RIGHT SIDE!)'}</span>
            </div>
          </div>

          {/* PLAYER 2 (Azure Ninja) */}
          <div style={{
            background: 'linear-gradient(270deg, rgba(0, 240, 255, 0.22), rgba(15, 20, 30, 0.85))',
            border: '1px solid rgba(0, 240, 255, 0.5)',
            borderRight: '4px solid #00f0ff',
            borderRadius: 12,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 240, 255, 0.15)',
          }}>
            <div style={{
              fontFamily: "'Bangers', cursive",
              fontSize: 48,
              lineHeight: 1,
              color: '#00f0ff',
              textShadow: '0 0 15px rgba(0, 240, 255, 0.5)',
            }}>
              {stats.duel.p2Score}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                {stats.duel.p2Combo > 1 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 900,
                    background: '#00f0ff',
                    color: '#000',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}>
                    {stats.duel.p2Combo}x COMBO
                  </span>
                )}
                <span style={{ fontSize: 11, fontWeight: 900, color: '#00f0ff', letterSpacing: 1.5 }}>
                  PLAYER 2
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>Azure Blade</div>
            </div>
          </div>
        </div>

        {/* Dynamic Tug-of-War Score Bar */}
        <div style={{
          width: '100%',
          maxWidth: 960,
          height: 6,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          marginTop: 10,
          display: 'flex',
        }}>
          <div style={{
            width: `${p1Ratio}%`,
            background: 'linear-gradient(90deg, #ff2d55, #ff6b8b)',
            transition: 'width 0.3s ease-out',
          }} />
          <div style={{
            width: `${100 - p1Ratio}%`,
            background: 'linear-gradient(90deg, #00c6ff, #0072ff)',
            transition: 'width 0.3s ease-out',
          }} />
        </div>

        {/* Quick controls top-right */}
        <div style={{ position: 'absolute', top: 20, right: 32, display: 'flex', gap: 8, pointerEvents: 'auto' }}>
          <button onClick={onRestart} style={tactileBtnStyle} title="Restart Match">
            <RefreshCw size={15} />
          </button>
          <button onClick={onToggleMute} style={tactileBtnStyle} title="Mute/Unmute">
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button onClick={onOpenSettings} style={tactileBtnStyle} title="Settings">
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>
    );
  }

  // SINGLE PLAYER HUD (Refined Dojo Aesthetic)
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      padding: '24px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      zIndex: 40,
    }}>
      {/* LEFT: Master Score Plaque */}
      <div style={{
        background: 'rgba(10, 13, 20, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderLeft: '4px solid #e5a93c',
        borderRadius: 12,
        padding: '12px 24px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <div>
            <div style={{
              fontSize: 10,
              fontWeight: 900,
              letterSpacing: 2,
              color: '#e5a93c',
              textTransform: 'uppercase',
            }}>
              SCORE
            </div>
            <div style={{
              fontFamily: "'Bangers', cursive",
              fontSize: 46,
              lineHeight: 1,
              color: '#ffffff',
              letterSpacing: 1.5,
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}>
              {stats.score}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>
              BEST
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#e5a93c' }}>
              {highScore}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: Mode Badge & Strikes / Zen Timer */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{
          background: '#0d111a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '6px 18px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: gameMode === 'classic' ? '#ff3b30' : gameMode === 'zen' ? '#00f0ff' : '#39ff14',
        }}>
          {gameMode} MODE
        </div>

        {/* Strikes (Classic) */}
        {gameMode === 'classic' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2].map((idx) => {
              const isStruck = idx < stats.strikes;
              return (
                <div
                  key={idx}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: isStruck ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: `1.5px solid ${isStruck ? '#ff3b30' : 'rgba(255, 255, 255, 0.15)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 900,
                    color: isStruck ? '#ff3b30' : 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {isStruck ? '✕' : '•'}
                </div>
              );
            })}
          </div>
        )}

        {/* Zen Timer */}
        {gameMode === 'zen' && (
          <div style={{
            fontFamily: "'Bangers', cursive",
            fontSize: 32,
            color: stats.timeLeft <= 10 ? '#ff3b30' : '#00f0ff',
            letterSpacing: 1,
          }}>
            ⏱️ {Math.ceil(stats.timeLeft)}s
          </div>
        )}

        {/* Hand Tracker Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '3px 12px',
          borderRadius: 20,
          fontSize: 11,
          color: trackerStatus === 'ready' ? '#39ff14' : '#ffd700',
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: trackerStatus === 'ready' ? '#39ff14' : '#ffd700',
          }} />
          <span>
            {stats.playersDetected === 2
              ? '2 Players Detected (Try Duel Mode!)'
              : trackerMessage || 'Tracking Active'}
          </span>
        </div>
      </div>

      {/* RIGHT: Controls */}
      <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
        <button onClick={onRestart} style={tactileBtnStyle} title="Restart Game">
          <RefreshCw size={15} />
        </button>
        <button
          onClick={onOpenOBSGuide}
          style={{
            ...tactileBtnStyle,
            background: '#e5a93c',
            color: '#000',
            borderColor: '#e5a93c',
            fontWeight: 800,
          }}
          title="Virtual Camera Guide"
        >
          <Video size={15} />
          <span style={{ fontSize: 12 }}>Virtual Cam</span>
        </button>
        <button onClick={onToggleStreamMode} style={tactileBtnStyle} title="Clean View (Hides UI for Stream)">
          Stream View
        </button>
        <button onClick={onToggleMute} style={tactileBtnStyle} title="Audio">
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button onClick={onOpenSettings} style={tactileBtnStyle} title="Settings">
          <SlidersHorizontal size={15} />
        </button>
      </div>
    </div>
  );
};

const tactileBtnStyle: React.CSSProperties = {
  background: '#101420',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
  transition: 'background 0.15s, border-color 0.15s',
  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
};
