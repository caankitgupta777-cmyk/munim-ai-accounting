import React from "react";

interface MunimLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const MunimLogo: React.FC<MunimLogoProps> = ({
  size = "md",
  animated = false,
  className = "",
  showText = false,
  textClassName = "",
}) => {
  const sizeMap = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const svgDimensions = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  const dim = svgDimensions[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]}`}>
        {/* Subtle Ambient Glow */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600/40 via-cyan-500/30 to-emerald-400/20 blur-md ${
            animated ? "animate-pulse" : ""
          }`}
        />

        {/* Logo Container */}
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-[#102A43] to-[#071A2B] border border-[#1E3A56] p-1.5 shadow-lg flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="mGradient" x1="8" y1="40" x2="40" y2="8" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3B82F6" />
                <stop offset="0.6" stopColor="#22D3EE" />
                <stop offset="1" stopColor="#38BDF8" />
              </linearGradient>
              <linearGradient id="sparkGradient" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22D3EE" />
                <stop offset="1" stopColor="#10B981" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Stylized Modern 'M' for Munim */}
            <path
              d="M10 38V15L22 28L34 15V38"
              stroke="url(#mGradient)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Subtle ledger baseline accent */}
            <path
              d="M8 41H36"
              stroke="#1E3A56"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* AI Spark / Node on upper right peak of M */}
            <g className={animated ? "animate-pulse origin-center" : ""}>
              {/* Outer halo */}
              <circle cx="37" cy="11" r="5" fill="#22D3EE" fillOpacity="0.25" />
              {/* 4-point Diamond Spark */}
              <path
                d="M37 6L38.8 9.2L42 11L38.8 12.8L37 16L35.2 12.8L32 11L35.2 9.2Z"
                fill="url(#sparkGradient)"
                filter="url(#glow)"
              />
              <circle cx="37" cy="11" r="1.5" fill="#FFFFFF" />
            </g>
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight text-white ${textClassName || "text-xl"}`}>
              Munim <span className="text-cyan-400">AI</span>
            </span>
            <span className="text-[11px] text-slate-300 font-medium">
              - Made by <span className="text-cyan-300 font-semibold">CA Ankit Gupta</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium tracking-tight">
            Your AI Accountant
          </span>
        </div>
      )}
    </div>
  );
};
