import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const SYSTEM_BADGES: Record<string, { name: string; emoji: string; description: string; adminOnly?: boolean }> = {
  admin: { name: 'Администратор', emoji: '👑', description: 'Администратор платформы', adminOnly: true },
  moderator: { name: 'Модератор', emoji: '🛡️', description: 'Модератор платформы', adminOnly: true },
  coder: { name: 'Разработчик', emoji: '💻', description: 'Разработчик платформы', adminOnly: true },
  verified: { name: 'Подтверждён', emoji: '✅', description: 'Подтверждённый аккаунт' },
  og: { name: 'OG', emoji: '⭐', description: 'Один из первых пользователей' },
  views_100: { name: '100 просмотров', emoji: '👁', description: 'Получено 100 просмотров профиля' },
  views_500: { name: '500 просмотров', emoji: '🔥', description: 'Получено 500 просмотров профиля' },
  views_1000: { name: '1К просмотров', emoji: '💎', description: 'Получено 1000 просмотров профиля' },
  views_5000: { name: '5К просмотров', emoji: '🚀', description: 'Получено 5000 просмотров профиля' },
  views_10000: { name: '10К просмотров', emoji: '🌟', description: 'Получено 10000 просмотров профиля' },
};

interface BadgeItemProps {
  badgeId: string;
  customBadge?: { name: string; emoji: string; imageUrl?: string; description: string };
}

export default function BadgeItem({ badgeId, customBadge }: BadgeItemProps) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const badge = customBadge || SYSTEM_BADGES[badgeId];
  if (!badge) return null;

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
    setHovered(true);
  };

  const tooltip = hovered ? createPortal(
    <AnimatePresence>
      <motion.div
        key={badgeId}
        initial={{ opacity: 0, y: 6, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.9 }}
        transition={{ duration: 0.12 }}
        style={{
          position: 'fixed',
          left: tooltipPos.x,
          top: tooltipPos.y,
          transform: 'translate(-50%, -100%)',
          zIndex: 99999,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{
          background: 'rgba(10,10,10,0.97)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 10,
          padding: '7px 12px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}>
          <p style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: 0 }}>{badge.name}</p>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2, margin: '2px 0 0' }}>{badge.description}</p>
        </div>
        <div style={{
          width: 8, height: 8,
          background: 'rgba(10,10,10,0.97)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderTop: 'none', borderLeft: 'none',
          transform: 'rotate(45deg)',
          margin: '-4px auto 0',
          position: 'relative',
          zIndex: -1,
        }} />
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <div
        ref={ref}
        style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          width: 30, height: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 8,
          background: hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${hovered ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`,
          transition: 'all 0.15s',
          filter: 'grayscale(1)',
          fontSize: 15,
          transform: hovered ? 'scale(1.15) translateY(-1px)' : 'scale(1)',
        }}>
          {customBadge?.imageUrl
            ? <img src={customBadge.imageUrl} alt={badge.name} style={{ width: 18, height: 18, objectFit: 'cover', borderRadius: 4 }} />
            : <span style={{ lineHeight: 1 }}>{badge.emoji}</span>
          }
        </div>
      </div>
      {tooltip}
    </>
  );
}
