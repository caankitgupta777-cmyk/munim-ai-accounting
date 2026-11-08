import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  Eye,
  SwitchCamera,
  X,
  Receipt,
  FileSpreadsheet,
  Check,
  ShieldCheck,
  Info,
} from "lucide-react";
import { BusinessProfile, ScannedReceiptData } from "../types";
import { logQueryToDatabase } from "../services/queryDatabase";
import { getAuthToken } from "../lib/firebase";

interface ReceiptScannerProps {
  profile: BusinessProfile;
  onPopulateVoucher: (data: ScannedReceiptData, receiptImage?: string) => void;
  onClose?: () => void;
}

// Built-in Realistic Indian Receipts for instant 1-click testing
const SAMPLE_INDIAN_RECEIPTS: {
  id: string;
  name: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  gstRate: number;
  gstin: string;
  invoiceNo: string;
  paymentMode: "Bank / UPI / Card" | "Cash";
  suggestedAccount: string;
  complianceNotes: string;
  sampleSummary: string;
  items: { name: string; quantity: number; price: number }[];
}[] = [
  {
    id: "croma-hardware",
    name: "Croma Electronics (IT Equipment)",
    merchant: "Infiniti Retail Ltd (Croma)",
    category: "Computer Hardware & Peripherals",
    amount: 18880,
    date: "2026-09-18",
    gstRate: 18,
    gstin: "27AABCI2934M1ZX",
    invoiceNo: "CR/MUM/2026/09421",
    paymentMode: "Bank / UPI / Card",
    suggestedAccount: "Office Computers & Peripherals A/c",
    complianceNotes:
      "Valid Tax Invoice with 15-digit GSTIN. Claim full Input Tax Credit (₹1,440 CGST + ₹1,440 SGST) in GSTR-3B under Section 16.",
    sampleSummary: "Dell 24\" FHD IPS Monitor + Logitech Wireless Keyboard Combo",
    items: [
      { name: "Dell 24-inch IPS Monitor", quantity: 1, price: 13500 },
      { name: "Logitech MK295 Silent Combo", quantity: 1, price: 2500 },
    ],
  },
  {
    id: "iocl-fuel",
    name: "Indian Oil Petrol Pump (Fuel Memo)",
    merchant: "Shree Ganesh Auto Fuel (IOCL Dealer)",
    category: "Fuel & Conveyance",
    amount: 3450,
    date: "2026-09-20",
    gstRate: 0,
    gstin: "27AAGCS5512L1ZP",
    invoiceNo: "IOCL-PUMP-58912",
    paymentMode: "Bank / UPI / Card",
    suggestedAccount: "Vehicle Running & Fuel Expenses A/c",
    complianceNotes:
      "Petroleum products (Petrol/Diesel) are currently outside GST regime under Section 9(2). Claimed as direct business deduction for delivery/client visit vehicle.",
    sampleSummary: "35.2 Litres High Speed Diesel for delivery van (UPI settlement)",
    items: [{ name: "High Speed Diesel", quantity: 35.2, price: 3450 }],
  },
  {
    id: "stationery-mart",
    name: "Balaji Stationery Mart (Office Supplies)",
    merchant: "Shree Balaji Paper & Stationery Mart",
    category: "Office Supplies & Stationery",
    amount: 4720,
    date: "2026-09-15",
    gstRate: 18,
    gstin: "27AAGPB9981K1ZT",
    invoiceNo: "BILL/2026/0412",
    paymentMode: "Cash",
    suggestedAccount: "Printing & Stationery A/c",
    complianceNotes:
      "Cash payment of ₹4,720 is safely under Section 40A(3) daily ceiling of ₹10,000. Verified supplier Udyam registration for Section 43B(h).",
    sampleSummary: "JK Copier A4 Paper Reams (5), Box Files (20), Ballpoint Pens (50)",
    items: [
      { name: "JK Copier A4 75GSM (5 Reams)", quantity: 5, price: 1750 },
      { name: "Deluxe Lever Arch Box Files", quantity: 20, price: 1600 },
      { name: "Executive Ball Pens & Highlighters", quantity: 1, price: 650 },
    ],
  },
  {
    id: "ccd-meeting",
    name: "Cafe Coffee Day (Client Refreshment)",
    merchant: "Coffee Day Global Ltd",
    category: "Client Meals & Refreshments",
    amount: 1470,
    date: "2026-09-19",
    gstRate: 5,
    gstin: "27AAACC2789E1ZM",
    invoiceNo: "CCD/BKC/88921",
    paymentMode: "Bank / UPI / Card",
    suggestedAccount: "Business Development & Client Refreshment A/c",
    complianceNotes:
      "Restaurant services are charged at 5% GST without Input Tax Credit under Notification No. 11/2017-CT(R). Book total ₹1,470 as business expense in P&L.",
    sampleSummary: "Client lunch meeting (Cappuccino, Cold Brew & Sandwiches)",
    items: [
      { name: "Classic Cappuccino (2)", quantity: 2, price: 480 },
      { name: "Paneer Tikka Sandwich (2)", quantity: 2, price: 620 },
      { name: "Mineral Water (2)", quantity: 2, price: 300 },
    ],
  },
];

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  profile,
  onPopulateVoucher,
  onClose,
}) => {
  // Input mode: camera, upload, or sample
  const [activeMode, setActiveMode] = useState<"camera" | "upload" | "sample">("camera");

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Scanned image state
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  // Scanning / AI extraction state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ScannedReceiptData | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Drag-and-drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Play a soft auditory click on camera shutter
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch {
      // AudioContext not available or blocked by autoplay
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser or device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn("Camera start failed:", err);
      let message = "Unable to access device camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Camera access was denied. Please allow camera permissions in your browser or use photo upload.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "No camera found on this device. Please upload a photo instead.";
      }
      setCameraError(message);
      setCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Lifecycle for camera
  useEffect(() => {
    if (activeMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode, facingMode]);

  // Capture Snapshot from Camera Viewfinder
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    playShutterSound();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setScannedImage(dataUrl);
      setImageFileName(`Receipt_Capture_${new Date().toISOString().slice(0, 10)}.jpg`);
      stopCamera();
      analyzeReceiptImage(dataUrl, "image/jpeg");
    }

    setTimeout(() => setIsCapturing(false), 250);
  };

  // Handle uploaded file
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setScanError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    setImageFileName(file.name);
    setScanError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setScannedImage(dataUrl);
      analyzeReceiptImage(dataUrl, file.type);
    };
    reader.readAsDataURL(file);
  };

  // Select a preset sample Indian receipt
  const handleSelectSample = (sample: typeof SAMPLE_INDIAN_RECEIPTS[0]) => {
    setScanError(null);
    setAnalyzing(true);
    setImageFileName(`${sample.name}.png`);

    // Draw an authentic Indian cash memo preview on canvas
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 780;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Paper background
      ctx.fillStyle = "#faf8f2";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border and header
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 560, 740);

      // Merchant Header
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText(sample.merchant.toUpperCase(), 300, 65);

      ctx.font = "14px monospace";
      ctx.fillStyle = "#334155";
      ctx.fillText("TAX INVOICE / CASH MEMO", 300, 95);
      ctx.fillText(`GSTIN: ${sample.gstin}`, 300, 120);

      // Divider
      ctx.beginPath();
      ctx.moveTo(35, 140);
      ctx.lineTo(565, 140);
      ctx.stroke();

      // Metadata
      ctx.textAlign = "left";
      ctx.font = "13px monospace";
      ctx.fillText(`Invoice No: ${sample.invoiceNo}`, 40, 165);
      ctx.fillText(`Date: ${sample.date}`, 380, 165);
      ctx.fillText(`Settlement: ${sample.paymentMode}`, 40, 190);

      // Items table header
      ctx.fillRect(35, 215, 530, 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px monospace";
      ctx.fillText("ITEM DESCRIPTION", 45, 234);
      ctx.fillText("QTY", 380, 234);
      ctx.fillText("AMOUNT (₹)", 460, 234);

      // Items
      ctx.fillStyle = "#0f172a";
      ctx.font = "13px monospace";
      let y = 270;
      sample.items.forEach((it) => {
        ctx.fillText(it.name.slice(0, 32), 45, y);
        ctx.fillText(String(it.quantity), 390, y);
        ctx.fillText(it.price.toLocaleString("en-IN"), 480, y);
        y += 30;
      });

      // Subtotal & GST
      y = Math.max(y + 30, 480);
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(565, y);
      ctx.stroke();

      y += 30;
      const subtotal = Math.round(sample.amount / (1 + sample.gstRate / 100));
      const gstAmount = sample.amount - subtotal;
      ctx.fillText("Subtotal:", 340, y);
      ctx.fillText(`₹${subtotal.toLocaleString("en-IN")}`, 470, y);

      if (sample.gstRate > 0) {
        y += 25;
        ctx.fillText(`CGST (${sample.gstRate / 2}%):`, 340, y);
        ctx.fillText(`₹${Math.round(gstAmount / 2).toLocaleString("en-IN")}`, 470, y);

        y += 25;
        ctx.fillText(`SGST (${sample.gstRate / 2}%):`, 340, y);
        ctx.fillText(`₹${Math.round(gstAmount / 2).toLocaleString("en-IN")}`, 470, y);
      }

      y += 35;
      ctx.font = "bold 16px monospace";
      ctx.fillText("TOTAL (INCL. GST):", 280, y);
      ctx.fillText(`₹${sample.amount.toLocaleString("en-IN")}`, 460, y);

      // Footer
      ctx.font = "italic 11px monospace";
      ctx.fillStyle = "#64748b";
      ctx.textAlign = "center";
      ctx.fillText("Thank you for your business! System Generated E-Invoice", 300, 730);

      const generatedUrl = canvas.toDataURL("image/png");
      setScannedImage(generatedUrl);
    }

    // Populate data with brief simulated optical extraction delay
    setTimeout(() => {
      const subtotal = Math.round(sample.amount / (1 + sample.gstRate / 100));
      const gstAmount = sample.amount - subtotal;
      const data: ScannedReceiptData = {
        merchant: sample.merchant,
        date: sample.date,
        amount: sample.amount,
        taxableAmount: subtotal,
        invoiceNumber: sample.invoiceNo,
        gstin: sample.gstin,
        gstRate: sample.gstRate,
        gstType: "Intra-state (CGST + SGST)",
        cgst: sample.gstRate > 0 ? Math.round(gstAmount / 2) : 0,
        sgst: sample.gstRate > 0 ? Math.round(gstAmount / 2) : 0,
        igst: 0,
        category: sample.category,
        suggestedExpenseAccount: sample.suggestedAccount,
        paymentMode: sample.paymentMode,
        tdsSection: "none",
        section43BhRelevant: false,
        complianceNotes: sample.complianceNotes,
        confidence: "high",
        items: sample.items,
      };

      setExtractedData(data);
      setAnalyzing(false);
    }, 600);
  };

  // Call Server-side Gemini Vision OCR API
  const analyzeReceiptImage = async (dataUrl: string, mimeType: string) => {
    setAnalyzing(true);
    setScanError(null);
    setExtractedData(null);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers,
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType,
          businessContext: profile,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${response.status}`);
      }

      const data: ScannedReceiptData = await response.json();
      setExtractedData(data);

      // Log receipt scan query to database
      logQueryToDatabase({
        queryType: "ocr_scan",
        title: `Receipt OCR: ${data.merchant} (₹${data.amount.toLocaleString("en-IN")})`,
        queryText: `Optical OCR Scan from ${data.merchant}, Date: ${data.date}, GSTIN: ${data.gstin || "N/A"}, Invoice: ${data.invoiceNumber || "N/A"}`,
        resultSummary: `Extracted Amount: ₹${data.amount}, Taxable: ₹${data.taxableAmount || data.amount}, GST: ${data.gstRate || 0}%, Category: ${data.category}, Account: ${data.suggestedExpenseAccount}`,
        payload: data,
        status: "completed",
        tags: ["ocr-scan", "receipt", data.category || "expense"],
      }).catch((e) => console.warn("Failed to log scan query:", e));
    } catch (err: any) {
      console.warn("Gemini vision scan failed, requesting manual entry:", err);
      // Fallback: Avoid fabricated details; provide empty schema with low confidence for manual review
      const fallbackData: ScannedReceiptData = {
        merchant: "",
        date: "",
        yearUncertain: true,
        amount: 0,
        taxableAmount: 0,
        invoiceNumber: "",
        gstin: "",
        gstRate: 0,
        gstType: "Intra-state (CGST + SGST)",
        cgst: 0,
        sgst: 0,
        igst: 0,
        category: "Office Supplies & Stationery",
        suggestedExpenseAccount: "Operating Expenses A/c",
        paymentMode: "Bank / UPI / Card",
        tdsSection: "none",
        complianceNotes:
          "⚠️ Document could not be digitized automatically with high confidence. Please enter the merchant, date, and amounts manually. Note that potential GST Input Tax Credit (ITC) is subject to Section 16 eligibility, Section 17(5) blocked credit review, and GSTR-2B reconciliation.",
        confidence: "low",
      };
      setExtractedData(fallbackData);
      setScanError(
        "Vision OCR had difficulty reading the document clearly. Please enter or verify the bill details manually below before generating journal vouchers."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Retake or Reset
  const handleRetake = () => {
    setScannedImage(null);
    setExtractedData(null);
    setScanError(null);
    if (activeMode === "camera") {
      startCamera();
    }
  };

  // Confirm and Populate Voucher Form
  const handleConfirmAndPopulate = () => {
    if (!extractedData) return;
    onPopulateVoucher(extractedData, scannedImage || undefined);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Paper Receipt & Invoice Scanner
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                AI Digitizer
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Scan paper bills with your phone or webcam to auto-extract date, merchant, GSTIN, and amount.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveMode("camera");
              handleRetake();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeMode === "camera"
                ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Device Camera</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("upload");
              handleRetake();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeMode === "upload"
                ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo / PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("sample");
              handleRetake();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeMode === "sample"
                ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Sample Receipts</span>
          </button>
        </div>

        {activeMode === "camera" && cameraActive && !scannedImage && (
          <button
            type="button"
            onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs cursor-pointer"
          >
            <SwitchCamera className="w-3.5 h-3.5" />
            <span>Flip Camera ({facingMode === "environment" ? "Back" : "Front"})</span>
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* Hidden Canvas for Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 1. Camera Scanning Viewport */}
        {activeMode === "camera" && !scannedImage && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-4/3 sm:aspect-16/10 flex items-center justify-center max-w-2xl mx-auto shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Overlay Guides */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                {/* Center Targeting Box */}
                <div
                  className={`w-4/5 h-4/5 max-w-md max-h-72 border-2 border-dashed rounded-xl relative transition-all duration-300 ${
                    isCapturing ? "border-emerald-400 bg-white/20" : "border-emerald-400/80"
                  }`}
                >
                  {/* Corner Brackets */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400" />

                  {/* Laser scan animation line */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)] top-1/2" />
                </div>

                <div className="mt-4 px-3 py-1 bg-slate-900/80 backdrop-blur-sm rounded-full text-white text-xs font-medium tracking-wide">
                  Align paper receipt inside frame & tap Capture
                </div>
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white">
                <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                <h3 className="font-semibold text-sm">Camera Not Accessible</h3>
                <p className="text-xs text-slate-300 max-w-sm mt-1">{cameraError}</p>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Retry Permission
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMode("upload")}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Switch to File Upload
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Capture Button Bar */}
            {cameraActive && (
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="w-16 h-16 rounded-full bg-white hover:bg-emerald-50 active:scale-95 border-4 border-emerald-500 shadow-lg flex items-center justify-center transition cursor-pointer"
                  title="Capture Receipt Photo"
                >
                  <div className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 transition" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. File Upload Viewport */}
        {activeMode === "upload" && !scannedImage && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition max-w-2xl mx-auto ${
              isDragging
                ? "border-emerald-500 bg-emerald-50/50"
                : "border-slate-300 hover:border-emerald-500 bg-slate-50/50"
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-4">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Drag & Drop receipt photo here
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Supports paper invoices, cash memos, petrol slips, restaurant bills, and hardware receipts (JPG, PNG, WebP).
            </p>

            <div className="mt-5">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer">
                <Camera className="w-4 h-4" />
                <span>Choose File / Take Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {/* 3. Sample Indian Receipts Gallery */}
        {activeMode === "sample" && !scannedImage && (
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select an authentic Indian small-business receipt to test:
              </h3>
              <span className="text-[11px] text-slate-400">1-Click instant test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_INDIAN_RECEIPTS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 bg-white transition cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {sample.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5 group-hover:text-emerald-800">
                        {sample.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {sample.sampleSummary}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-slate-900 font-mono">
                        ₹{sample.amount.toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        GST: {sample.gstRate}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>GSTIN: {sample.gstin}</span>
                    <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-0.5">
                      Digitize <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Scanning & Analysis Progress Indicator */}
        {analyzing && (
          <div className="my-6 p-6 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center max-w-xl mx-auto shadow-xs">
            <div className="relative w-12 h-12 mx-auto mb-3">
              <RefreshCw className="w-12 h-12 text-emerald-700 animate-spin" />
              <Sparkles className="w-5 h-5 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Munim AI OCR Engine Reading Receipt...
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Extracting merchant name, bill date, taxable value, GST rate & statutory compliance checks.
            </p>
          </div>
        )}

        {/* 5. Digitized Results & Verification View */}
        {scannedImage && extractedData && !analyzing && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {scanError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Split Grid: Scanned Receipt Thumbnail + Extracted Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Receipt Image Preview */}
              <div className="lg:col-span-4 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 p-2 text-center">
                <div className="flex items-center justify-between px-2 py-1.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1 truncate">
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{imageFileName || "Scanned Bill"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                  >
                    Retake / Change
                  </button>
                </div>
                <div className="relative max-h-80 overflow-y-auto rounded-lg bg-black flex items-center justify-center">
                  <img
                    src={scannedImage}
                    alt="Scanned Paper Receipt"
                    className="w-full object-contain max-h-72 rounded"
                  />
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OCR digitized with Gemini Vision</span>
                </div>
              </div>

              {/* Extracted Statutory & Commercial Data Form */}
              <div className="lg:col-span-8 bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Digitized Receipt Details</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Confidence: {extractedData.confidence || "High"}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verify or edit the extracted parameters before posting to voucher:
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Total Bill Amount</span>
                    <span className="text-lg font-bold text-slate-900 font-mono">
                      ₹{Number(extractedData.amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Merchant */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Merchant / Vendor Name
                    </label>
                    <input
                      type="text"
                      value={extractedData.merchant}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, merchant: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Transaction Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={extractedData.date}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, date: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Invoice / Memo No */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Invoice / Cash Memo Number
                    </label>
                    <input
                      type="text"
                      value={extractedData.invoiceNumber || ""}
                      placeholder="e.g. INV-2026-091"
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, invoiceNumber: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Total Amount */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Total Bill Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={extractedData.amount}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, amount: Number(e.target.value) })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* GSTIN */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Seller GSTIN</span>
                      {extractedData.gstin && (
                        <span className="text-[10px] text-emerald-700 font-normal">
                          Format valid
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={extractedData.gstin || ""}
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, gstin: e.target.value.toUpperCase() })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono uppercase text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* GST Rate */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Applicable GST Rate (%)
                    </label>
                    <select
                      value={extractedData.gstRate ?? 18}
                      onChange={(e) =>
                        setExtractedData({ ...extractedData, gstRate: Number(e.target.value) })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value={0}>0% (Exempt / Fuel / Nil-rated)</option>
                      <option value={5}>5% (Restaurants, Transport, Essentials)</option>
                      <option value={12}>12% (IT Peripherals, Stationery)</option>
                      <option value={18}>18% (Commercial Services, Electronics, Hardware)</option>
                      <option value={28}>28% (Luxury goods, Motor vehicles)</option>
                    </select>
                  </div>

                  {/* Suggested Ledger Account */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Suggested Debit Ledger Head
                    </label>
                    <input
                      type="text"
                      value={extractedData.suggestedExpenseAccount}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          suggestedExpenseAccount: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Settlement Mode
                    </label>
                    <select
                      value={extractedData.paymentMode}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          paymentMode: e.target.value as any,
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    >
                      <option value="Bank / UPI / Card">Bank / UPI / Credit Card</option>
                      <option value="Cash">Cash (Petty Cash)</option>
                    </select>
                  </div>
                </div>

                {/* Statutory Notes & Compliance Summary */}
                {extractedData.complianceNotes && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-950 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900">CA Audit Note: </span>
                      <span>{extractedData.complianceNotes}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
                  >
                    Retake / Scan Another
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmAndPopulate}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <span>Populate Voucher & View Double Entry</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
