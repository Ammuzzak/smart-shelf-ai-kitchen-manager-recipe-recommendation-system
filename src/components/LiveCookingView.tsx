import React, { useState } from 'react';
import {
  ArrowLeft,
  Mic,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Flame,
  Scale,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Quote,
  Clock,
  VideoOff,
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
    setToastMessage,
  } = useKitchen();

  const recipe = activeCookingRecipe || {
    id: 'tangy-tomato-rasam',
    title: 'Tangy Tomato Rasam',
    subtitle: '(Lemon Infused)',
    rescueWeight: '560g',
    moneySaved: '₹185',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&auto=format&fit=crop&q=80',
    steps: [],
  };

  const [cameraView, setCameraView] = useState<'overhead' | 'front'>('overhead');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const steps = recipe.steps && recipe.steps.length > 0 ? recipe.steps : [
    {
      stepNumber: 1,
      title: 'Prep & Measure Ingredients',
      duration: '3 min',
      instructions: ['Rinse and cut your fresh ingredients according to recipe portions.'],
    },
    {
      stepNumber: 2,
      title: 'Cook & Blend Base',
      duration: '4 min',
      instructions: ['Combine ingredients in cookware or blender as indicated.'],
    },
    {
      stepNumber: 3,
      title: 'Seasoning & Serving',
      duration: '3 min',
      instructions: ['Finish seasoning and serve hot or chilled immediately.'],
    },
  ];

  const currentStepData = steps[activeCookingStep - 1] || steps[0];

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

  const videoUrl = recipe.videoUrl;

  return (
    <div className={`space-y-4 pb-20 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0d1518] p-6 overflow-y-auto' : ''}`}>
      {/* 1. Top Bar */}
      <div className="p-3 rounded-2xl bg-[#151d20] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (isFullscreen) setIsFullscreen(false);
              setActiveScreen('dashboard');
            }}
            className="flex items-center gap-1 text-[#8e989b] hover:text-white font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#a1e3f9] tracking-wider">
                Smart Shelf • Live Cooking
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                Step {activeCookingStep} of {steps.length}
              </span>
            </div>
            <h2 className="font-display text-sm font-bold text-white">
              {recipe.title} {recipe.subtitle || ''}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden md:inline text-[11px] text-[#8e989b]">
            Saves {recipe.rescueWeight || '350g'} • {recipe.moneySaved || '₹80'}
          </span>
          <button
            onClick={() => setIsHeyChefOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c2529] hover:bg-[#252f33] border border-[#a1e3f9]/40 text-[#a1e3f9] text-xs font-bold transition-all cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span>Ask Chef (Voice)</span>
          </button>
        </div>
      </div>

      {/* 2. Main Split View: Left (Video & Sensors) | Right (Flow & Steps) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Live Stove Simulation & Video (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Video or Live Simulation Player */}
          <div className="relative rounded-2xl bg-[#0a0f12] border border-white/10 overflow-hidden shadow-2xl aspect-video flex flex-col justify-between group">
            {videoUrl ? (
              // Embedded YouTube video player with valid embed controls
              <iframe
                src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1&mute=${isMuted ? 1 : 0}`}
                title={recipe.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0 absolute inset-0"
              />
            ) : (
              // HD Kitchen Cam simulation using the actual recipe image
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                  style={{
                    backgroundImage: `url(${recipe.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&auto=format&fit=crop&q=80'})`,
                    filter: isPlaying ? 'brightness(0.95)' : 'brightness(0.6)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/60" />
                </div>

                {/* Video Overlay Top Controls */}
                <div className="relative z-10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="font-mono text-xs font-bold text-white tracking-wider">
                      STEP {activeCookingStep} OF {steps.length} • KITCHEN CAM
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-[#a1e3f9] font-mono">
                      LIVE • 60 FPS
                    </span>
                  </div>

                  {/* Angle toggles */}
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setCameraView('overhead')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        cameraView === 'overhead' ? 'bg-[#a1e3f9] text-[#003642]' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      Overhead
                    </button>
                    <button
                      onClick={() => setCameraView('front')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        cameraView === 'front' ? 'bg-[#a1e3f9] text-[#003642]' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      Stove Front
                    </button>
                  </div>
                </div>

                {/* Chef Tip / Quote Box */}
                <div className="relative z-10 mx-4 max-w-lg p-3 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-xs text-[#dbe4e8] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#ffb780] font-bold">
                    <Quote className="w-3.5 h-3.5" />
                    <span>Chef Narayanan:</span>
                  </div>
                  <p className="italic text-[11px] leading-relaxed">
                    {currentStepData.aiPreservationRule ||
                      'Cook gently on medium flame to retain full aroma and prevent nutrient loss.'}
                  </p>
                </div>

                {/* Video Controls Timeline Bar */}
                <div className="relative z-10 m-4 flex items-center justify-between bg-black/85 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsPlaying(!isPlaying);
                        setToastMessage(isPlaying ? 'Video simulation paused' : 'Video simulation resumed');
                      }}
                      className="w-8 h-8 rounded-lg bg-[#a1e3f9] text-[#003642] flex items-center justify-center font-bold cursor-pointer"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setActiveCookingStep(1);
                        setToastMessage('Restarted from Step 1');
                      }}
                      className="text-xs text-[#8e989b] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart Step</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#bfc8cc]">
                    <span className="font-mono">{currentStepData.duration}</span>
                    <button
                      onClick={() => {
                        setIsMuted(!isMuted);
                        setToastMessage(isMuted ? 'Audio unmuted' : 'Audio muted');
                      }}
                      className="hover:text-white transition-all cursor-pointer p-1"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#a1e3f9]" />}
                    </button>
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="hover:text-white transition-all cursor-pointer p-1"
                      title="Toggle Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4 text-[#8e989b] hover:text-white" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sensors Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => setToastMessage('Burner 1: Medium Heat (Optimal for cooking)')}
              className="p-3 rounded-xl bg-[#1c2529] hover:bg-[#252f33] border border-white/5 text-left transition-all cursor-pointer"
            >
              <p className="text-[10px] text-[#8e989b]">Stove Burner</p>
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5 mt-0.5">
                <Flame className="w-3.5 h-3.5 text-[#ffb780]" />
                <span>Medium Heat</span>
              </p>
            </button>

            <button
              onClick={() => setToastMessage('Prep Scale: 350g weighed')}
              className="p-3 rounded-xl bg-[#1c2529] hover:bg-[#252f33] border border-white/5 text-left transition-all cursor-pointer"
            >
              <p className="text-[10px] text-[#8e989b]">Kitchen Scale</p>
              <p className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Scale</span>
              </p>
            </button>

            <button
              onClick={() => setToastMessage(`Estimated cooking time: ${currentStepData.duration}`)}
              className="p-3 rounded-xl bg-[#1c2529] hover:bg-[#252f33] border border-white/5 text-left transition-all cursor-pointer"
            >
              <p className="text-[10px] text-[#8e989b]">Step Duration</p>
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-[#a1e3f9]" />
                <span>{currentStepData.duration}</span>
              </p>
            </button>

            <button
              onClick={() => setToastMessage('Kitchen Sensors: Connected & Active')}
              className="p-3 rounded-xl bg-[#1c2529] hover:bg-[#252f33] border border-white/5 flex flex-col justify-between text-left transition-all cursor-pointer"
            >
              <p className="text-[10px] text-[#8e989b]">Smart Shelf Hub</p>
              <span className="text-[11px] font-mono font-bold text-[#a1e3f9]">Connected ✓</span>
            </button>
          </div>
        </div>

        {/* Right Side: Step Flow & Active Step Details (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Progress Overview Bar */}
          <div className="p-4 rounded-2xl bg-[#1c2529] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Recipe Progress</span>
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
                  className={`py-1 rounded text-center text-[10px] font-mono font-bold transition-all cursor-pointer ${
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

          {/* Active Step Card */}
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
                <Clock className="w-3.5 h-3.5" /> Estimated time: {currentStepData.duration}
              </p>
            </div>

            {/* Instructions List */}
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
                            Used
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
                className="px-4 py-2 rounded-xl bg-[#232b2e] hover:bg-[#2e373b] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>

              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-[#a1e3f9]/20 cursor-pointer"
              >
                <span>
                  {activeCookingStep < steps.length
                    ? `Next: ${steps[activeCookingStep]?.title || `Step ${activeCookingStep + 1}`} >`
                    : 'Finish Cooking & Save Food'}
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
