import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CertificateRenderer } from "@/components/CertificateRenderer";
import { generatePDF, generatePNG } from "@/lib/pdf-generator";
import { getTemplateFromCertificate } from "@/lib/certificate-snapshot";
import { ArrowLeft, Download, ExternalLink, Ban, Clock, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function CertificateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const certRef = useRef<HTMLDivElement>(null);
  const [cert, setCert] = useState<any>(null);
  const [template, setTemplate] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetch() {
      const { data: c } = await supabase
        .from("certificates")
        .select("*, certificate_templates(*)")
        .eq("id", id)
        .single();
      if (!c) {
        toast.error("Certificate not found");
        navigate("/certificates");
        return;
      }
      setCert(c);
      setTemplate(getTemplateFromCertificate(c));

      const { data: evts } = await supabase
        .from("certificate_events")
        .select("*")
        .eq("certificate_id", id)
        .order("created_at", { ascending: false });
      setEvents(evts || []);
      setLoading(false);
    }
    fetch();
  }, [id]);

  const handleRevoke = async () => {
    if (!cert) return;
    const { error } = await supabase
      .from("certificates")
      .update({ status: "revoked" })
      .eq("id", cert.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("certificate_events").insert({
      certificate_id: cert.id,
      event_type: "revoked",
      actor_id: user?.id,
    });
    setCert({ ...cert, status: "revoked" });
    toast.success("Certificate revoked");
  };

  const handleDownload = async () => {
    if (!certRef.current) return;
    await generatePDF(certRef.current, `${cert.certificate_number}.pdf`);
  };

  const handleDownloadPNG = async () => {
    if (!certRef.current) return;
    await generatePNG(certRef.current, `${cert.certificate_number}.png`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!cert || !template) return null;

  const theme = (template.color_theme as any) || {};

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/certificates")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-mono">{cert.certificate_number}</h1>
                <Badge variant={cert.status === "issued" ? "default" : "destructive"}>
                  {cert.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">{cert.recipient_name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/certificate/${cert.slug}`} target="_blank">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Public Page
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-1.5 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPNG}>
              <Image className="mr-1.5 h-4 w-4" />
              PNG
            </Button>
            {cert.status === "issued" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Ban className="mr-1.5 h-4 w-4" />
                    Revoke
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke Certificate?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the certificate as revoked. The public verification page will show it as invalid.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevoke}>Revoke</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Certificate Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Certificate Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center overflow-auto">
              <div className="scale-[0.6] origin-top">
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
                    templateTitle: template.title,
                    templateSubtitle: template.subtitle,
                    bodyText: template.body_text,
                    colorTheme: theme,
                    layout: template.layout,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template</span>
                  <span className="font-medium">{template.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-medium">{cert.recipient_name}</span>
                </div>
                {cert.recipient_email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{cert.recipient_email}</span>
                  </div>
                )}
                {cert.course_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course</span>
                    <span>{cert.course_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue Date</span>
                  <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issuer</span>
                  <span>{cert.issuer_name}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event History</CardTitle>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events recorded</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((evt) => (
                      <div key={evt.id} className="flex items-start gap-2 text-sm">
                        <Clock className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="font-medium capitalize">{evt.event_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(evt.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
