import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameMode, GameSettings, GameStats } from './game/types';
import { HUD } from './components/HUD';
import { SettingsModal } from './components/SettingsModal';
import { OBSGuideModal } from './components/OBSGuideModal';
import { GameOverModal } from './components/GameOverModal';
import { Swords, Play, ShieldAlert, Sparkles, Users, User, Video, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App & Game States
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOBSGuideOpen, setIsOBSGuideOpen] = useState<boolean>(false);
  const [isStreamMode, setIsStreamMode] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>('classic');

  const [stats, setStats] = useState<GameStats>({
    score: 0,
    strikes: 0,
    maxStrikes: 3,
    combo: 0,
    maxCombo: 0,
    fruitsSliced: 0,
    bombsHit: 0,
    timeLeft: 90,
    playersDetected: 0,
    duel: {
      p1Score: 0,
      p2Score: 0,
      p1Slices: 0,
      p2Slices: 0,
      p1Combo: 0,
      p2Combo: 0,
      winner: null,
    },
  });

  const [highScores, setHighScores] = useState<Record<GameMode, number>>(() => {
    try {
      const saved = localStorage.getItem('fruit_ninja_highscores');
      return saved ? JSON.parse(saved) : { classic: 0, zen: 0, meeting: 0, duel: 0 };
    } catch {
      return { classic: 0, zen: 0, meeting: 0, duel: 0 };
    }
  });

  const [settings, setSettings] = useState<GameSettings>({
    bladeColor: 'crimson',
    sliceSensitivity: 1.1,
    soundEnabled: true,
    sfxVolume: 0.8,
    mirrorCamera: true,
    cameraFilter: 'normal',
    streamOverlayMode: false,
    twoHandsEnabled: true,
    showWebcamFeed: true,
    gameMode: 'classic',
  });

  const [trackerStatus, setTrackerStatus] = useState<'loading' | 'ready' | 'error' | 'no-camera'>('loading');
  const [trackerMessage, setTrackerMessage] = useState<string>('Initializing AI Hand Tracking...');

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isStreamParam = urlParams.get('stream') === 'true';
    if (isStreamParam) {
      setIsStreamMode(true);
      setSettings(prev => ({ ...prev, streamOverlayMode: true }));
    }

    const engine = new GameEngine(canvasRef.current, videoRef.current, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
        setHighScores((prev) => {
          const currentModeScore = gameMode === 'duel'
            ? Math.max(newStats.duel.p1Score, newStats.duel.p2Score)
            : newStats.score;

          if (currentModeScore > (prev[gameMode] || 0)) {
            const updated = { ...prev, [gameMode]: currentModeScore };
            try {
              localStorage.setItem('fruit_ninja_highscores', JSON.stringify(updated));
            } catch {
              // Ignore
            }
            return updated;
          }
          return prev;
        });
      },
      onGameOver: (finalStats) => {
        setStats(finalStats);
        setIsGameOver(true);
      },
      onTrackerStatus: (status, message) => {
        setTrackerStatus(status);
        if (message) setTrackerMessage(message);
      },
    });

    engineRef.current = engine;

    engine.initialize().then(() => {
      if (isStreamParam) {
        setHasStarted(true);
        engine.startGame('meeting');
      }
    });

    return () => {
      engine.destroy();
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 's' || e.key === 'S') {
        toggleStreamMode();
      } else if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsOBSGuideOpen(false);
      } else if ((e.key === ' ' || e.key === 'r' || e.key === 'R') && isGameOver) {
        handleStart(gameMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameOver, gameMode, settings.soundEnabled, isStreamMode]);

  const handleStart = (mode: GameMode = gameMode) => {
    setGameMode(mode);
    setHasStarted(true);
    setIsGameOver(false);
    setIsSettingsOpen(false);
    setIsOBSGuideOpen(false);
    engineRef.current?.startGame(mode);
  };

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      engineRef.current?.updateSettings(updated);
      return updated;
    });
  };

  const toggleMute = () => {
    handleUpdateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const toggleStreamMode = () => {
    const next = !isStreamMode;
    setIsStreamMode(next);
    handleUpdateSettings({ streamOverlayMode: next });
  };

  const MODES: { id: GameMode; title: string; subtitle: string; badge: string; accent: string }[] = [
    {
      id: 'classic',
      title: 'Classic Dojo',
      subtitle: '3 Strikes, lethal bombs, rapid waves',
      badge: 'SOLO',
      accent: '#ff3b30',
    },
    {
      id: 'zen',
      title: 'Zen Sanctuary',
      subtitle: '90s serene fruit flow, zero bombs',
      badge: 'FLOW',
      accent: '#00f0ff',
    },
    {
      id: 'meeting',
      title: 'Meeting Filter',
      subtitle: 'Casual streaming filter for Zoom/Discord',
      badge: 'STREAM',
      accent: '#39ff14',
    },
    {
      id: 'duel',
      title: '2-Player Duel',
      subtitle: '60s battle! Left vs Right arena contest',
      badge: 'VERSUS',
      accent: '#ffd700',
    },
  ];

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#080b12' }}>
      {/* Hidden Video for MediaPipe Computer Vision */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {/* Primary 60FPS Game & Camera Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: trackerStatus === 'ready' ? 'none' : 'crosshair',
        }}
      />

      {/* In-Game HUD Overlay */}
      {hasStarted && !isGameOver && (
        <HUD
          stats={stats}
          highScore={highScores[gameMode] || 0}
          gameMode={gameMode}
          isStreamMode={isStreamMode}
          isMuted={!settings.soundEnabled}
          trackerStatus={trackerStatus}
          trackerMessage={trackerMessage}
          onToggleMute={toggleMute}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenOBSGuide={() => setIsOBSGuideOpen(true)}
          onToggleStreamMode={toggleStreamMode}
          onRestart={() => handleStart(gameMode)}
        />
      )}

      {/* Handcrafted Intro Screen */}
      {!hasStarted && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(7, 10, 16, 0.88)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          padding: 24,
        }}>
          <div style={{
            background: '#0d111a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            padding: '40px 48px',
            maxWidth: 680,
            width: '100%',
            boxShadow: '0 28px 80px rgba(0, 0, 0, 0.8)',
            color: '#fff',
          }}>
            {/* Crest & Title */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(229, 169, 60, 0.12)',
                border: '1px solid rgba(229, 169, 60, 0.35)',
                color: '#e5a93c',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 2,
                padding: '4px 14px',
                borderRadius: 20,
                marginBottom: 14,
                textTransform: 'uppercase',
              }}>
                <Swords size={14} /> AI VISION ARCADE
              </div>

              <h1 style={{
                fontFamily: "'Bangers', cursive",
                fontSize: 60,
                letterSpacing: 2,
                color: '#ffffff',
                lineHeight: 1,
                margin: '0 0 10px 0',
                textShadow: '0 4px 20px rgba(0,0,0,0.8)',
              }}>
                WEBCAM FRUIT NINJA
              </h1>
              <p style={{
                fontSize: 15,
                color: 'rgba(255, 255, 255, 0.65)',
                fontWeight: 500,
                margin: 0,
              }}>
                Slice with your bare hands. Stream live to Zoom, Discord, and Google Meet.
              </p>
            </div>

            {/* 2-Player Detection Notice */}
            {stats.playersDetected === 2 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255, 215, 0, 0.12)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                borderRadius: 10,
                padding: '10px 16px',
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 800,
                color: '#ffd700',
              }}>
                <Users size={18} />
                <span>2 Players Detected! Select 2-Player Duel for a head-to-head clash.</span>
              </div>
            )}

            {/* Mode Select Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28 }}>
              {MODES.map((m) => {
                const isSelected = gameMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setGameMode(m.id)}
                    style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1.5px solid ${isSelected ? m.accent : 'rgba(255, 255, 255, 0.08)'}`,
                      borderLeft: `4px solid ${m.accent}`,
                      borderRadius: 12,
                      padding: '14px 16px',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                        {m.title}
                      </span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 900,
                        letterSpacing: 1,
                        color: m.accent,
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}>
                        {m.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.3 }}>
                      {m.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Launch Button */}
            <button
              onClick={() => handleStart(gameMode)}
              style={{
                width: '100%',
                background: gameMode === 'duel' ? '#ffd700' : '#e5a93c',
                color: '#000',
                border: 'none',
                borderRadius: 12,
                padding: '16px',
                fontFamily: "'Bangers', cursive",
                fontSize: 24,
                letterSpacing: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 8px 24px rgba(229, 169, 60, 0.3)',
                transition: 'transform 0.1s, opacity 0.1s',
              }}
            >
              <Play size={22} fill="#000" />
              {gameMode === 'duel' ? 'START 2-PLAYER DUEL' : 'ENTER THE DOJO'}
            </button>

            {/* Footer Status & Hotkeys */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 22,
              paddingTop: 16,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.45)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: trackerStatus === 'ready' ? '#39ff14' : '#ffd700',
                }} />
                <span>{trackerMessage}</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span><kbd style={kbdStyle}>S</kbd> Stream Mode</span>
                <span><kbd style={kbdStyle}>M</kbd> Mute</span>
                <span><kbd style={kbdStyle}>R</kbd> Restart</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
      />

      <OBSGuideModal
        isOpen={isOBSGuideOpen}
        onClose={() => setIsOBSGuideOpen(false)}
        onToggleStreamMode={toggleStreamMode}
      />

      <GameOverModal
        isOpen={isGameOver}
        stats={stats}
        highScore={highScores[gameMode] || 0}
        gameMode={gameMode}
        onRestart={(mode) => handleStart(mode || gameMode)}
      />
    </div>
  );
};

const kbdStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 4,
  padding: '1px 5px',
  fontSize: 10,
  fontFamily: 'monospace',
  color: '#fff',
};
