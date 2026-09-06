import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Send,
  Clock,
  Play,
  Pause,
  Plus,
  Volume2,
  VolumeX,
  ChevronRight,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const HeyChefModal: React.FC = () => {
  const {
    isHeyChefOpen,
    setIsHeyChefOpen,
    activeCookingRecipe,
    activeCookingStep,
    setActiveCookingStep,
    chefTimerSeconds,
    isChefTimerRunning,
    startChefTimer,
    pauseChefTimer,
    addChefTimerMins,
  } = useKitchen();

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(true);
  const [userSpeech, setUserSpeech] = useState(
    'Hey Chef, how long should I boil the tomatoes for the Rasam?'
  );
  const [chefResponse, setChefResponse] = useState(
    'Simmer the country tomatoes on medium flame for 6 to 8 minutes until skins naturally split and soften. I have initiated an active timer for 7 minutes for you.'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechAudioOn, setIsSpeechAudioOn] = useState(true);

  // Suggested Prompts from Image 19
  const suggestedPrompts = [
    { text: 'Next cooking step', desc: 'Advance recipe guide' },
    { text: 'Substitute tamarind paste', desc: 'Show ratio adjustments' },
    { text: 'Read ingredients list', desc: '3 items being rescued' },
  ];

  // Voice recognition / AI Assistant query
  const handleQuery = async (queryText: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    setUserSpeech(q);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chef/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          activeRecipe: activeCookingRecipe?.title,
          currentStep: `Step ${activeCookingStep}`,
        }),
      });
      const data = await res.json();
      setChefResponse(data.response);

      if (data.timerMinutes && data.timerMinutes > 0) {
        startChefTimer(data.timerMinutes * 60);
      }

      // Read aloud if Web Speech synthesis is available
      if (isSpeechAudioOn && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      setChefResponse(
        'Simmer the country tomatoes on medium flame for 6 to 8 minutes until skins naturally split and soften. I have initiated an active timer for 7 minutes for you.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHeyChefOpen) return null;

  const mins = Math.floor(chefTimerSeconds / 60);
  const secs = chefTimerSeconds % 60;
  const formattedTimer = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#151d20] border border-[#a1e3f9]/40 rounded-3xl shadow-2xl p-6 relative space-y-5 overflow-hidden">
        {/* Glow backdrop effect */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#a1e3f9]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#a1e3f9]/20 border border-[#a1e3f9]/40 flex items-center justify-center text-[#a1e3f9]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-white">"Hey Chef" • Active Assistant</h3>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-[#8e989b]">Hands-free kitchen voice & cooking guidance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSpeechAudioOn(!isSpeechAudioOn)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e989b] hover:text-white"
              title={isSpeechAudioOn ? 'Mute AI speech' : 'Enable AI speech'}
            >
              {isSpeechAudioOn ? <Volume2 className="w-4 h-4 text-[#a1e3f9]" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsHeyChefOpen(false)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e989b] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. Animated Audio Visualizer Waveform (Image 19) */}
        <div className="p-4 rounded-2xl bg-[#0d1518] border border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
          <span className="text-[10px] font-mono font-bold tracking-wider text-[#a1e3f9] uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Voice Input Detected (48 dB)
          </span>

          {/* Equalizer Bars Simulation */}
          <div className="flex items-center justify-center gap-1.5 h-10 w-full max-w-xs">
            {[45, 75, 30, 90, 60, 100, 70, 85, 40, 95, 55, 80, 65, 35, 90].map((height, i) => (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className="w-1.5 rounded-full bg-gradient-to-t from-[#004f5e] to-[#a1e3f9] animate-pulse"
              />
            ))}
          </div>

          <p className="text-[11px] text-[#8e989b] italic">Listening for hands-free kitchen commands...</p>
        </div>

        {/* 2. Conversation Bubbles (Image 19) */}
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
          {/* User Query Bubble */}
          <div className="flex items-start justify-end gap-2">
            <div className="p-3 rounded-2xl rounded-tr-none bg-[#1c2529] border border-white/10 text-xs text-white max-w-[85%]">
              <p className="font-medium">{userSpeech}</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1">
              You
            </div>
          </div>

          {/* AI Chef Response Bubble */}
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#a1e3f9]/20 border border-[#a1e3f9]/40 flex items-center justify-center text-[#a1e3f9] shrink-0 mt-1 font-bold text-xs">
              👨‍🍳
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-gradient-to-br from-[#1c2529] to-[#252f33] border border-[#a1e3f9]/30 text-xs text-[#dbe4e8] leading-relaxed max-w-[88%] shadow-md">
              <div className="flex items-center gap-1.5 font-bold text-[#a1e3f9] text-[11px] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chef Narayanan (AI Assistant)</span>
              </div>
              <p>{isLoading ? 'Consulting South Indian culinary engine...' : chefResponse}</p>
            </div>
          </div>
        </div>

        {/* 3. Suggested Prompts (Image 19) */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-[#8e989b] uppercase tracking-wider">Suggested Prompts:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleQuery(p.text)}
                className="p-2.5 rounded-xl bg-[#1c2529] hover:bg-[#252f33] border border-white/5 hover:border-[#a1e3f9]/30 text-left transition-all group"
              >
                <p className="text-xs font-semibold text-white group-hover:text-[#a1e3f9] line-clamp-1">{p.text}</p>
                <p className="text-[10px] text-[#8e989b] line-clamp-1 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Active Timer Widget (Image 19) */}
        <div className="p-4 rounded-2xl bg-[#1c2529] border border-[#ffb780]/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffb780]/15 border border-[#ffb780]/30 flex items-center justify-center text-[#ffb780]">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-mono text-2xl font-extrabold text-white tracking-wider">{formattedTimer}</p>
              <p className="text-[10px] text-[#ffb780] font-bold uppercase tracking-wider">Simmer Timer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={pauseChefTimer}
              className="p-2 rounded-xl bg-[#252f33] hover:bg-[#323d42] text-white transition-all"
              title="Pause/Resume Timer"
            >
              {isChefTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => addChefTimerMins(2)}
              className="px-3 py-2 rounded-xl bg-[#252f33] hover:bg-[#323d42] text-xs font-semibold text-white transition-all"
            >
              +2 min
            </button>
            <button
              onClick={() => {
                setActiveCookingStep(activeCookingStep + 1);
                setIsHeyChefOpen(false);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold transition-all flex items-center gap-1"
            >
              <span>Next Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Manual text query input fallback */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(inputQuery);
          }}
          className="flex items-center gap-2 pt-2 border-t border-white/10"
        >
          <input
            type="text"
            placeholder="Type cooking query or speak hands-free..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs placeholder-[#5a6568] focus:border-[#a1e3f9] outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
