import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

type FormatAction = {
  label: string;
  icon: string;
  action: (sel: string, full: string, start: number, end: number) => { text: string; cursor?: number };
};

const FORMATS: FormatAction[] = [
  {
    label: 'Жирный',
    icon: 'B',
    action: (sel) => ({ text: `**${sel || 'текст'}**` }),
  },
  {
    label: 'Курсив',
    icon: 'I',
    action: (sel) => ({ text: `_${sel || 'текст'}_` }),
  },
  {
    label: 'Зачёркнутый',
    icon: 'S',
    action: (sel) => ({ text: `~~${sel || 'текст'}~~` }),
  },
  {
    label: 'Заголовок 1',
    icon: 'H1',
    action: (sel) => ({ text: `# ${sel || 'Заголовок'}` }),
  },
  {
    label: 'Заголовок 2',
    icon: 'H2',
    action: (sel) => ({ text: `## ${sel || 'Заголовок'}` }),
  },
  {
    label: 'Заголовок 3',
    icon: 'H3',
    action: (sel) => ({ text: `### ${sel || 'Заголовок'}` }),
  },
  {
    label: 'Ссылка',
    icon: '🔗',
    action: (sel) => ({ text: `[${sel || 'текст'}](https://)` }),
  },
  {
    label: 'Код',
    icon: '</>',
    action: (sel) => ({ text: `\`${sel || 'код'}\`` }),
  },
  {
    label: 'Блок кода',
    icon: '{ }',
    action: (sel) => ({ text: `\`\`\`\n${sel || 'код'}\n\`\`\`` }),
  },
  {
    label: 'Цитата',
    icon: '"',
    action: (sel) => ({ text: `> ${sel || 'цитата'}` }),
  },
  {
    label: 'Список',
    icon: '≡',
    action: (sel) => ({ text: `- ${sel || 'элемент'}` }),
  },
  {
    label: 'Разделитель',
    icon: '—',
    action: () => ({ text: '\n---\n' }),
  },
];

export default function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  function applyFormat(fmt: FormatAction) {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const result = fmt.action(selected, value, start, end);

    const newVal = value.slice(0, start) + result.text + value.slice(end);
    onChange(newVal);

    setTimeout(() => {
      ta.focus();
      const newPos = start + result.text.length;
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4,
        padding: '6px 8px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.07)'
      }}>
        {FORMATS.map((fmt) => (
          <button
            key={fmt.label}
            onClick={() => applyFormat(fmt)}
            title={fmt.label}
            style={{
              padding: '3px 8px',
              borderRadius: 5,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              transition: 'all 0.15s',
              minWidth: 28,
              textAlign: 'center'
            }}
          >
            {fmt.icon}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            className={`tab-btn ${tab === 'edit' ? 'active' : ''}`}
            style={{ fontSize: 11, padding: '3px 10px' }}
            onClick={() => setTab('edit')}
          >
            Редактор
          </button>
          <button
            className={`tab-btn ${tab === 'preview' ? 'active' : ''}`}
            style={{ fontSize: 11, padding: '3px 10px' }}
            onClick={() => setTab('preview')}
          >
            Просмотр
          </button>
        </div>
      </div>

      {tab === 'edit' ? (
        <textarea
          ref={textareaRef}
          className="input-dark"
          style={{ minHeight: 120, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
          placeholder={placeholder || 'Напиши что-нибудь...'}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <div className="glass" style={{ borderRadius: 8, padding: 12, minHeight: 80 }}>
          {value ? (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Пусто...</div>
          )}
        </div>
      )}
    </div>
  );
}
