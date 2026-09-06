import React, { useState } from 'react';
import {
  ArrowLeft,
  Mic,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Maximize2,
  Flame,
  Scale,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Quote,
  Clock,
  Info,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';

export const LiveCookingView: React.FC = () => {
  const {
    activeCookingRecipe,
    activeCookingStep,
    setActiveCookingStep,
    setActiveScreen,
    setIsHeyChefOpen,
    completeCookingSession,
  } = useKitchen();

  const recipe = activeCookingRecipe || {
    id: 'tangy-tomato-rasam',
    title: 'Tangy Tomato Rasam',
    subtitle: '(Lemon Infused)',
    rescueWeight: '560g',
    moneySaved: '₹185',
    steps: [],
  };

  const [cameraView, setCameraView] = useState<'overhead' | 'front'>('overhead');
  const [isPlaying, setIsPlaying] = useState(true);
  const [burner2Temp, setBurner2Temp] = useState(160);

  const steps = recipe.steps.length > 0 ? recipe.steps : [
    {
      stepNumber: 1,
      title: 'Prep & Country Tomato Mash',
      duration: '4 min',
      instructions: ['Coarsely chop tomatoes and boil in seasoned water until skins soften.'],
    },
    {
      stepNumber: 2,
      title: 'Spice Infusion & Crushed Pepper-Cumin',
      duration: '3 min',
      instructions: ['Add freshly crushed black pepper and cumin to the simmering broth.'],
    },
    {
      stepNumber: 3,
      title: 'Simmer Broth & Lemon Adjustment',
      duration: '5 min',
      instructions: ['Simmer gently and adjust with lemon juice and jaggery.'],
    },
    {
      stepNumber: 4,
      title: 'Pour Sizzling Tadka & Fold in Fresh Coriander',
      duration: '2 min',
      badge: 'Aroma Infusion',
      aiPreservationRule: 'AI Aroma Preservation Rule: Tadka essential oils vaporize instantly. Keep pot lid ready before pouring!',
      instructions: [
        'Reheat the small brass tadka pan with mustard seeds, curry leaves, and a pinch of hing (asafoetida) until intensely fragrant.',
        'Pour the crackling tadka directly into the steaming rasam pot. Cover immediately with a lid for 30 seconds to trap the volatile essential oils and aroma.',
        'Uncover and generously scatter 2 tbsp finely chopped fresh coriander leaves (stems included for maximum punch) across the surface. Do NOT boil further.',
      ],
      ingredientsForStep: [
        { name: 'Fresh Coriander Leaves', quantity: '2 tbsp chopped', isRescued: true, note: 'Rescued • Crisper 1 (12h left)' },
        { name: 'Curry Leaves Tempering', quantity: 'Pre-sizzled in sesame', note: 'Active from Step 2' },
        { name: 'Mustard Seeds & Hing', quantity: '1/2 tsp each' },
      ],
    },
    {
      stepNumber: 5,
      title: 'Final Rest & Ladle Service',
      duration: '2 min',
      badge: 'Serve',
      instructions: [
        'Let the rasam rest covered for 2 minutes to homogenize temperatures.',
        'Ladle steaming hot over hot Sona Masoori rice or sip directly from an earthen tumbler.',
      ],
    },
  ];

  const currentStepData = steps[activeCookingStep - 1] || steps[3] || steps[0];

  const handleNext = () => {
    if (activeCookingStep < steps.length) {
      setActiveCookingStep(activeCookingStep + 1);
    } else {
      completeCookingSession(recipe as any);
    }
  };

  const handlePrev = () => {
    if (activeCookingStep > 1) {
      setActiveCookingStep(activeCookingStep - 1);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Top Bar (Image 7) */}
      <div className="p-3 rounded-2xl bg-[#151d20] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className="flex items-center gap-1 text-[#8e989b] hover:text-white font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#a1e3f9] tracking-wider">
                Smart Shelf • Live Session
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                Tadka Sizzled
              </span>
            </div>
            <h2 className="font-display text-sm font-bold text-white">
              {recipe.title} {recipe.subtitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden md:inline text-[11px] text-[#8e989b]">
            Rescuing 4 Items ({recipe.rescueWeight || '560g'}) • Step {activeCookingStep} of {steps.length}
          </span>
          <button
            onClick={() => setIsHeyChefOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c2529] hover:bg-[#252f33] border border-[#a1e3f9]/40 text-[#a1e3f9] text-xs font-bold transition-all"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>"Hey Chef" Active</span>
          </button>
        </div>
      </div>

      {/* 2. Active Substitution Applied Banner (Image 7) */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-[#1c2529] via-[#232b2e] to-[#1c2529] border border-[#ffb780]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ffb780] shrink-0" />
          <div>
            <strong className="text-white">Active Substitution Applied:</strong>{' '}
            <span className="text-[#bfc8cc]">
              Fresh Lemon Juice + 1/4 tsp Jaggery substituted for Tamarind Paste
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffb780]/20 text-[#ffb780] font-mono font-semibold">
            Rescuing 1 Lemon (Crisper • 48h left)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-[#a1e3f9] font-mono">
            AI Recipe Adapter Live
          </span>
        </div>
      </div>

      {/* 3. Main Split View: Left (Video & Sensors) | Right (Flow & Steps) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Live Stove Simulation & Sensors (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Simulated HD Live Cook Cam */}
          <div className="relative rounded-2xl bg-[#0a0f12] border border-white/10 overflow-hidden shadow-2xl aspect-video flex flex-col justify-between p-4 group">
            {/* Ambient Background Simulation */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700"
              style={{
                backgroundImage:
                  cameraView === 'overhead'
                    ? 'url(https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&auto=format&fit=crop&q=80)'
                    : 'url(https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&auto=format&fit=crop&q=80)',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60" />
              {/* Simulated Steam Effect */}
              <div className="absolute inset-0 bg-radial from-white/10 via-transparent to-transparent opacity-60 animate-pulse pointer-events-none" />
            </div>

            {/* Video Overlay Top Controls */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-mono text-xs font-bold text-white tracking-wider">
                  STEP {activeCookingStep} OF {steps.length} • LIVE STOVE CAM
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-[#a1e3f9] font-mono">
                  HD 4K • 60 FPS
                </span>
              </div>

              {/* Angle toggles */}
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setCameraView('overhead')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    cameraView === 'overhead' ? 'bg-[#a1e3f9] text-[#003642]' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Overhead
                </button>
                <button
                  onClick={() => setCameraView('front')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    cameraView === 'front' ? 'bg-[#a1e3f9] text-[#003642]' : 'text-white hover:bg-white/10'
                  }`}
                >
                  Stove Front
                </button>
              </div>
            </div>

            {/* Chef Narayanan Quote Box (Image 7) */}
            <div className="relative z-10 max-w-lg p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/15 text-xs text-[#dbe4e8] space-y-1">
              <div className="flex items-center gap-1.5 text-[#ffb780] font-bold">
                <Quote className="w-3.5 h-3.5" />
                <span>Chef Narayanan:</span>
              </div>
              <p className="italic text-[11px] leading-relaxed">
                "The moment that sizzling tadka hits the pot, slam that lid down for half a minute! That's how South
                Indian grandmothers trap that heavenly rasam fragrance."
              </p>
            </div>

            {/* Video Controls Timeline Bar */}
            <div className="relative z-10 flex items-center justify-between bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-lg bg-[#a1e3f9] text-[#003642] flex items-center justify-center font-bold"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setActiveCookingStep(1)}
                  className="text-xs text-[#8e989b] hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Step</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#bfc8cc]">
                <span className="font-mono">01:42 / 02:00</span>
                <Volume2 className="w-4 h-4 text-[#8e989b]" />
                <Maximize2 className="w-4 h-4 text-[#8e989b]" />
              </div>
            </div>
          </div>

          {/* IoT Smart Sensors Row (Image 7) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-[#1c2529] border border-white/5">
              <p className="text-[10px] text-[#8e989b]">Burner 1 (Rasam Pot)</p>
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-[#ffb780]" />
                <span>Off • Residual Heat</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1c2529] border border-white/5">
              <p className="text-[10px] text-[#8e989b]">Burner 2 (Tadka Pan)</p>
              <p className="text-xs font-bold text-rose-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>160°C Hot Sizzle</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1c2529] border border-white/5">
              <p className="text-[10px] text-[#8e989b]">Pot Scale</p>
              <p className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>640g / target 650g</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1c2529] border border-white/5 flex flex-col justify-between">
              <p className="text-[10px] text-[#8e989b]">IoT Hardware</p>
              <span className="text-[11px] font-mono font-bold text-[#a1e3f9]">Connected ✓</span>
            </div>
          </div>
        </div>

        {/* Right Side: Step Flow & Active Step Details (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Progress Overview Bar */}
          <div className="p-4 rounded-2xl bg-[#1c2529] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Recipe Flow</span>
              <span className="font-mono text-[#a1e3f9] font-bold">
                {Math.round((activeCookingStep / steps.length) * 100)}% Completed
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-[#151d20] overflow-hidden">
              <div
                style={{ width: `${(activeCookingStep / steps.length) * 100}%` }}
                className="h-full bg-gradient-to-r from-[#004f5e] to-[#a1e3f9] transition-all duration-300"
              />
            </div>

            {/* Micro steps pills */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {steps.map((s) => (
                <button
                  key={s.stepNumber}
                  onClick={() => setActiveCookingStep(s.stepNumber)}
                  className={`py-1 rounded text-center text-[10px] font-mono font-bold transition-all ${
                    s.stepNumber === activeCookingStep
                      ? 'bg-[#a1e3f9] text-[#003642]'
                      : s.stepNumber < activeCookingStep
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-[#151d20] text-[#8e989b]'
                  }`}
                >
                  Step {s.stepNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Active Step Card (Image 7 Step 4) */}
          <div className="p-5 rounded-2xl bg-[#1c2529] border border-[#a1e3f9]/30 space-y-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-[#a1e3f9] uppercase tracking-wider">
                  Active Step {activeCookingStep} of {steps.length}
                </span>
                {currentStepData.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#a1e3f9]/20 text-[#a1e3f9] font-mono font-bold">
                    {currentStepData.badge}
                  </span>
                )}
              </div>

              <h3 className="font-display text-lg font-bold text-white">
                {currentStepData.title}
              </h3>
              <p className="text-xs text-[#8e989b] flex items-center gap-1 mt-1">
                <Clock className="w-3.5 h-3.5" /> Estimated duration: {currentStepData.duration}
              </p>
            </div>

            {/* AI Aroma Preservation Rule Callout (Image 7) */}
            {currentStepData.aiPreservationRule && (
              <div className="p-3 rounded-xl bg-[#151d20] border border-[#a1e3f9]/20 flex items-start gap-2.5 text-xs">
                <Sparkles className="w-4 h-4 text-[#a1e3f9] shrink-0 mt-0.5" />
                <p className="text-[#a1e3f9] leading-relaxed">
                  {currentStepData.aiPreservationRule}
                </p>
              </div>
            )}

            {/* Detailed Instructions List */}
            <div className="space-y-2.5">
              {currentStepData.instructions.map((inst, i) => (
                <div key={i} className="flex items-start gap-3 text-xs text-[#dbe4e8]">
                  <span className="w-5 h-5 rounded-full bg-[#232b2e] border border-white/10 text-[#a1e3f9] font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed">{inst}</p>
                </div>
              ))}
            </div>

            {/* Ingredients for this step */}
            {currentStepData.ingredientsForStep && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                <p className="text-[10px] text-[#8e989b] uppercase font-bold tracking-wider">
                  Ingredients for this step:
                </p>
                <div className="space-y-1.5">
                  {currentStepData.ingredientsForStep.map((ing, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-[#151d20] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{ing.name}</span>
                        {ing.isRescued && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                            Rescued
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-white text-xs">{ing.quantity}</span>
                        {ing.note && <p className="text-[10px] text-[#8e989b]">{ing.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step Progression Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
              <button
                onClick={handlePrev}
                disabled={activeCookingStep <= 1}
                className="px-4 py-2 rounded-xl bg-[#232b2e] hover:bg-[#2e373b] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>

              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-[#a1e3f9]/20"
              >
                <span>
                  {activeCookingStep < steps.length
                    ? `Next: ${steps[activeCookingStep]?.title || `Step ${activeCookingStep + 1}`} >`
                    : 'Complete Cooking & Log Rescue'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
