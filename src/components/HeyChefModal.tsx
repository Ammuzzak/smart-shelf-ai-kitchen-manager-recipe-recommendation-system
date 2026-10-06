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
    setSelectedRecipeForDetail,
    setIsRecipeDetailOpen,
    theme,
  } = useKitchen();
  const isDark = theme === 'dark';

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
    } else if (response.action_performed === 'navigate_live_cooking' || response.action_performed === 'navigate_recipes') {
      setActiveScreen('recipes');
      setToastMessage('Navigated to Recipe Hub');
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

    let targetRec: Recipe;
    if (matched) {
      targetRec = matched;
    } else {
      // Build lightweight recipe object from chef response
      targetRec = {
        id: `chef-rec-${Date.now()}`,
        title: chefRec.name,
        prepTime: `${chefRec.prep_time_mins} min`,
        cookTime: '0 min',
        estimatedCookingTime: `${chefRec.prep_time_mins} min`,
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
        ingredientsWithQuantities: chefRec.uses_inventory.map((name: string) => ({
          name,
          quantity: 'as available',
          isAvailable: true,
        })),
      };
    }

    setIsHeyChefOpen(false);
    setSelectedRecipeForDetail(targetRec);
    setIsRecipeDetailOpen(true);
    setToastMessage(`Viewing Recipe: ${chefRec.name}`);
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
    { text: 'Maggi', desc: 'Inspects real inventory for Maggi & add-ons' },
    { text: 'maggi epdi seiya', desc: 'Tanglish Maggi preparation & availability' },
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
      <div className={`w-full max-w-lg border rounded-3xl shadow-2xl p-6 relative space-y-5 overflow-hidden max-h-[90vh] flex flex-col transition-all ${
        isDark
          ? 'bg-[#151d20] border-[#a1e3f9]/40 text-[#dbe4e8]'
          : 'bg-[#FFFFFF] border-[#A99BCB]/50 text-[#24332D]'
      }`}>
        {/* Glow backdrop */}
        <div className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isDark ? 'bg-[#a1e3f9]/15' : 'bg-[#A99BCB]/15'
        }`} />

        {/* Modal Header */}
        <div className={`flex items-center justify-between pb-3 border-b relative z-10 shrink-0 ${
          isDark ? 'border-white/10' : 'border-[#E4DED2]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              isDark
                ? 'bg-[#a1e3f9]/20 border-[#a1e3f9]/40 text-[#a1e3f9]'
                : 'bg-[#A99BCB]/20 border-[#A99BCB]/40 text-[#63538C]'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-display text-sm font-bold ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                  "Chef" AI Assistant
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-300 animate-pulse'
                      : isSpeechSupported
                      ? isDark
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-[#6FAF8F]/20 text-[#43634F]'
                      : 'bg-amber-500/20 text-amber-500'
                  }`}
                >
                  {isListening ? 'Listening...' : isSpeechSupported ? 'Ready • English / தமிழ்' : 'Voice Unavailable'}
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                Speaks English, Tamil & Tanglish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSpeechAudioOn(!isSpeechAudioOn)}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-[#8e989b] hover:text-white'
                  : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#68736D] hover:text-[#24332D]'
              }`}
              title={isSpeechAudioOn ? 'Mute speech output' : 'Enable speech output'}
            >
              {isSpeechAudioOn ? (
                <Volume2 className={`w-4 h-4 ${isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'}`} />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => {
                stopListening();
                setIsHeyChefOpen(false);
              }}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-[#8e989b] hover:text-white'
                  : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#68736D] hover:text-[#24332D]'
              }`}
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
          <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
            isDark ? 'bg-[#0d1518] border-white/10' : 'bg-[#F7F5EF] border-[#E4DED2]'
          }`}>
            <div className="flex items-center justify-between w-full">
              <span className={`text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 ${
                isDark ? 'text-[#a1e3f9]' : 'text-[#557A62]'
              }`}>
                {isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Listening to voice...
                  </>
                ) : (
                  <>
                    <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-[#6FAF8F]'}`} />
                    Microphone Ready
                  </>
                )}
              </span>

              {isSpeechSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : isDark
                      ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                      : 'bg-[#557A62] hover:bg-[#43634F] text-white'
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
                      ? isDark
                        ? 'bg-gradient-to-t from-[#004f5e] to-[#a1e3f9] animate-pulse'
                        : 'bg-gradient-to-t from-[#557A62] to-[#6FAF8F] animate-pulse'
                      : isDark ? 'bg-white/20' : 'bg-[#E4DED2]'
                  }`}
                />
              ))}
            </div>

            <p className={`text-[11px] italic text-center ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              {isListening
                ? 'Speak in English, Tamil, or Tanglish...'
                : 'Click "Tap to Speak" or ask in English/Tamil below'}
            </p>
          </div>

          {/* 2. User Input Display */}
          <div className="flex items-start justify-end gap-2">
            <div className={`p-3 rounded-2xl rounded-tr-none border text-xs max-w-[85%] ${
              isDark
                ? 'bg-[#1c2529] border-white/10 text-white'
                : 'bg-[#F7F5EF] border-[#E4DED2] text-[#24332D]'
            }`}>
              <span className={`text-[10px] block mb-0.5 font-mono ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                You:
              </span>
              <p className="font-semibold">{userSpeech}</p>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-1 ${
              isDark ? 'bg-white/10 text-white' : 'bg-[#557A62] text-white'
            }`}>
              You
            </div>
          </div>

          {/* 3. Chef Natural Reply */}
          {chefResponse && (
            <div className="flex items-start gap-2">
              <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 mt-1 font-bold text-xs ${
                isDark
                  ? 'bg-[#a1e3f9]/20 border-[#a1e3f9]/40 text-[#a1e3f9]'
                  : 'bg-[#A99BCB]/20 border-[#A99BCB]/40 text-[#63538C]'
              }`}>
                👨‍🍳
              </div>
              <div className={`p-3.5 rounded-2xl rounded-tl-none border text-xs leading-relaxed max-w-[90%] shadow-md space-y-2 ${
                isDark
                  ? 'bg-gradient-to-br from-[#1c2529] to-[#252f33] border-[#a1e3f9]/30 text-[#dbe4e8]'
                  : 'bg-gradient-to-br from-[#FFFDF8] to-[#F7F5EF] border-[#A99BCB]/30 text-[#24332D]'
              }`}>
                <div className={`flex items-center justify-between text-[11px] font-bold ${
                  isDark ? 'text-[#a1e3f9]' : 'text-[#63538C]'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Chef</span>
                  </div>
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                    isDark ? 'bg-white/5 text-[#8e989b]' : 'bg-[#E4DED2] text-[#68736D]'
                  }`}>
                    {chefResponse.language}
                  </span>
                </div>

                <p className={`font-medium ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                  {chefResponse.conversational_reply}
                </p>

                {/* Recognized Ingredients Display */}
                {chefResponse.recognized_ingredients && chefResponse.recognized_ingredients.length > 0 && (
                  <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                    isDark
                      ? 'bg-[#a1e3f9]/10 border-[#a1e3f9]/30'
                      : 'bg-[#6FAF8F]/15 border-[#6FAF8F]/30'
                  }`}>
                    <p className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                      isDark ? 'text-[#a1e3f9]' : 'text-[#43634F]'
                    }`}>
                      <Sparkles className="w-3 h-3" />
                      <span>RECOGNIZED INGREDIENTS ({chefResponse.recognized_ingredients.length}):</span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {chefResponse.recognized_ingredients.map((std, idx) => (
                        <span
                          key={idx}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold border flex items-center gap-1 ${
                            isDark
                              ? 'bg-[#a1e3f9]/25 text-[#a1e3f9] border-[#a1e3f9]/40'
                              : 'bg-[#6FAF8F]/25 text-[#43634F] border-[#6FAF8F]/40'
                          }`}
                        >
                          ✓ {getIngredientDisplayName(std)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Recipe Suggestions Cards inside Chef */}
                {chefResponse.recipes && chefResponse.recipes.length > 0 && (
                  <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-white/10' : 'border-[#E4DED2]'}`}>
                    {chefResponse.recipes.map((rec, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border space-y-2 ${
                          isDark
                            ? 'bg-[#151d20] border-white/10'
                            : 'bg-[#FFFFFF] border-[#E4DED2] shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className={`font-bold text-xs flex items-center gap-1 ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                            <span>🍳</span>
                            <span>{rec.name}</span>
                          </h4>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                              rec.ready_to_cook
                                ? isDark
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-[#6FAF8F]/25 text-[#43634F] border border-[#6FAF8F]/40'
                                : isDark
                                ? 'bg-[#ffb780]/20 text-[#ffb780]'
                                : 'bg-[#D9826B]/20 text-[#D9826B]'
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
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-[#6FAF8F]/15 text-[#43634F]'
                              }`}
                            >
                              ✓ {ing}
                            </span>
                          ))}
                          {rec.missing_items.map((m, k) => (
                            <span
                              key={k}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                isDark ? 'bg-[#ffb780]/15 text-[#ffb780]' : 'bg-[#D9826B]/15 text-[#D9826B]'
                              }`}
                            >
                              + You'll also need: {m}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className={`text-[10px] font-mono flex items-center gap-1 ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
                            <Clock className="w-3 h-3" /> {rec.prep_time_mins} min
                          </span>
                          <button
                            onClick={() => handleStartRecipeCooking(rec)}
                            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm ${
                              isDark
                                ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                                : 'bg-[#557A62] hover:bg-[#43634F] text-white'
                            }`}
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
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>
              Try saying or click:
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {suggestedCommands.slice(0, 4).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleProcessCommand(p.text)}
                  className={`p-2 rounded-xl border text-left transition-all group cursor-pointer ${
                    isDark
                      ? 'bg-[#1c2529] hover:bg-[#252f33] border-white/5 hover:border-[#a1e3f9]/30'
                      : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] border-[#E4DED2] hover:border-[#6FAF8F]'
                  }`}
                >
                  <p className={`text-xs font-semibold truncate ${
                    isDark ? 'text-white group-hover:text-[#a1e3f9]' : 'text-[#24332D] group-hover:text-[#557A62]'
                  }`}>
                    {p.text}
                  </p>
                  <p className={`text-[9px] truncate ${isDark ? 'text-[#8e989b]' : 'text-[#68736D]'}`}>{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Timer Widget Bar */}
        <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark
            ? 'bg-[#1c2529] border-[#ffb780]/30'
            : 'bg-[#FFFDF8] border-[#D9826B]/30'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
              isDark
                ? 'bg-[#ffb780]/15 border-[#ffb780]/30 text-[#ffb780]'
                : 'bg-[#D9826B]/15 border-[#D9826B]/30 text-[#D9826B]'
            }`}>
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className={`font-mono text-base font-extrabold tracking-wider ${isDark ? 'text-white' : 'text-[#24332D]'}`}>
                {formattedTimer}
              </p>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-[#ffb780]' : 'text-[#D9826B]'}`}>
                Cooking Timer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={pauseChefTimer}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#252f33] hover:bg-[#323d42] text-white'
                  : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#24332D] border border-[#E4DED2]'
              }`}
              title="Pause/Resume Timer"
            >
              {isChefTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => addChefTimerMins(2)}
              className={`px-2 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#252f33] hover:bg-[#323d42] text-white'
                  : 'bg-[#F7F5EF] hover:bg-[#EFE9DE] text-[#24332D] border border-[#E4DED2]'
              }`}
            >
              +2 min
            </button>
          </div>
        </div>

        {/* 5. Manual Text Command Input */}
        <form onSubmit={handleManualSubmit} className={`flex items-center gap-2 pt-2 border-t shrink-0 ${
          isDark ? 'border-white/10' : 'border-[#E4DED2]'
        }`}>
          <input
            type="text"
            placeholder="Ask Chef: 'enna sapadalam ippo', 'what can I cook?', 'muttai boil time'..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all ${
              isDark
                ? 'bg-[#151d20] border-white/10 text-white placeholder-[#5a6568] focus:border-[#a1e3f9]'
                : 'bg-[#F7F5EF] border-[#E4DED2] text-[#24332D] placeholder-[#8A9590] focus:border-[#6FAF8F]'
            }`}
          />
          <button
            type="submit"
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isDark
                ? 'bg-[#a1e3f9] hover:bg-[#c2effc] text-[#003642]'
                : 'bg-[#557A62] hover:bg-[#43634F] text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
