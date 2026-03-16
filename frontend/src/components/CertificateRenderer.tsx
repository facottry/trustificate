import { forwardRef } from "react";
import mascotImg from "@/assets/mascot.png";

interface CertificateData {
  recipientName: string;
  courseName?: string;
  trainingName?: string;
  companyName?: string;
  score?: string;
  issueDate: string;
  completionDate?: string;
  durationText?: string;
  issuerName: string;
  issuerTitle?: string;
  certificateNumber: string;
  templateTitle: string;
  templateSubtitle?: string;
  bodyText: string;
  colorTheme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    fontColor?: string;
    fontFamily?: string;
  };
  backgroundPattern?: string;
  signatureImageUrl?: string;
  sealImageUrl?: string;
  showCertNumber?: boolean;
  layout?: "portrait" | "landscape";
}

function replacePlaceholders(text: string, data: CertificateData): string {
  return text
    .replace(/\{\{recipient_name\}\}/g, data.recipientName)
    .replace(/\{\{course_name\}\}/g, data.courseName || "")
    .replace(/\{\{training_name\}\}/g, data.trainingName || "")
    .replace(/\{\{company_name\}\}/g, data.companyName || "")
    .replace(/\{\{score\}\}/g, data.score || "")
    .replace(/\{\{issue_date\}\}/g, data.issueDate)
    .replace(/\{\{completion_date\}\}/g, data.completionDate || "")
    .replace(/\{\{duration_text\}\}/g, data.durationText || "")
    .replace(/\{\{issuer_name\}\}/g, data.issuerName)
    .replace(/\{\{issuer_title\}\}/g, data.issuerTitle || "")
    .replace(/\{\{certificate_number\}\}/g, data.certificateNumber);
}

function getPatternStyle(pattern: string, secondaryColor: string): React.CSSProperties {
  const opacity = "0.06";
  switch (pattern) {
    case "dots":
      return {
        backgroundImage: `radial-gradient(circle, ${secondaryColor} 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${secondaryColor}${opacity} 1px, transparent 1px), linear-gradient(90deg, ${secondaryColor}${opacity} 1px, transparent 1px)`,
        backgroundSize: "30px 30px",
      };
    case "diagonal":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${secondaryColor}10 10px, ${secondaryColor}10 11px)`,
      };
    case "waves":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, ${secondaryColor}08 20px, ${secondaryColor}08 21px), repeating-linear-gradient(90deg, transparent, transparent 40px, ${secondaryColor}06 40px, ${secondaryColor}06 41px)`,
      };
    case "floral":
      return {
        backgroundImage: `radial-gradient(ellipse at 0% 0%, ${secondaryColor}12 0%, transparent 50%), radial-gradient(ellipse at 100% 100%, ${secondaryColor}12 0%, transparent 50%)`,
      };
    default:
      return {};
  }
}

