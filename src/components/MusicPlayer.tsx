import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MusicTrack {
  title: string;
  artist: string;
  url: string;
  coverUrl: string;
}

interface MusicPlayerProps {
  track: MusicTrack;
  accentColor?: string; // eslint-disable-line @typescript-eslint/no-unused-vars
}

export default function MusicPlayer({ track, accentColor: _accentColor = '#ffffff' }: MusicPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fmt = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onLoad = () => setDuration(audio.duration);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoad);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoad);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play().catch(() => {}); }
    setPlaying(!playing);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  return (
    <div style={{ position: 'relative' }}>
      <audio ref={audioRef} src={track.url} onEnded={() => setPlaying(false)} preload="metadata" />

      {/* Blur overlay before unlock */}
      <AnimatePresence>
        {!unlocked && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setUnlocked(true)}
            style={{
              position: 'absolute', inset: 0, zIndex: 10,
              backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
              background: 'rgba(0,0,0,0.3)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, filter: 'grayscale(1)', marginBottom: 4 }}>🎵</div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Нажми для прослушивания</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
      }}>
        {/* Cover */}
        <div style={{
          width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          background: 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {track.coverUrl
            ? <img src={track.coverUrl} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', animation: playing ? 'spin-slow 8s linear infinite' : 'none' }} />
            : <span style={{ fontSize: 20, filter: 'grayscale(1)' }}>🎵</span>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</p>

          {/* Progress */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace', minWidth: 28 }}>{fmt(currentTime)}</span>
            <div
              onClick={handleSeek}
              style={{
                flex: 1, height: 3, background: 'rgba(255,255,255,0.1)',
                borderRadius: 99, cursor: 'pointer', overflow: 'hidden', position: 'relative'
              }}
            >
              <div style={{
                height: '100%', width: `${progress}%`,
                background: '#fff', borderRadius: 99, transition: 'width 0.1s'
              }} />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'monospace', minWidth: 28, textAlign: 'right' }}>{fmt(duration)}</span>
          </div>
        </div>

        {/* Play button */}
        <button
          onClick={unlocked ? togglePlay : () => { setUnlocked(true); setTimeout(togglePlay, 100); }}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: '#fff', color: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'transform 0.15s',
          }}
        >
          {playing
            ? <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
            : <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}><polygon points="5,3 19,12 5,21"/></svg>
          }
        </button>
      </div>
    </div>
  );
}
