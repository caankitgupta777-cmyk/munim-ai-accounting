import React, { useState } from "react";
import {
  Smartphone,
  Download,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Globe,
  Layers,
} from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstalled, canInstall, isAndroid, triggerInstall } = usePWAInstall();
  const [copied, setCopied] = useState<boolean>(false);
  const appUrl = window.location.href.split("?")[0];

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallClick = async () => {
    const installed = await triggerInstall();
    if (installed) {
      onClose();
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    appUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="android-modal-title"
      >
        {/* Header with Emerald Gradient */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 relative">
          <button
            type="button"
            id="btn-close-android-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-2 shadow-md shrink-0 flex items-center justify-center">
              <img src="/icon.svg" alt="IndiaLedger App Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 mb-1">
                <Smartphone className="w-3 h-3 text-emerald-300" />
                <span>Android App & PWA</span>
              </div>
              <h2 id="android-modal-title" className="text-lg font-bold text-white leading-tight">
                IndiaLedger AI on Android
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 mt-2">
            Install on any Android smartphone or tablet with full offline caching, camera receipt scanning, and standalone home screen launch.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          {isInstalled ? (
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>The application is already running in installed Android Standalone mode!</span>
            </div>
          ) : canInstall ? (
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-emerald-950">
                <span className="font-bold block text-sm text-emerald-900">1-Tap Direct Install Ready</span>
                <span>Chrome has enabled native Android WebAPK installation.</span>
              </div>
              <button
                type="button"
                id="btn-direct-install-android"
                onClick={handleInstallClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Install App Now</span>
              </button>
            </div>
          ) : null}

          {/* Android Chrome Step-by-Step Instructions */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>How to Install on Android in 3 Steps:</span>
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <span className="font-bold text-slate-800 block">Open in Chrome for Android</span>
                  <span className="text-slate-500 text-[11px]">
                    Open this URL on your Android device (Chrome or Edge recommended).
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <span className="font-bold text-slate-800 block">Tap Menu (⋮) in Chrome</span>
                  <span className="text-slate-500 text-[11px]">
                    Tap the three dots icon in the top right corner of Google Chrome.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3 text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <span className="font-bold text-slate-800 block">Select "Install app" or "Add to Home screen"</span>
                  <span className="text-slate-500 text-[11px]">
                    Tap <strong>"Install"</strong> when prompted. The IndiaLedger app icon will appear on your Android home screen and app drawer!
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code for Instant Mobile Hand-off */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-28 h-28 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
              <img
                src={qrCodeUrl}
                alt="Scan QR code on Android phone"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <span className="text-xs font-bold text-slate-900 block">
                Scan with your Android Camera
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Scan this QR code with Google Lens or your Android Camera app to launch directly on your smartphone.
              </p>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <button
                  type="button"
                  id="btn-copy-android-url"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{copied ? "Link Copied" : "Copy App Link"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Features in Android App */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Android Native-Style Capabilities:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Standalone Launch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Service Worker Offline Cache</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Android Camera Receipt OCR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Cloud Firestore Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            PWA Manifest &amp; Service Worker Active
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