export const CertificateRenderer = forwardRef<HTMLDivElement, { data: CertificateData }>(
  ({ data }, ref) => {
    const isLandscape = data.layout === "landscape";
    const theme = data.colorTheme || {};
    const primaryColor = theme.primary || "#0a4f5c";
    const secondaryColor = theme.secondary || "#d4a853";
    const bgColor = theme.background || "#fffdf5";
    const fontColor = theme.fontColor || "#374151";
    const fontFamily = theme.fontFamily || "'Plus Jakarta Sans', sans-serif";
    const pattern = data.backgroundPattern || "none";
    const showCertNum = data.showCertNumber !== false;

    const processedBody = replacePlaceholders(data.bodyText, data);
    const patternStyle = getPatternStyle(pattern, secondaryColor);

    return (
      <div
        ref={ref}
        className="relative overflow-hidden shadow-lg"
        style={{
          width: isLandscape ? "842px" : "595px",
          height: isLandscape ? "595px" : "842px",
          backgroundColor: bgColor,
          fontFamily,
          color: fontColor,
          ...patternStyle,
        }}
      >
        {/* Decorative border */}
        <div
          className="absolute inset-3 border-2 rounded-sm"
          style={{ borderColor: secondaryColor }}
        />
        <div
          className="absolute inset-5 border rounded-sm"
          style={{ borderColor: `${secondaryColor}55` }}
        />

        {/* Corner ornaments */}
        {[
          "top-6 left-6",
          "top-6 right-6",
          "bottom-6 left-6",
          "bottom-6 right-6",
        ].map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} h-6 w-6`}
            style={{
              borderTop: i < 2 ? `3px solid ${secondaryColor}` : "none",
              borderBottom: i >= 2 ? `3px solid ${secondaryColor}` : "none",
              borderLeft: i % 2 === 0 ? `3px solid ${secondaryColor}` : "none",
              borderRight: i % 2 !== 0 ? `3px solid ${secondaryColor}` : "none",
            }}
          />
        ))}

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-between p-12">
          {/* Header */}
          <div className="text-center space-y-1 pt-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: primaryColor }}
              >
                D
              </div>
            </div>
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: secondaryColor }}>
              {data.templateSubtitle || "Certificate of Completion"}
            </p>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: primaryColor }}
            >
              {data.templateTitle}
            </h1>
          </div>

          {/* Body */}
          <div className="text-center max-w-md space-y-4 flex-1 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em]" style={{ color: `${fontColor}99` }}>
              This certificate is awarded to
            </p>
            <p
              className="text-3xl font-bold"
              style={{ color: primaryColor }}
            >
              {data.recipientName}
            </p>
            <div className="mx-auto w-24 border-t-2" style={{ borderColor: secondaryColor }} />
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: `${fontColor}cc` }}>
              {processedBody}
            </p>
          </div>

          {/* Footer */}
          <div className="w-full flex items-end justify-between pt-4">
            <div className="text-center">
              {data.signatureImageUrl ? (
                <img src={data.signatureImageUrl} alt="Signature" className="mx-auto mb-1 h-10 max-w-[120px] object-contain" />
              ) : (
                <div className="mb-1 w-32 border-t" style={{ borderColor: primaryColor }} />
              )}
              <p className="text-sm font-semibold" style={{ color: primaryColor }}>
                {data.issuerName}
              </p>
              {data.issuerTitle && (
                <p className="text-xs" style={{ color: `${fontColor}99` }}>{data.issuerTitle}</p>
              )}
            </div>

            <div className="text-center">
              {data.sealImageUrl ? (
                <img src={data.sealImageUrl} alt="Seal" className="mx-auto mb-2 h-14 w-14 object-contain" />
              ) : (
                <div
                  className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2"
                  style={{ borderColor: secondaryColor }}
                >
                  <span className="text-xs font-bold" style={{ color: secondaryColor }}>
                    SEAL
                  </span>
                </div>
              )}
              <p className="text-[10px]" style={{ color: `${fontColor}66` }}>{data.issueDate}</p>
            </div>

            {showCertNum && (
              <div className="text-center">
                <div className="mb-1 w-32 border-t" style={{ borderColor: primaryColor }} />
                <p className="text-xs" style={{ color: `${fontColor}99` }}>Certificate No.</p>
                <p className="text-xs font-mono font-semibold" style={{ color: primaryColor }}>
                  {data.certificateNumber}
                </p>
              </div>
            )}
          </div>

          {/* Mascot watermark */}
          <div className="absolute bottom-3 right-8 flex items-center gap-1 opacity-40">
            <img src={mascotImg} alt="" className="h-4 w-4 object-contain" />
            <span className="text-[7px] tracking-widest uppercase font-medium" style={{ color: primaryColor }}>
              Verified by TRUSTIFICATE
            </span>
          </div>
        </div>
      </div>
    );
  }
);

CertificateRenderer.displayName = "CertificateRenderer";

