import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Mic, MicOff, Send, Volume2, X } from 'lucide-react';

interface VoiceOrbModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteVoiceCommand: (transcript: string) => void;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const VOICE_PRESETS = [
  'Open Terminal',
  'Switch to Dark Mode',
  'Summarize my notes',
  'Open Portfolio',
];

export function speakConfirmation(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis errors in headless environments
  }
}

export const VoiceOrbModal: React.FC<VoiceOrbModalProps> = ({
  isOpen,
  onClose,
  onExecuteVoiceCommand,
}) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('Tap the orb to speak or type a voice command');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    );

  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    setTranscript('');
    setStatusMessage(
      speechSupported
        ? 'Tap the orb to speak or pick a quick voice command'
        : 'Type or choose a voice command (SpeechSynthesis read-aloud enabled)'
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, speechSupported]);

  const toggleListen = () => {
    if (!speechSupported) {
      setStatusMessage('Browser SpeechRecognition unavailable — use text input or quick commands.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechCtor = (window as unknown as Record<string, new () => SpeechRecognitionInstance>)
      .SpeechRecognition ||
      (window as unknown as Record<string, new () => SpeechRecognitionInstance>)
        .webkitSpeechRecognition;

    if (!SpeechCtor) return;

    try {
      const recognition = new SpeechCtor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const latest = event.results[event.results.length - 1]?.[0]?.transcript ?? '';
        setTranscript(latest);
        if (latest.trim()) {
          setStatusMessage(`Heard: "${latest.trim()}"`);
        }
      };
      recognition.onerror = () => {
        setListening(false);
        setStatusMessage('Microphone permission denied or unavailable. Type a command below.');
      };
      recognition.onend = () => {
        setListening(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setStatusMessage('Listening...');
    } catch {
      setListening(false);
      setStatusMessage('Could not start microphone capture.');
    }
  };

  const submitCommand = (cmdText: string) => {
    const clean = cmdText.trim();
    if (!clean) return;
    onExecuteVoiceCommand(clean);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="voice-orb-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-[9450] flex items-start justify-end pt-9 pr-4 bg-black/15"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-label="Siri Voice Control"
            initial={{ opacity: 0, scale: 0.94, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="w-80 overflow-hidden rounded-2xl border border-black/15 dark:border-white/18 bg-white/88 dark:bg-slate-900/92 p-4 shadow-[0_24px_54px_rgba(0,0,0,0.36)] macos-glass-heavy text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <Volume2 className="h-3.5 w-3.5 text-sky-500" />
                <span>Voice Control</span>
              </span>
              <button
                type="button"
                aria-label="Close Voice Control"
                onClick={onClose}
                className="rounded-md p-1 text-slate-400 hover:bg-black/6 dark:hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Voice Orb */}
            <div className="my-4 flex flex-col items-center">
              <button
                type="button"
                aria-label={listening ? 'Stop listening' : 'Start voice listening'}
                onClick={toggleListen}
                className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                  listening
                    ? 'bg-gradient-to-tr from-sky-500 via-indigo-500 to-teal-400 ring-4 ring-sky-400/40'
                    : 'bg-gradient-to-tr from-slate-800 via-sky-700 to-indigo-600'
                }`}
              >
                {listening ? <Mic className="h-7 w-7" /> : <MicOff className="h-6 w-6 opacity-90" />}
              </button>
              <p className="mt-2.5 text-center text-xs text-slate-600 dark:text-slate-300">
                {statusMessage}
              </p>
            </div>

            {/* Text / Transcript Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitCommand(transcript);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder='Say or type "Open Terminal"...'
                aria-label="Voice command transcript"
                className="min-w-0 flex-1 rounded-lg border border-black/12 dark:border-white/15 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1.5 text-xs outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                aria-label="Run voice command"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white hover:bg-sky-500"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* Quick Voice Command Chips */}
            <div className="mt-3 border-t border-black/8 dark:border-white/10 pt-2.5">
              <div className="mb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Quick Voice Commands
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {VOICE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => submitCommand(preset)}
                    className="truncate rounded-lg border border-black/8 dark:border-white/10 bg-black/4 dark:bg-white/6 px-2 py-1.5 text-left text-[11px] font-medium hover:bg-sky-500/15"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
