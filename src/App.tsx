import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Paintbrush, RefreshCw, AlertCircle, Heart, Palette } from "lucide-react";
import CameraView from "./components/CameraView";
import ArtworkShowcase from "./components/ArtworkShowcase";
import { StylizeResult, WeirdnessLevel } from "./types";

const LOADING_QUOTES = [
  "Jean-Pierre is examining your snapshot with deep Parisian suspicion...",
  "Sipping warm, rich espresso to ignite the grand imaginative critique...",
  "Selecting ze absolute parfait art style for zis masterpiece...",
  "Applying beautiful digital brushstrokes to the starry canvas...",
  "Drafting romantic phonetic French rhymes to praise zis genius...",
  "Ensuring your creation is sufficiently elite before submission to ze Louvre...",
];

export default function App() {
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<StylizeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [weirdnessCount, setWeirdnessCount] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Periodic cycling of Jean-Pierre loading quotes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % LOADING_QUOTES.length);
      }, 3500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Capture user photo & trigger initial default stylization
  const handleCapture = async (base64Image: string) => {
    setOriginalPhoto(base64Image);
    setIsLoading(true);
    setServerError(null);
    setWeirdnessCount(0);
    setResult(null);

    try {
      const res = await fetch("/api/stylize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          styleOverride: null,
          weirdnessLevel: "normal",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Ze server rejected Jean-Pierre's vision.");
      }

      const data: StylizeResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("API Error during stylize capture:", err);
      setServerError(err.message || "An obscure failure occurred inside the art studio kitchen.");
    } finally {
      setIsLoading(false);
    }
  };

  // Re-stylize same photo with override or custom weirdness
  const handleStylizeAgain = async (styleName: string, weirdness: WeirdnessLevel) => {
    if (!originalPhoto) return;
    setIsLoading(true);
    setServerError(null);

    // Track sequential make-it-weirder triggers
    if (weirdness !== "normal") {
      setWeirdnessCount((prev) => prev + 1);
    } else {
      setWeirdnessCount(0); // reset if it's a completely new normal style
    }

    try {
      const res = await fetch("/api/stylize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: originalPhoto,
          styleOverride: styleName,
          weirdnessLevel: weirdness,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Server could not process custom style proposal.");
      }

      const data: StylizeResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("API Error during stylize again:", err);
      setServerError(err.message || "The canvas was dropped on the floor. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    // Completely reset app back to default state
    setOriginalPhoto(null);
    setResult(null);
    setIsLoading(false);
    setServerError(null);
    setWeirdnessCount(0);
    // Explicitly cancel any speaking TTS to stop audio playback
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Decorative Elite Gallery Header */}
      <header id="gallery-masthead" className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/10 to-amber-500/25 border border-amber-500/30">
              <Palette className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 id="app-title-logo" className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
                Jean-Pierre's Camera Art
                <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-amber-500">
                  CRITIQUE
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-mono">
                La Galerie Virtuelle d'Élite • Paris 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Jean-Pierre is Online
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col justify-center items-center">
        <AnimatePresence mode="wait">
          
          {/* STATE 1: INITIAL CAMERA CAPTURE / FILE SELECT */}
          {!originalPhoto && !isLoading && !serverError && (
            <motion.div
              key="camera-capture-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              <CameraView onCapture={handleCapture} />
            </motion.div>
          )}

          {/* STATE 2: LOADING OR GENERATING VISUAL ART STATE */}
          {isLoading && (
            <motion.div
              key="loading-generation-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg mx-auto flex flex-col items-center justify-center p-12 rounded-3xl bg-slate-900/40 border border-slate-900 text-center shadow-2xl relative overflow-hidden"
            >
              {/* Subtle background glow effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Animating Brush Canvas */}
              <div id="anim-painter-icon" className="relative p-6 bg-slate-900 border border-slate-800 rounded-3xl mb-8 shadow-inner">
                <Paintbrush className="w-12 h-12 text-amber-400 animate-pulse" />
                <span className="absolute top-1/2 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              </div>

              <h3 id="loader-title" className="text-xl font-bold text-white mb-3">
                {weirdnessCount > 0 ? "Le Fever-Dream is cooking..." : "Translating Reality to Fine Art..."}
              </h3>
              
              {/* Dynamic Critic Message */}
              <p id="loader-subtitle" className="text-slate-300 text-sm max-w-sm font-mono leading-relaxed min-h-[3.5rem] flex items-center justify-center mx-auto text-center font-medium pulsing-critic italic">
                "{LOADING_QUOTES[quoteIndex]}"
              </p>

              {/* Fun French loading bar */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full mt-6 overflow-hidden max-w-xs mx-auto border border-slate-800">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 via-white to-red-500" 
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  style={{ width: "60%" }}
                />
              </div>
            </motion.div>
          )}

          {/* STATE 3: SERVER ERROR BOUNDARY */}
          {serverError && (
            <motion.div
              key="server-error-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg mx-auto flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-xl"
            >
              {serverError.includes("PAID_PLAN_REQUIRED") ? (
                <>
                  <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4 text-amber-400">
                    <Palette className="w-10 h-10 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">⚜️ Art Studio Plan Required ⚜️</h3>
                  <div className="text-slate-300 text-sm mb-6 max-w-md space-y-3 text-left bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <p className="font-mono text-xs text-amber-500 font-bold uppercase tracking-wider">
                      Message from Jean-Pierre:
                    </p>
                    <p className="font-mono leading-relaxed text-slate-300 text-xs">
                      "Ah, mon cher! Creating high-fidelity masterstrokes from thin air is a luxury of ze elite. The image model <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">gemini-2.5-flash-image</code> requires a paid billing key!"
                    </p>
                    <div className="pt-2 border-t border-slate-800 text-slate-400 text-xs space-y-2">
                      <p className="font-bold text-white">How to activate in 10 seconds:</p>
                      <ol className="list-decimal pl-4 space-y-1 font-sans">
                        <li>Tap the <strong className="text-white">Settings</strong> wheel in your AI Studio top-right corner.</li>
                        <li>Select <strong className="text-white">Secrets</strong> or details.</li>
                        <li>Generate/select an API key that is on a standard paid tier / development billing plan.</li>
                      </ol>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 mb-4 header-error">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Sacré Bleu! An Error Occurred</h3>
                  <p className="text-slate-300 text-sm mb-6 max-w-xs font-mono leading-relaxed">
                    {serverError}
                  </p>
                </>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  id="error-try-again-btn"
                  onClick={() => {
                    if (originalPhoto) {
                      handleStylizeAgain(result?.artStyleDecided || "Monet", "normal");
                    } else {
                      handleStartOver();
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm transition-all flex items-center gap-2 shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  id="error-reset-btn"
                  onClick={handleStartOver}
                  className="px-6 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-all"
                >
                  Start Over
                </button>
              </div>
            </motion.div>
          )}

          {/* STATE 4: ARTWORK & Critiques DISPLAY */}
          {originalPhoto && result && !isLoading && !serverError && (
            <motion.div
              key="artwork-display-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <ArtworkShowcase
                originalPhotoBase64={originalPhoto}
                result={result}
                onTryAgain={handleStylizeAgain}
                onStartOver={handleStartOver}
                isLoading={isLoading}
                weirdnessCount={weirdnessCount}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Humble Footer */}
      <footer id="gallery-footer" className="border-t border-slate-905 bg-slate-950 py-6 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p id="footer-copyright">
            Artistic Camera Translator & Critique Engine. Created for beautiful dreamers.
          </p>
          <p id="footer-critic-quote" className="italic flex items-center gap-1.5">
            "Art is not what you see, but what you make ze others see." - Degas <Heart className="w-3 h-3 text-red-500 fill-current" />
          </p>
        </div>
      </footer>

    </div>
  );
}
