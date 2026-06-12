import React, { useState, useEffect } from "react";
import { Download, RefreshCw, Sparkles, Volume2, VolumeX, ArrowLeft, Paintbrush, Flame } from "lucide-react";
import { StylizeResult, WeirdnessLevel, FAMOUS_ART_STYLES } from "../types";

interface ArtworkShowcaseProps {
  originalPhotoBase64: string;
  result: StylizeResult;
  onTryAgain: (styleOverride: string, weirdness: WeirdnessLevel) => void;
  onStartOver: () => void;
  isLoading: boolean;
  weirdnessCount: number;
}

export default function ArtworkShowcase({
  originalPhotoBase64,
  result,
  onTryAgain,
  onStartOver,
  isLoading,
  weirdnessCount,
}: ArtworkShowcaseProps) {
  const { detectedSubject, artStyleDecided, poem, generatedImageUrl, imageGenerationPrompt } = result;

  const [customStyle, setCustomStyle] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Monitor voices list for TTS selection
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const handleVoicesChanged = () => {
        setVoicesLoaded(true);
      };
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      // Trigger voice load initially for browsers that don't emit the event after loading
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoicesLoaded(true);
      }
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
      };
    }
  }, []);

  // Stop reading when leaving or component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Ah, mon ami, your browser completely lacks ze voice synthesizer! S'il vous plaît read ze poem wiz your own magnificent voice!");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Cancel other playbacks
    window.speechSynthesis.cancel();

    // Clean up phonetic words slightly to improve French engine comprehension if desired, or let it speak naturally
    const cleanPoem = poem.replace(/\\n/g, "\n");
    const utterance = new SpeechSynthesisUtterance(cleanPoem);

    const allVoices = window.speechSynthesis.getVoices();
    // Prioritize a French local voice so the accent is thick and authentic
    const frenchInhabitantVoice = allVoices.find(
      (v) => v.lang.startsWith("fr") || v.name.toLowerCase().includes("french") || v.name.toLowerCase().includes("jean")
    );

    if (frenchInhabitantVoice) {
      utterance.voice = frenchInhabitantVoice;
      console.log("Found french speaker voice:", frenchInhabitantVoice.name);
    } else {
      console.log("No French accent engine, relying on spelling phonetics.");
    }

    // Parisian speed/tone configs
    utterance.rate = 0.88;
    utterance.pitch = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = generatedImageUrl;
    link.download = `jean-pierre-${artStyleDecided.toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTryAgainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStyle.trim()) return;
    onTryAgain(customStyle, "normal");
  };

  const selectStyleChip = (styleName: string) => {
    setCustomStyle(styleName);
    onTryAgain(styleName, "normal");
  };

  const handleWeirderClick = () => {
    // Progress weirdness level based on amount of weirder updates
    const nextWeirdness: WeirdnessLevel = weirdnessCount >= 1 ? "extremely-weird" : "weirder";
    onTryAgain(artStyleDecided, nextWeirdness);
  };

  return (
    <div id="artwork-showcase" className="w-full max-w-5xl mx-auto flex flex-col gap-10">
      
      {/* Upper header section */}
      <div id="showcase-header" className="flex flex-col sm:flex-row justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 gap-4">
        <div className="flex gap-4 items-center">
          <img
            src={originalPhotoBase64}
            alt="Original Snapshot"
            className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md flex-shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <span id="detected-tag" className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20 block w-max mb-1">
              Subject Captured
            </span>
            <p id="detected-sub-desc" className="text-white text-sm font-medium capitalize truncate max-w-sm">
              {detectedSubject || "Jean-Pierre's Canvas Inspiration"}
            </p>
          </div>
        </div>

        <button
          id="showcase-start-over-btn"
          onClick={onStartOver}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-sm font-semibold flex items-center gap-2 border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          START OVER
        </button>
      </div>

      {/* Main Showcase Layout Grid */}
      <div id="artwork-showcase-grid" className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Framed Masterpiece (7 columns) */}
        <div id="grid-artwork-left" className="md:col-span-7 flex flex-col items-center">
          <div className="museum-frame rounded-2xl w-full bg-slate-950 flex justify-center items-center overflow-hidden max-w-lg mx-auto">
            {isLoading ? (
              <div className="aspect-square w-full flex flex-col items-center justify-center bg-slate-950 p-10 text-center gap-4">
                <Paintbrush className="w-12 h-12 text-amber-400 animate-spin" />
                <p className="text-slate-300 font-mono text-sm max-w-xs leading-relaxed pulsing-critic">
                  S'il vous plaît hold! Jean-Pierre is currently reworking ze canvas with fresh paint...
                </p>
              </div>
            ) : (
              <img
                src={generatedImageUrl}
                alt="Stylized Masterpiece Canvas"
                className="w-full aspect-square object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          <div id="styled-gilt-label" className="mt-6 text-center max-w-md">
            <h3 className="text-xl font-bold text-amber-400 leading-tight">
              {artStyleDecided}
            </h3>
            <p className="text-slate-400 text-xs mt-1 font-mono uppercase tracking-widest">
              Gallery ID: {Math.floor(Math.random() * 900000) + 100000}
            </p>

            <button
              id="download-masterpiece-btn"
              onClick={handleDownload}
              disabled={isLoading}
              className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-md flex items-center gap-2 mx-auto transition-transform active:scale-95 duration-200"
            >
              <Download className="w-4 h-4" />
              Download Masterpiece
            </button>
          </div>
        </div>

        {/* Right Column: Poet Critique & Control Desk (5 columns) */}
        <div id="grid-critique-right" className="md:col-span-5 flex flex-col gap-6">
          
          {/* Critique Card */}
          <div id="critique-container-card" className="gallery-paper rounded-2xl px-6 py-7 relative overflow-hidden flex flex-col">
            
            {/* Header / Accent Ribbon */}
            <div className="flex justify-between items-center mb-6 border-b border-stone-300/60 pb-4">
              <div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-stone-500 font-bold">
                  La Critique de Jean-Pierre
                </h4>
                <p className="text-stone-900 font-bold text-sm">
                  Professional Opinion
                </p>
              </div>
              
              <button
                id="voice-synthesis-speaker-btn"
                onClick={handleSpeak}
                className={`p-3 rounded-full shadow-md transition-all ${
                  isSpeaking
                    ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                    : "bg-white hover:bg-stone-100 text-stone-800 border border-stone-200"
                }`}
                title="Hear ze Critic speak!"
              >
                {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Poem Board */}
            <div id="critique-content-body" className="flex-1">
              <blockquote className="text-stone-800 italic font-mono text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                {poem ? poem.replace(/\\n/g, "\n") : "Critique is loading, please wait."}
              </blockquote>
            </div>

            {/* Spoken instructions caption */}
            <div className="mt-6 pt-4 border-t border-stone-300/40 text-left">
              <p className="text-stone-500 text-[11px] leading-normal font-mono italic">
                *Click ze 🔊 speaker button above to hear Jean-Pierre read ze poem in his extremely thick French accent!
              </p>
            </div>
          </div>

          {/* Action Center - Weirder and try another style */}
          <div id="action-center-pad" className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col gap-5">
            
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-amber-400" />
                Want details changed?
              </h4>
              <p className="text-slate-400 text-xs">
                Incorporate weirder elements or write an alternative style below!
              </p>
            </div>

            {/* Make it Weirder button */}
            <button
              id="make-it-weirder-btn"
              onClick={handleWeirderClick}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 border border-red-500 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-red-900/30 active:scale-[0.98] disabled:opacity-50"
            >
              <Flame className="w-4 h-4 fill-white" />
              MAKE IT {weirdnessCount >= 1 ? "EXCEPTIONAL_WEIRDER" : "WEIRDER"} !
            </button>

            {/* Custom Input Form */}
            <form onSubmit={handleTryAgainSubmit} className="flex flex-col gap-3 border-t border-slate-800 pt-5">
              <label htmlFor="custom-style-input" className="text-white text-xs font-semibold">
                Explore custom painter or alternate art direction:
              </label>
              <div className="flex gap-2">
                <input
                  id="custom-style-input"
                  type="text"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  placeholder="e.g., Cyberpunk neon, Anime 1990s, Stained Glass..."
                  disabled={isLoading}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 text-white text-sm border border-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-50"
                />
                <button
                  id="try-again-custom-btn"
                  type="submit"
                  disabled={isLoading || !customStyle.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  TRY AGAIN
                </button>
              </div>
            </form>

            {/* Quick chips suggested styles */}
            <div id="quick-style-chips-wrapper" className="flex flex-col gap-2 mt-2">
              <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                Or click to apply famous styles:
              </p>
              <div id="chips-inner-flex" className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                {FAMOUS_ART_STYLES.map((style) => (
                  <button
                    id={`art-style-chip-${style.name.toLowerCase().replace(/[^a-z]/g, "")}`}
                    key={style.name}
                    type="button"
                    title={style.desc}
                    onClick={() => selectStyleChip(style.name)}
                    disabled={isLoading}
                    className="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] cursor-pointer text-left transition-colors truncate max-w-full"
                  >
                    🎨 {style.name}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
