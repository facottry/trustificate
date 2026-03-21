import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { CertificateRenderer } from "@/components/CertificateRenderer";
import { generatePDF, generatePNG } from "@/lib/pdf-generator";
import { getTemplateFromCertificate } from "@/lib/certificate-snapshot";
import { CheckCircle, XCircle, Download, Award, Globe, Copy, ExternalLink, Clock, Image } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { apiClient, PUBLIC_URL } from "@/lib/apiClient";
import { toast } from "sonner";
import { Mascot, VerificationBadge } from "@/components/Mascot";

// Scales the certificate to fill its container width responsively
function ScaledCertificate({ children, layout }: { children: React.ReactNode; layout?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // landscape cert is 1056px wide, portrait is 748px wide
    const certW = layout === "portrait" ? 748 : 1056;
    const update = () => {
      const available = el.clientWidth;
      setScale(Math.min(1, available / certW));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout]);

  // landscape cert is 748px tall, portrait is 1056px tall
  const certH = layout === "portrait" ? 1056 : 748;
  const certW = layout === "portrait" ? 748 : 1056;

  return (
    <div ref={wrapRef} className="w-full" style={{ height: certH * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: certW, height: certH }}>
        {children}
      </div>
    </div>
  );
}

export default function CertificatePublicPage() {
  const { slug } = useParams();
  const certRef = useRef<HTMLDivElement>(null);
  const [cert, setCert] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    async function fetch() {
      try {
        const { data } = await apiClient<any>(`/api/certificates/slug/${slug}`);
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setCert(data);
        setTemplate(getTemplateFromCertificate(data));
        setLoading(false);
      } catch {
        setNotFound(true);
        setLoading(false);
      }
    }
    fetch();
  }, [slug]);

  const handleDownload = async () => {
    if ((cert?.isExternal || cert?.is_external) && (cert?.externalPdfUrl || cert?.external_pdf_url)) {
      window.open(cert.externalPdfUrl || cert.external_pdf_url, "_blank");
    } else if (certRef.current && cert) {
      await generatePDF(certRef.current, `${cert.certificateNumber || cert.certificate_number}.pdf`);
    }
  };

  const handleDownloadPNG = async () => {
    if (certRef.current && cert) {
      await generatePNG(certRef.current, `${cert.certificateNumber || cert.certificate_number}.png`);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    toast.success("Verification link copied");
  };

  const verificationUrl = `${PUBLIC_URL}/certificate/${slug}`;
  const isValid = cert?.status === "issued";
  const isExternal = cert?.isExternal || cert?.is_external;

  // Normalize field access — backend returns camelCase, some legacy code used snake_case
  const certNum = cert?.certificateNumber || cert?.certificate_number || "";
  const recipientName = cert?.recipientName || cert?.recipient_name || "";
  const courseName = cert?.courseName || cert?.course_name || "";
  const trainingName = cert?.trainingName || cert?.training_name || "";
  const companyName = cert?.companyName || cert?.company_name || "";
  const score = cert?.score || "";
  const issueDate = cert?.issueDate || cert?.issue_date;
  const completionDate = cert?.completionDate || cert?.completion_date;
  const durationText = cert?.durationText || cert?.duration_text || "";
  const issuerName = cert?.issuerName || cert?.issuer_name || "";
  const issuerTitle = cert?.issuerTitle || cert?.issuer_title || "";
  const originalIssuer = cert?.originalIssuer || cert?.original_issuer || "";
  const externalVerificationUrl = cert?.externalVerificationUrl || cert?.external_verification_url || "";
  const notes = cert?.notes || "";

  const theme = (template?.color_theme as any) || {};
  const bgStyle = (template?.background_style as any) || {};
  const sigConfig = (template?.signature_config as any) || {};
  const sealConfig = (template?.seal_config as any) || {};
  const logoConfig = (template?.logo_config as any) || {};

  const fmtDate = (d: any) => {
    if (!d) return "N/A";
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? "N/A" : parsed.toLocaleDateString();
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="container py-12">
          <div className="mx-auto max-w-4xl space-y-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (notFound) {
    return (
      <PublicLayout>
        <div className="container py-20 text-center">
          <Mascot mood="notFound" size="xl" message="This certificate could not be found." />
          <h1 className="mt-4 text-xl font-semibold">Certificate Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The certificate you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container max-w-6xl py-4 lg:py-6">
        <div className="space-y-4">
          {/* Verification Banner */}
          <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
            isValid
              ? "border-success/30 bg-success/5"
              : "border-destructive/30 bg-destructive/5"
          }`}>
            <Mascot mood={isValid ? "verified" : "error"} size="sm" showMessage={false} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${isValid ? "text-success" : "text-destructive"}`}>
                {isValid ? "Verified Document" : "Document Revoked"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isValid
                  ? "This certificate is authentic and currently valid."
                  : "This certificate has been revoked and is no longer valid."}
              </p>
            </div>
            {isExternal && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                Externally Registered
              </Badge>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            {/* Certificate Preview */}
            <Card className="overflow-hidden">
              <CardContent className="p-3">
                {isExternal ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <Globe className="h-10 w-10 text-muted-foreground/20" />
                    <div>
                      <h3 className="text-base font-medium">{issuerName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Externally Registered Certificate</p>
                    </div>
                    {originalIssuer && (
                      <p className="text-sm">
                        Original Issuer: <span className="font-medium">{originalIssuer}</span>
                      </p>
                    )}
                    {externalVerificationUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={externalVerificationUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Original Verification
                        </a>
                      </Button>
                    )}
                    {notes && (
                      <p className="text-xs text-muted-foreground max-w-md">{notes}</p>
                    )}
                  </div>
                ) : (
                  <ScaledCertificate layout={template?.layout}>
                    <CertificateRenderer
                      ref={certRef}
                      data={{
                        recipientName,
                        courseName,
                        trainingName,
                        companyName,
                        score,
                        issueDate: fmtDate(issueDate),
                        completionDate: completionDate ? fmtDate(completionDate) : undefined,
                        durationText,
                        issuerName,
                        issuerTitle,
                        certificateNumber: certNum,
                        templateTitle: template?.title || "",
                        templateSubtitle: template?.subtitle,
                        bodyText: template?.body_text || "",
                        colorTheme: theme,
                        backgroundPattern: bgStyle.pattern,
                        signatureImageUrl: sigConfig.signature_image_url,
                        sealImageUrl: sealConfig.seal_image_url,
                        showCertNumber: sigConfig.show_cert_number !== false,
                        layout: template?.layout,
                        showQrCode: template?.show_qr_code === true,
                        verificationUrl,
                        backdropImageUrl: template?.backdrop_image_url || undefined,
                        logoLayout: logoConfig.layout,
                        logoAlignment: logoConfig.alignment,
                        logoLeftUrl: logoConfig.left_url || undefined,
                        logoRightUrls: Array.isArray(logoConfig.right_urls) ? logoConfig.right_urls : [],
                      }}
                    />
                  </ScaledCertificate>
                )}
              </CardContent>
            </Card>

            {/* Details Sidebar */}
            <div className="flex flex-col gap-3">
              {/* Download buttons */}
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="flex-1" size="sm" disabled={!isValid}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button onClick={handleDownloadPNG} variant="outline" className="flex-1" size="sm" disabled={!isValid}>
                  <Image className="mr-1.5 h-3.5 w-3.5" />
                  PNG
                </Button>
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Card>
                <CardHeader className="px-4 pt-4 pb-2">
                  <CardTitle className="text-sm font-medium">Document Details</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5 text-sm">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Certificate #</p>
                    <p className="font-mono text-xs font-medium mt-0.5 break-all">{certNum}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Recipient</p>
                    <p className="text-sm font-medium mt-0.5">{recipientName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Type</p>
                    <p className="text-sm mt-0.5">{isExternal ? "External Registration" : template?.title}</p>
                  </div>
                  {courseName && (
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Course</p>
                      <p className="text-sm mt-0.5">{courseName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Issue Date</p>
                    <p className="text-sm mt-0.5">{fmtDate(issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Issued By</p>
                    <p className="text-sm mt-0.5">{isExternal ? originalIssuer || issuerName : issuerName}</p>
                  </div>
                  {isExternal && (
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Registered By</p>
                      <p className="text-sm mt-0.5">TRUSTIFICATE Platform</p>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Status</p>
                    <Badge variant={isValid ? "default" : "destructive"} className="text-[10px]">
                      {isValid ? "Verified" : "Revoked"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    {new Date().toLocaleString()}
                  </div>
                  <VerificationBadge status={isValid ? "verified" : "revoked"} className="mt-1" />
                </CardContent>
              </Card>

              {/* QR Code */}
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-4 px-4">
                  <p className="text-xs font-medium text-muted-foreground">Scan to Verify</p>
                  <QRCodeSVG value={verificationUrl} size={140} />
                  <p className="text-[10px] text-muted-foreground text-center break-all">
                    {verificationUrl}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

