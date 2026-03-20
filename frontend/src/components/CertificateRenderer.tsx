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
  if (!text) return "";
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
        style={{
          position: "relative",
          overflow: "hidden",
          width: isLandscape ? "842px" : "595px",
          height: isLandscape ? "595px" : "842px",
          backgroundColor: bgColor,
          fontFamily,
          color: fontColor,
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          ...patternStyle,
        }}
      >
        {/* Decorative border */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            bottom: "12px",
            left: "12px",
            border: `2px solid ${secondaryColor}`,
            borderRadius: "2px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            bottom: "20px",
            left: "20px",
            border: `1px solid ${secondaryColor}55`,
            borderRadius: "2px",
          }}
        />

        {/* Corner ornaments */}
        {[
          { top: "24px", left: "24px" },
          { top: "24px", right: "24px" },
          { bottom: "24px", left: "24px" },
          { bottom: "24px", right: "24px" },
        ].map((posStyle, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              ...posStyle,
              width: "24px",
              height: "24px",
              borderTop: i < 2 ? `3px solid ${secondaryColor}` : "none",
              borderBottom: i >= 2 ? `3px solid ${secondaryColor}` : "none",
              borderLeft: i % 2 === 0 ? `3px solid ${secondaryColor}` : "none",
              borderRight: i % 2 !== 0 ? `3px solid ${secondaryColor}` : "none",
            }}
          />
        ))}

        {/* Content */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "48px",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", paddingTop: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "18px",
                  backgroundColor: primaryColor,
                }}
              >
                D
              </div>
            </div>
            <p
              style={{
                fontSize: "12px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: secondaryColor,
                marginBottom: "4px",
              }}
            >
              {data.templateSubtitle || "Certificate of Completion"}
            </p>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                letterSpacing: "-0.025em",
                color: primaryColor,
                margin: 0,
              }}
            >
              {data.templateTitle}
            </h1>
          </div>

          {/* Body */}
          <div
            style={{
              textAlign: "center",
              maxWidth: "448px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: `${fontColor}99`,
                margin: 0,
              }}
            >
              This certificate is awarded to
            </p>
            <p
              style={{
                fontSize: "30px",
                fontWeight: "bold",
                color: primaryColor,
                margin: 0,
              }}
            >
              {data.recipientName}
            </p>
            <div
              style={{
                width: "96px",
                borderTop: `2px solid ${secondaryColor}`,
                margin: "0 auto",
              }}
            />
            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.625",
                whiteSpace: "pre-line",
                color: `${fontColor}cc`,
                margin: 0,
              }}
            >
              {processedBody}
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              paddingTop: "16px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              {data.signatureImageUrl ? (
                <img
                  src={data.signatureImageUrl}
                  alt="Signature"
                  style={{
                    display: "block",
                    margin: "0 auto 4px",
                    height: "40px",
                    maxWidth: "120px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    marginBottom: "4px",
                    width: "128px",
                    borderTop: `1px solid ${primaryColor}`,
                  }}
                />
              )}
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: primaryColor,
                  margin: 0,
                }}
              >
                {data.issuerName}
              </p>
              {data.issuerTitle && (
                <p
                  style={{
                    fontSize: "12px",
                    color: `${fontColor}99`,
                    margin: "2px 0 0",
                  }}
                >
                  {data.issuerTitle}
                </p>
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              {data.sealImageUrl ? (
                <img
                  src={data.sealImageUrl}
                  alt="Seal"
                  style={{
                    display: "block",
                    margin: "0 auto 8px",
                    height: "56px",
                    width: "56px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    border: `2px solid ${secondaryColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: secondaryColor,
                    }}
                  >
                    SEAL
                  </span>
                </div>
              )}
              <p
                style={{
                  fontSize: "10px",
                  color: `${fontColor}66`,
                  margin: 0,
                }}
              >
                {data.issueDate}
              </p>
            </div>

            {showCertNum && (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    marginBottom: "4px",
                    width: "128px",
                    borderTop: `1px solid ${primaryColor}`,
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: `${fontColor}99`,
                    margin: 0,
                  }}
                >
                  Certificate No.
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: primaryColor,
                    margin: "2px 0 0",
                  }}
                >
                  {data.certificateNumber}
                </p>
              </div>
            )}
          </div>

          {/* Mascot watermark */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "32px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              opacity: 0.4,
            }}
          >
            <img
              src={mascotImg}
              alt=""
              style={{ height: "16px", width: "16px", objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: "7px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 500,
                color: primaryColor,
              }}
            >
              Verified by TRUSTIFICATE
            </span>
          </div>
        </div>
      </div>
    );
  }
);

CertificateRenderer.displayName = "CertificateRenderer";

