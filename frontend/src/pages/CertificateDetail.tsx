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
import { ArrowLeft, Download, ExternalLink, Ban, Clock, Image, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
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
      try {
        const { data: c } = await apiClient<any>(`/api/certificates/${id}`);
        if (!c) {
          toast.error("Certificate not found");
          navigate("/documents");
          return;
        }
        setCert(c);
        setTemplate(getTemplateFromCertificate(c));
        setEvents([]);
      } catch {
        toast.error("Failed to load certificate");
        navigate("/documents");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  const handleRevoke = async () => {
    if (!cert) return;
    try {
      await apiClient(`/api/certificates/${cert._id || cert.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'revoked' }),
      });
      setCert({ ...cert, status: "revoked" });
      toast.success("Certificate revoked");
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke");
    }
  };

  const handleDelete = async () => {
    if (!cert) return;
    try {
      await apiClient(`/api/certificates/${cert._id || cert.id}`, { method: 'DELETE' });
      toast.success("Certificate deleted");
      navigate("/documents");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleDownload = async () => {
    if (!certRef.current) return;
    await generatePDF(certRef.current, `${cert.certificateNumber}.pdf`);
  };

  const handleDownloadPNG = async () => {
    if (!certRef.current) return;
    await generatePNG(certRef.current, `${cert.certificateNumber}.png`);
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-mono">{cert.certificateNumber}</h1>
                <Badge variant={cert.status === "issued" ? "default" : "destructive"}>
                  {cert.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">{cert.recipientName}</p>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Certificate?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete certificate {cert.certificateNumber}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
                    recipientName: cert.recipientName,
                    courseName: cert.courseName,
                    trainingName: cert.trainingName,
                    companyName: cert.companyName,
                    score: cert.score,
                    issueDate: new Date(cert.issueDate).toLocaleDateString(),
                    completionDate: cert.completionDate ? new Date(cert.completionDate).toLocaleDateString() : undefined,
                    durationText: cert.durationText,
                    issuerName: cert.issuerName,
                    issuerTitle: cert.issuerTitle,
                    certificateNumber: cert.certificateNumber,
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
                  <span className="font-medium">{cert.recipientName}</span>
                </div>
                {cert.recipientEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{cert.recipientEmail}</span>
                  </div>
                )}
                {cert.courseName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course</span>
                    <span>{cert.courseName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue Date</span>
                  <span>{new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issuer</span>
                  <span>{cert.issuerName}</span>
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
