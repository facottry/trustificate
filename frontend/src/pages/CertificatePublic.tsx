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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mascot, VerificationBadge } from "@/components/Mascot";

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
      // Query certificate with joined template (works for authed org members)
      const { data } = await supabase
        .from("certificates")
        .select("*, certificate_templates(*)")
        .eq("slug", slug)
        .single();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCert(data);
      // Use snapshot from metadata_json first, fallback to joined template
      setTemplate(getTemplateFromCertificate(data));
      setLoading(false);

      await supabase.from("certificate_events").insert({
        certificate_id: data.id,
        event_type: "viewed",
      });
    }
    fetch();
  }, [slug]);

  const handleDownload = async () => {
    if (cert?.is_external && cert?.external_pdf_url) {
      window.open(cert.external_pdf_url, "_blank");
    } else if (certRef.current && cert) {
      await generatePDF(certRef.current, `${cert.certificate_number}.pdf`);
    }
    if (cert) {
      await supabase.from("certificate_events").insert({
        certificate_id: cert.id,
        event_type: "downloaded",
      });
    }
  };

  const handleDownloadPNG = async () => {
    if (certRef.current && cert) {
      await generatePNG(certRef.current, `${cert.certificate_number}.png`);
      await supabase.from("certificate_events").insert({
        certificate_id: cert.id,
        event_type: "downloaded",
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Verification link copied");
  };

  const verificationUrl = window.location.href;
  const isValid = cert?.status === "issued";
  const isExternal = cert?.is_external;
  const theme = (template?.color_theme as any) || {};
  const bgStyle = (template?.background_style as any) || {};
  const sigConfig = (template?.signature_config as any) || {};
  const sealConfig = (template?.seal_config as any) || {};

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
      <div className="container py-8 lg:py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Verification Banner */}
          <div className={`flex items-center gap-3 rounded-lg border p-4 ${
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

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Certificate Preview */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  {isExternal ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <Globe className="h-10 w-10 text-muted-foreground/20" />
                      <div>
                        <h3 className="text-base font-medium">{cert.issuer_name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Externally Registered Certificate</p>
                      </div>
                      {cert.original_issuer && (
                        <p className="text-sm">
                          Original Issuer: <span className="font-medium">{cert.original_issuer}</span>
                        </p>
                      )}
                      {cert.external_verification_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={cert.external_verification_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Original Verification
                          </a>
                        </Button>
                      )}
                      {cert.notes && (
                        <p className="text-xs text-muted-foreground max-w-md">{cert.notes}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center overflow-auto">
                      <div className="scale-[0.55] origin-top">
                        <CertificateRenderer
                          ref={certRef}
                          data={{
                            recipientName: cert.recipient_name,
                            courseName: cert.course_name,
                            trainingName: cert.training_name,
                            companyName: cert.company_name,
                            score: cert.score,
                            issueDate: new Date(cert.issue_date).toLocaleDateString(),
                            completionDate: cert.completion_date ? new Date(cert.completion_date).toLocaleDateString() : undefined,
                            durationText: cert.duration_text,
                            issuerName: cert.issuer_name,
                            issuerTitle: cert.issuer_title,
                            certificateNumber: cert.certificate_number,
                            templateTitle: template?.title || "",
                            templateSubtitle: template?.subtitle,
                            bodyText: template?.body_text || "",
                            colorTheme: theme,
                            backgroundPattern: bgStyle.pattern,
                            signatureImageUrl: sigConfig.signature_image_url,
                            sealImageUrl: sealConfig.seal_image_url,
                            showCertNumber: sigConfig.show_cert_number !== false,
                            layout: template?.layout,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Details Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Document Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Certificate Number</p>
                    <p className="font-mono text-xs font-medium mt-0.5">{cert.certificate_number}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Recipient</p>
                    <p className="text-sm font-medium mt-0.5">{cert.recipient_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm mt-0.5">{isExternal ? "External Registration" : template?.title}</p>
                  </div>
                  {cert.course_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Course</p>
                      <p className="text-sm mt-0.5">{cert.course_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Issue Date</p>
                    <p className="text-sm mt-0.5">{new Date(cert.issue_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Issued By</p>
                    <p className="text-sm mt-0.5">{isExternal ? cert.original_issuer || cert.issuer_name : cert.issuer_name}</p>
                  </div>
                  {isExternal && (
                    <div>
                      <p className="text-xs text-muted-foreground">Registered By</p>
                      <p className="text-sm mt-0.5">TRUSTIFICATE Platform</p>
                    </div>
                  )}
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={isValid ? "default" : "destructive"} className="text-[10px] mt-1">
                      {isValid ? "Verified" : "Revoked"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Verified {new Date().toLocaleString()}
                  </div>
                  <VerificationBadge status={isValid ? "verified" : "revoked"} className="mt-2" />
                </CardContent>
              </Card>

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

              {/* QR Code */}
              <Card>
                <CardContent className="flex flex-col items-center gap-2 pt-5 pb-4">
                  <p className="text-xs font-medium text-muted-foreground">Scan to Verify</p>
                  <QRCodeSVG value={verificationUrl} size={120} />
                  <p className="text-[10px] text-muted-foreground text-center break-all max-w-[140px]">
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

