import React from 'react';
import { GameMode, GameStats } from '../game/types';
import { RefreshCw, Swords, Trophy, Crown, Zap, Bomb } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  stats: GameStats;
  highScore: number;
  gameMode: GameMode;
  onRestart: (mode?: GameMode) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  highScore,
  gameMode,
  onRestart,
}) => {
  if (!isOpen) return null;

  const isDuel = gameMode === 'duel';

  // 2-PLAYER DUEL GAME OVER
  if (isDuel) {
    const winner = stats.duel.winner;
    const isP1 = winner === 'p1';
    const isP2 = winner === 'p2';
    const isTie = winner === 'tie';

    return (
      <div style={modalBackdropStyle}>
        <div style={{
          ...modalBoxStyle,
          border: `2px solid ${isP1 ? '#ff2d55' : isP2 ? '#00f0ff' : '#ffd700'}`,
          maxWidth: 540,
        }}>
          {/* Winner Title */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{
              background: isP1 ? 'rgba(255, 45, 85, 0.2)' : isP2 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 215, 0, 0.2)',
              border: `1px solid ${isP1 ? '#ff2d55' : isP2 ? '#00f0ff' : '#ffd700'}`,
              borderRadius: '50%',
              padding: 16,
            }}>
              <Crown size={38} color={isP1 ? '#ff2d55' : isP2 ? '#00f0ff' : '#ffd700'} />
            </div>
          </div>

          <h2 style={{
            fontFamily: "'Bangers', cursive",
            fontSize: 48,
            letterSpacing: 2,
            color: isP1 ? '#ff2d55' : isP2 ? '#00f0ff' : '#ffd700',
            lineHeight: 1,
            margin: '0 0 6px 0',
          }}>
            {isP1 ? 'PLAYER 1 WINS!' : isP2 ? 'PLAYER 2 WINS!' : 'HONORABLE DRAW!'}
          </h2>

          <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 24 }}>
            {isP1 ? 'Crimson Samurai takes the crown' : isP2 ? 'Azure Ninja claims victory' : 'An evenly matched clash of blades'}
          </div>

          {/* Head-to-Head Comparison */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 14,
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: 18,
            marginBottom: 26,
          }}>
            {/* P1 Column */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#ff2d55', letterSpacing: 1.5 }}>
                PLAYER 1
              </div>
              <div style={{
                fontFamily: "'Bangers', cursive",
                fontSize: 54,
                color: '#ff2d55',
                lineHeight: 1,
                margin: '6px 0',
              }}>
                {stats.duel.p1Score}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                {stats.duel.p1Slices} Slices
              </div>
            </div>

            {/* VS Divider */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 12,
              color: '#ffd700',
            }}>
              VS
            </div>

            {/* P2 Column */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#00f0ff', letterSpacing: 1.5 }}>
                PLAYER 2
              </div>
              <div style={{
                fontFamily: "'Bangers', cursive",
                fontSize: 54,
                color: '#00f0ff',
                lineHeight: 1,
                margin: '6px 0',
              }}>
                {stats.duel.p2Score}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)' }}>
                {stats.duel.p2Slices} Slices
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => onRestart('duel')}
            style={primaryBtnStyle}
          >
            <RefreshCw size={20} /> REMATCH DUEL
          </button>
        </div>
      </div>
    );
  }

  // SINGLE PLAYER GAME OVER
  const rank =
    stats.score >= 80 ? 'DOJO GRANDMASTER 🏆' :
    stats.score >= 45 ? 'MASTER NINJA ⚔️' :
    stats.score >= 20 ? 'SHADOW BLADE 🗡️' :
    'NINJA APPRENTICE 🥋';

  return (
    <div style={modalBackdropStyle}>
      <div style={{ ...modalBoxStyle, maxWidth: 440 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 2,
          color: '#e5a93c',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}>
          SESSION COMPLETE
        </div>

        <h2 style={{
          fontFamily: "'Bangers', cursive",
          fontSize: 50,
          color: '#fff',
          letterSpacing: 1.5,
          lineHeight: 1,
          margin: '0 0 16px 0',
        }}>
          GAME OVER
        </h2>

        {/* Master Score Display */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 22,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 }}>
            FINAL SCORE
          </div>
          <div style={{
            fontFamily: "'Bangers', cursive",
            fontSize: 68,
            color: '#e5a93c',
            lineHeight: 1,
            margin: '6px 0',
          }}>
            {stats.score}
          </div>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#ffd700',
            background: 'rgba(255, 215, 0, 0.1)',
            padding: '4px 12px',
            borderRadius: 6,
            display: 'inline-block',
          }}>
            RANK: {rank}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{stats.fruitsSliced}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>SLICED</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#00f0ff' }}>{stats.maxCombo}x</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>MAX COMBO</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#ff3b30' }}>{stats.bombsHit}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>BOMBS</div>
          </div>
        </div>

        {/* Play Again */}
        <button
          onClick={() => onRestart(gameMode)}
          style={primaryBtnStyle}
        >
          <RefreshCw size={20} /> PLAY AGAIN
        </button>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {(['classic', 'zen', 'meeting', 'duel'] as GameMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onRestart(mode)}
              style={{
                flex: 1,
                background: gameMode === mode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${gameMode === mode ? '#e5a93c' : 'rgba(255, 255, 255, 0.08)'}`,
                color: '#fff',
                padding: '6px 4px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(6, 9, 15, 0.88)',
  backdropFilter: 'blur(16px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: 20,
};

const modalBoxStyle: React.CSSProperties = {
  background: '#0d111a',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 16,
  width: '100%',
  padding: 32,
  textAlign: 'center',
  boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7)',
  color: '#fff',
};

const statBoxStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.04)',
  borderRadius: 10,
  padding: '10px 8px',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  background: '#e5a93c',
  color: '#000',
  border: 'none',
  borderRadius: 10,
  padding: '14px',
  fontFamily: "'Bangers', cursive",
  fontSize: 22,
  letterSpacing: 1.5,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  transition: 'transform 0.1s, opacity 0.1s',
};
