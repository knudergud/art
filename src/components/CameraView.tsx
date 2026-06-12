import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, UploadCloud, FileImage } from "lucide-react";

interface CameraViewProps {
  onCapture: (base64Image: string) => void;
}

export default function CameraView({ onCapture }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Auto-initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1024 },
          height: { ideal: 1024 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Could not access camera:", err);
      setCameraError(
        "Camera permission denied or camera unavailable in this context. Please snap a picture by uploading/dragging a file instead!"
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Use original video stream dimensions
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (context) {
        // Draw the current video frame onto the canvas
        context.drawImage(video, 0, 0, width, height);
        // Convert to base64
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        stopCamera();
        onCapture(dataUrl);
      }
    }
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Validate image format
    if (!file.type.startsWith("image/")) {
      alert("S'il vous plaît! Select a valid image file. Jean-Pierre only designs visual masterpieces!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        stopCamera();
        onCapture(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="camera-section" className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="text-center mb-6">
        <h2 id="studio-headline" className="text-2xl font-bold tracking-tight text-white mb-2">
          🇨🇵 Le Studio of Jean-Pierre 🇨🇵
        </h2>
        <p id="studio-subtext" className="text-slate-300 text-sm max-w-md mx-auto">
          Snap a picture with your live camera, or upload a photo to present your subject to the Grand Critic.
        </p>
      </div>

      {/* Frame Container */}
      <div
        id="camera-frame-container"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border-2 ${
          isDragActive
            ? "border-amber-400 bg-slate-900 scale-[1.01]"
            : "border-slate-700 bg-slate-950"
        }`}
      >
        {isCameraActive && !cameraError ? (
          <>
            {/* Live Camera Stream */}
            <video
              id="live-camera-video"
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Subtle Overlay Guide */}
            <div id="vignette-overlay" className="absolute inset-0 pointer-events-none border-[30px] border-slate-950/20" />
            <div id="grid-markers" className="absolute inset-x-12 inset-y-12 pointer-events-none border border-white/10 flex items-center justify-center">
              <div id="center-focus-light" className="w-16 h-16 border border-dashed border-white/20 rounded-full" />
            </div>
          </>
        ) : (
          /* Fallback Drag & Drop / Upload View */
          <div id="drag-drop-inside" className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="p-4 rounded-full bg-slate-900 border border-slate-800 mb-4 animate-bounce">
              <UploadCloud className="w-12 h-12 text-amber-400" />
            </div>
            <h3 id="drag-prompt-title" className="text-lg font-semibold text-white mb-1">
              {cameraError ? "Camera Access Blocked" : "Drop your image here"}
            </h3>
            <p id="drag-prompt-desc" className="text-sm text-slate-400 max-w-sm mb-6">
              Drag and drop any picture from your device, or click below to select a file manually.
            </p>

            <label
              id="browse-files-label"
              className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-medium transition-all shadow-md flex items-center gap-2 cursor-pointer text-sm"
            >
              <FileImage className="w-4 h-4" />
              Browse Image File
              <input
                id="camera-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {cameraError && (
              <p id="camera-error-hint" className="mt-6 text-xs text-amber-400/90 max-w-md italic leading-relaxed">
                {cameraError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div id="camera-controls-row" className="flex flex-wrap gap-4 mt-8 w-full justify-center">
        {isCameraActive && !cameraError && (
          <>
            <button
              id="snap-picture-btn"
              onClick={captureSnapshot}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-bold tracking-wide shadow-lg hover:shadow-xl active:scale-95 transition-all text-base flex items-center gap-3 border border-amber-300"
            >
              <Camera className="w-5 h-5 fill-current" />
              SNAP MASTERPIECE
            </button>
            <button
              id="upload-instead-btn"
              onClick={stopCamera}
              className="px-5 py-4 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-all text-sm flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Photo Instead
            </button>
          </>
        )}

        {!isCameraActive && !cameraError && (
          <button
            id="re-enable-camera-btn"
            onClick={startCamera}
            className="px-6 py-3 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-500 text-amber-400 font-semibold transition-all text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Reactivating Live Camera
          </button>
        )}
      </div>
    </div>
  );
}
