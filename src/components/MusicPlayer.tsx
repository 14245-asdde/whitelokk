import { useState, useRef, useEffect } from 'react';
import { MusicTrack } from '../types';

interface Props {
  track: MusicTrack;
  accentColor?: string;
}

export default function MusicPlayer({ track, accentColor = '#ffffff' }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const audioSrc = track.audioBase64 || track.audioUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  function formatTime(t: number): string {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function onProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div>
      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="metadata" />}

      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '13px 15px',
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        backdropFilter: 'blur(10px)',
      }}>
        {/* Cover */}
        <div style={{ flexShrink: 0, position: 'relative' }}>
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt="cover"
              style={{
                width: 54, height: 54, borderRadius: 10,
                objectFit: 'cover',
                animation: playing ? 'spin-slow 10s linear infinite' : 'none',
                boxShadow: playing ? `0 0 20px ${accentColor}40` : 'none',
                transition: 'box-shadow 0.3s',
              }}
            />
          ) : (
            <div style={{
              width: 54, height: 54, borderRadius: 10,
              background: `linear-gradient(135deg, ${accentColor}20 0%, rgba(255,255,255,0.04) 100%)`,
              border: `1px solid ${accentColor}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
              animation: playing ? 'spin-slow 10s linear infinite' : 'none',
            }}>
              ♫
            </div>
          )}
        </div>

        {/* Info + controls */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: '#fff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginBottom: 2,
          }}>
            {track.title || 'Неизвестный трек'}
          </div>
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.4)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            marginBottom: 9,
          }}>
            {track.artist || 'Исполнитель'}
          </div>

          {/* Progress bar */}
          <div
            className="progress-bar"
            onClick={onProgressClick}
            style={{ cursor: 'pointer' }}
          >
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                background: accentColor,
              }}
            />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4,
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Play button */}
        {audioSrc && (
          <button
            onClick={e => { e.stopPropagation(); togglePlay(); }}
            style={{
              flexShrink: 0,
              width: 38, height: 38, borderRadius: '50%',
              background: accentColor,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: `0 0 20px ${accentColor}40`,
            }}
          >
            {playing ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#000">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#000">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
