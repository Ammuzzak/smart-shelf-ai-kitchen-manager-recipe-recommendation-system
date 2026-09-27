import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  Send,
  Clock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronRight,
  AlertCircle,
  ChefHat,
  Check,
  Plus,
} from 'lucide-react';
import { useKitchen } from '../context/KitchenContext';
import { FoodCategory, Recipe } from '../types';
import { queryChef, StructuredChefResponse } from '../data/chefEngine';
import { extractIngredientsFromSentence, getIngredientDisplayName } from '../data/ingredientNormalization';

export const HeyChefModal: React.FC = () => {
  const {
    isHeyChefOpen,
    setIsHeyChefOpen,
    inventory,
    recipes,
    setActiveCookingRecipe,
    setActiveCookingStep,
    setActiveScreen,
    addItem,
    setToastMessage,
    chefTimerSeconds,
    isChefTimerRunning,
    startChefTimer,
    pauseChefTimer,
    addChefTimerMins,
  } = useKitchen();

  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [userSpeech, setUserSpeech] = useState(
    'enna sapadalam ippo, konjam quick a'
  );
  const [chefResponse, setChefResponse] = useState<StructuredChefResponse | null>(null);
  const [isSpeechAudioOn, setIsSpeechAudioOn] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
    } else {
      setIsSpeechSupported(true);
    }
  }, []);

  // Initialize SpeechRecognition on modal open
  useEffect(() => {
    if (!isHeyChefOpen) {
      stopListening();
      return;
    }

    // Default first query to demonstrate immediate readiness
    if (!chefResponse) {
      const initial = queryChef('enna sapadalam ippo, konjam quick a', inventory, recipes);
      setChefResponse(initial);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Supports Indian English, Tanglish, and Tamil accents

        recognition.onstart = () => {
          setIsListening(true);
          setPermissionError(null);
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          if (currentText) {
            setUserSpeech(currentText);
          }

          if (finalTranscript) {
            handleProcessCommand(finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setPermissionError(
              'Microphone access denied. You can still type below or tap quick queries.'
            );
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        startListening();
      } catch (err) {
        console.error('Failed to init speech recognition:', err);
        setIsSpeechSupported(false);
      }
    }

    return () => {
      stopListening();
    };
  }, [isHeyChefOpen]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setPermissionError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        // Recognition might already be running
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (isSpeechAudioOn && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Connected to unified Chef AI Engine
  const handleProcessCommand = (queryText: string) => {
    const raw = queryText.trim();
    if (!raw) return;

    setUserSpeech(raw);

    // Call unified Chef Engine with CURRENT real My Food inventory and recipes
    const response = queryChef(raw, inventory, recipes);
    setChefResponse(response);

    // Handle timer
    if (response.timer_seconds) {
      startChefTimer(response.timer_seconds);
    }

    // Handle adding items to My Food if ADD_FOOD intent
    if (response.intent === 'ADD_FOOD') {
      const extracted = response.recognized_ingredients;
      const numMatch = raw.match(/\b(\d+)\b/);
      const qty = numMatch ? parseInt(numMatch[1], 10) : 1;

      extracted.forEach((std) => {
        let category: FoodCategory = 'Produce';
        let unit = 'item';
        let days = 4;
        let loc = 'Crisper Hydrator';

        if (std === 'egg') {
          category = 'Dairy';
          unit = qty > 1 ? 'eggs' : 'egg';
          days = 14;
          loc = 'Fridge Door';
        } else if (std === 'milk') {
          category = 'Dairy';
          unit = 'L';
          days = 3;
          loc = 'Dairy Chiller';
        } else if (std === 'banana') {
          category = 'Produce';
          unit = qty > 1 ? 'items' : 'item';
          days = 3;
          loc = 'Fruit Basket';
        } else if (std === 'mango') {
          category = 'Produce';
          unit = qty > 1 ? 'items' : 'item';
          days = 3;
          loc = 'Fruit Basket';
        } else if (std === 'bread') {
          category = 'Bakery';
          unit = 'loaf';
          days = 3;
          loc = 'Bread Box';
        } else if (std === 'tomato') {
          category = 'Produce';
          unit = qty > 1 ? 'items' : 'item';
          days = 3;
          loc = 'Veggie Rack';
        } else if (std === 'onion') {
          category = 'Produce';
          unit = qty > 1 ? 'items' : 'item';
          days = 10;
          loc = 'Pantry Bin';
        } else if (std === 'sugar' || std === 'boost' || std === 'rice' || std === 'toor dal') {
          category = 'Basic Foods';
          unit = 'kg';
          days = 90;
          loc = 'Shelf B • Jar';
        } else if (std === 'condensed milk' || std === 'chocolate syrup') {
          category = 'Dairy';
          unit = 'can';
          days = 120;
          loc = 'Fridge Door';
        }

        const displayName = getIngredientDisplayName(std);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);

        addItem({
          name: displayName,
          category,
          quantity: qty,
          unit,
          location: loc,
          expiryDate: expiryDate.toISOString().split('T')[0],
          purchaseDate: new Date().toISOString().split('T')[0],
          daysLeft: days,
          atRisk: days <= 2,
          urgencyStatus: days <= 1 ? 'critical' : days <= 2 ? 'urgent' : 'optimal',
          costEstimate: qty * 30,
        });
      });
      setToastMessage(response.action_performed || `Added to My Food`);
    }

    // Handle navigation actions
    if (response.action_performed === 'navigate_inventory') {
      setActiveScreen('inventory');
      setToastMessage('Navigated to My Food');
    } else if (response.action_performed === 'navigate_shopping') {
      setActiveScreen('shopping-list');
      setToastMessage('Navigated to Shopping List');
    } else if (response.action_performed === 'navigate_live_cooking') {
      setActiveScreen('live-cooking');
      setToastMessage('Navigated to Live Cooking');
    } else if (response.action_performed === 'navigate_dashboard') {
      setActiveScreen('dashboard');
      setToastMessage('Navigated to Dashboard');
    }

    // Speak conversational reply
    speakText(response.conversational_reply);
  };

  const handleStartRecipeCooking = (chefRec: any) => {
    const matched = recipes.find(
      (r) => r.title.toLowerCase() === chefRec.name.toLowerCase()
    );

    if (matched) {
      setActiveCookingRecipe(matched);
    } else {
      // Build lightweight recipe object from chef response
      const customRec: Recipe = {
        id: `chef-rec-${Date.now()}`,
        title: chefRec.name,
        prepTime: `${chefRec.prep_time_mins} min`,
        cookTime: '0 min',
        servings: 2,
        description: `Cooked using your available food items: ${chefRec.uses_inventory.join(', ')}.`,
        cuisine: 'Home Kitchen',
        category: 'Breakfast',
        image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=900&auto=format&fit=crop&q=80',
        atRiskIngredients: chefRec.uses_expiring_items.map((i: string) => ({
          name: i,
          urgency: 'Expiring soon',
          status: 'urgent',
        })),
        pantryItems: chefRec.uses_inventory,
        missingIngredients: chefRec.missing_items,
        rescueWeight: '350g',
        moneySaved: '₹80',
        steps: chefRec.steps.map((st: string, idx: number) => ({
          stepNumber: idx + 1,
          title: `Step ${idx + 1}`,
          duration: '2 min',
          instructions: [st],
        })),
      };
      setActiveCookingRecipe(customRec);
    }

    setActiveCookingStep(1);
    setIsHeyChefOpen(false);
    setActiveScreen('live-cooking');
    setToastMessage(`Started Cooking ${chefRec.name}`);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    handleProcessCommand(inputQuery);
    setInputQuery('');
  };

  if (!isHeyChefOpen) return null;

  const mins = Math.floor(chefTimerSeconds / 60);
  const secs = chefTimerSeconds % 60;
  const formattedTimer = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const suggestedCommands = [
    { text: 'enna sapadalam ippo, konjam quick a', desc: 'Tanglish quick recipe request' },
    { text: 'En kitta tomato iruku enna panna mudiyum?', desc: 'Tanglish ingredient query' },
    { text: 'muttai boil panna evlo time?', desc: 'Cooking time in Tanglish' },
    { text: 'I have milk mango sugar and condensed milk', desc: 'Exact multi-ingredient query' },
    { text: 'Add 2 eggs', desc: 'Adds eggs to My Food' },
    { text: 'Show my food', desc: 'Opens My Food inventory' },
    { text: 'Show shopping list', desc: 'Opens shopping plan' },
    { text: 'Start cooking', desc: 'Opens Live Cooking room' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#151d20] border border-[#a1e3f9]/40 rounded-3xl shadow-2xl p-6 relative space-y-5 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow backdrop */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#a1e3f9]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#a1e3f9]/20 border border-[#a1e3f9]/40 flex items-center justify-center text-[#a1e3f9]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm font-bold text-white">"Chef" AI Assistant</h3>
                <span
                  className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                      : isSpeechSupported
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {isListening ? 'Listening...' : isSpeechSupported ? 'Ready • English / தமிழ்' : 'Voice Unavailable'}
                </span>
              </div>
              <p className="text-[11px] text-[#8e989b]">Speaks English, Tamil & Tanglish</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSpeechAudioOn(!isSpeechAudioOn)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e989b] hover:text-white transition-all cursor-pointer"
              title={isSpeechAudioOn ? 'Mute speech output' : 'Enable speech output'}
            >
              {isSpeechAudioOn ? <Volume2 className="w-4 h-4 text-[#a1e3f9]" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                stopListening();
                setIsHeyChefOpen(false);
              }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#8e989b] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable conversation area */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Permission error notice if any */}
          {permissionError && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>{permissionError}</p>
            </div>
          )}

          {/* 1. Speech Recognition Visualizer & Mic Button */}
          <div className="p-4 rounded-2xl bg-[#0d1518] border border-white/10 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono font-bold tracking-wider text-[#a1e3f9] uppercase flex items-center gap-1.5">
                {isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Listening to voice...
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Microphone Ready
                  </>
                )}
              </span>

              {isSpeechSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'Stop Listening' : 'Tap to Speak'}</span>
                </button>
              )}
            </div>

            {/* Equalizer Bars */}
            <div className="flex items-center justify-center gap-1.5 h-8 w-full max-w-xs">
              {[45, 75, 30, 90, 60, 100, 70, 85, 40, 95, 55, 80, 65, 35, 90].map((height, i) => (
                <div
                  key={i}
                  style={{ height: isListening ? `${height}%` : '20%' }}
                  className={`w-1.5 rounded-full transition-all duration-200 ${
                    isListening
                      ? 'bg-gradient-to-t from-[#004f5e] to-[#a1e3f9] animate-pulse'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            <p className="text-[11px] text-[#8e989b] italic text-center">
              {isListening
                ? 'Speak in English, Tamil, or Tanglish...'
                : 'Click "Tap to Speak" or ask in English/Tamil below'}
            </p>
          </div>

          {/* 2. User Input Display */}
          <div className="flex items-start justify-end gap-2">
            <div className="p-3 rounded-2xl rounded-tr-none bg-[#1c2529] border border-white/10 text-xs text-white max-w-[85%]">
              <span className="text-[10px] text-[#8e989b] block mb-0.5 font-mono">You:</span>
              <p className="font-semibold">{userSpeech}</p>
            </div>
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1">
              You
            </div>
          </div>

          {/* 3. Chef Natural Reply */}
          {chefResponse && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#a1e3f9]/20 border border-[#a1e3f9]/40 flex items-center justify-center text-[#a1e3f9] shrink-0 mt-1 font-bold text-xs">
                👨‍🍳
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-gradient-to-br from-[#1c2529] to-[#252f33] border border-[#a1e3f9]/30 text-xs text-[#dbe4e8] leading-relaxed max-w-[90%] shadow-md space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#a1e3f9] font-bold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Chef</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-white/5 text-[#8e989b]">
                    {chefResponse.language}
                  </span>
                </div>

                <p className="text-white font-medium">{chefResponse.conversational_reply}</p>

                {/* Recognized Ingredients Display */}
                {chefResponse.recognized_ingredients && chefResponse.recognized_ingredients.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-[#a1e3f9]/10 border border-[#a1e3f9]/30 space-y-1.5">
                    <p className="text-[10px] font-mono font-bold text-[#a1e3f9] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>RECOGNIZED INGREDIENTS ({chefResponse.recognized_ingredients.length}):</span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {chefResponse.recognized_ingredients.map((std, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-[#a1e3f9]/25 text-[#a1e3f9] font-bold border border-[#a1e3f9]/40 flex items-center gap-1"
                        >
                          ✓ {getIngredientDisplayName(std)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Recipe Suggestions Cards inside Chef */}
                {chefResponse.recipes && chefResponse.recipes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/10">
                    {chefResponse.recipes.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-[#151d20] border border-white/10 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-xs flex items-center gap-1">
                            <span>🍳</span>
                            <span>{rec.name}</span>
                          </h4>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                              rec.ready_to_cook
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-[#ffb780]/20 text-[#ffb780]'
                            }`}
                          >
                            {rec.ready_to_cook ? '100% Ready' : `${rec.match_percent}% Match`}
                          </span>
                        </div>

                        {/* Ingredients used */}
                        <div className="flex flex-wrap gap-1">
                          {rec.uses_inventory.map((ing, k) => (
                            <span
                              key={k}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-medium"
                            >
                              ✓ {ing}
                            </span>
                          ))}
                          {rec.missing_items.map((m, k) => (
                            <span
                              key={k}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffb780]/15 text-[#ffb780] font-medium"
                            >
                              + You'll also need: {m}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-[#8e989b] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {rec.prep_time_mins} min
                          </span>
                          <button
                            onClick={() => handleStartRecipeCooking(rec)}
                            className="px-3 py-1 rounded-lg bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Start Cooking</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggested Quick Commands */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] font-bold text-[#8e989b] uppercase tracking-wider">
              Try saying or click:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {suggestedCommands.slice(0, 4).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleProcessCommand(p.text)}
                  className="p-2 rounded-xl bg-[#1c2529] hover:bg-[#252f33] border border-white/5 hover:border-[#a1e3f9]/30 text-left transition-all group cursor-pointer"
                >
                  <p className="text-xs font-semibold text-white group-hover:text-[#a1e3f9] truncate">
                    {p.text}
                  </p>
                  <p className="text-[9px] text-[#8e989b] truncate">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Timer Widget Bar */}
        <div className="p-3 rounded-2xl bg-[#1c2529] border border-[#ffb780]/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ffb780]/15 border border-[#ffb780]/30 flex items-center justify-center text-[#ffb780]">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="font-mono text-base font-extrabold text-white tracking-wider">
                {formattedTimer}
              </p>
              <p className="text-[9px] text-[#ffb780] font-bold uppercase tracking-wider">
                Cooking Timer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={pauseChefTimer}
              className="p-2 rounded-xl bg-[#252f33] hover:bg-[#323d42] text-white transition-all cursor-pointer"
              title="Pause/Resume Timer"
            >
              {isChefTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => addChefTimerMins(2)}
              className="px-2 py-1 rounded-xl bg-[#252f33] hover:bg-[#323d42] text-xs font-semibold text-white transition-all cursor-pointer"
            >
              +2 min
            </button>
          </div>
        </div>

        {/* 5. Manual Text Command Input */}
        <form onSubmit={handleManualSubmit} className="flex items-center gap-2 pt-2 border-t border-white/10 shrink-0">
          <input
            type="text"
            placeholder="Ask Chef: 'enna sapadalam ippo', 'what can I cook?', 'muttai boil time'..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#151d20] border border-white/10 text-white text-xs placeholder-[#5a6568] focus:border-[#a1e3f9] outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
