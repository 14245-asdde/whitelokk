import { useState, useRef, useEffect, useCallback } from 'react';
import { MusicTrack } from '../types';

interface Props {
  track: MusicTrack;
  accentColor?: string;
}

function formatTime(t: number): string {
  if (!isFinite(t) || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MusicPlayer({ track, accentColor = '#ffffff' }: Props) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const curTimeRef = useRef<HTMLSpanElement>(null);
  const durTimeRef = useRef<HTMLSpanElement>(null);
  const coverRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const audioSrc = track.audioBase64 || track.audioUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const cur = audio.currentTime;
      const dur = audio.duration;
      if (fillRef.current) {
        fillRef.current.style.width = dur ? `${(cur / dur) * 100}%` : '0%';
      }
      if (curTimeRef.current) curTimeRef.current.textContent = formatTime(cur);
    };

    const onDuration = () => {
      if (durTimeRef.current) durTimeRef.current.textContent = formatTime(audio.duration);
    };

    const onEnded = () => {
      setPlaying(false);
      if (fillRef.current) fillRef.current.style.width = '0%';
      if (curTimeRef.current) curTimeRef.current.textContent = '0:00';
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('loadedmetadata', onDuration);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('loadedmetadata', onDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Rotating cover via CSS animation class toggle
  useEffect(() => {
    const el = imgRef.current || coverRef.current;
    if (!el) return;
    if (playing) {
      el.style.animationPlayState = 'running';
    } else {
      el.style.animationPlayState = 'paused';
    }
  }, [playing]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [playing]);

  const onProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
  }, []);

  const coverStyle: React.CSSProperties = {
    width: 58, height: 58, borderRadius: 12,
    objectFit: 'cover',
    animation: 'spin-slow 12s linear infinite',
    animationPlayState: playing ? 'running' : 'paused',
    boxShadow: `0 0 24px ${accentColor}35`,
    transition: 'box-shadow 0.3s',
  };

  const coverFallbackStyle: React.CSSProperties = {
    width: 58, height: 58, borderRadius: 12,
    background: `linear-gradient(135deg, ${accentColor}22 0%, rgba(255,255,255,0.04) 100%)`,
    border: `1px solid ${accentColor}25`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22,
    animation: 'spin-slow 12s linear infinite',
    animationPlayState: playing ? 'running' : 'paused',
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="metadata" />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Cover */}
        <div style={{ flexShrink: 0 }}>
          {track.coverUrl ? (
            <img
              ref={imgRef}
              src={track.coverUrl}
              alt="cover"
              style={coverStyle}
            />
          ) : (
            <div ref={coverRef} style={coverFallbackStyle}>♫</div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: '#fff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {track.title || 'Без названия'}
          </div>
          {track.artist && (
            <div style={{
              fontSize: 11.5, color: 'rgba(255,255,255,0.4)',
              marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {track.artist}
            </div>
          )}
          {/* Animated bars when playing */}
          {playing && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, marginTop: 6, height: 12 }}>
              {[0.6, 1, 0.7, 0.9, 0.5].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: 3, borderRadius: 999,
                    background: accentColor,
                    opacity: 0.7,
                    height: `${h * 100}%`,
                    animation: `pulse-soft ${0.6 + i * 0.12}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Play button */}
        <button
          onClick={togglePlay}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: audioSrc ? accentColor : 'rgba(255,255,255,0.08)',
            border: 'none', cursor: audioSrc ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.15s, box-shadow 0.15s',
            boxShadow: audioSrc && playing ? `0 0 20px ${accentColor}50` : 'none',
          }}
          onMouseEnter={e => { if (audioSrc) e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          disabled={!audioSrc}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill={accentColor === '#ffffff' ? '#000' : '#fff'}>
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill={accentColor === '#ffffff' ? '#000' : '#fff'} style={{ marginLeft: 2 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Progress */}
      <div>
        <div
          className="progress-bar"
          onClick={onProgressClick}
          style={{ cursor: audioSrc ? 'pointer' : 'default' }}
        >
          <div ref={fillRef} className="progress-fill" style={{ width: '0%', background: accentColor }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span ref={curTimeRef} style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>0:00</span>
          <span ref={durTimeRef} style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>0:00</span>
        </div>
      </div>
    </div>
  );
}
