import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Globe, Upload } from "lucide-react";

export default function ExternalCertNewPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [originalIssuer, setOriginalIssuer] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [verificationUrl, setVerificationUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !recipientName.trim() || !certNumber.trim()) {
      toast.error("Title, recipient name, and certificate number are required");
      return;
    }
    setSaving(true);

    let externalPdfUrl: string | null = null;

    // Upload PDF if provided
    if (pdfFile) {
      // Mock upload
      externalPdfUrl = `https://via.placeholder.com/600x800?text=PDF`;
    }

    const slug = `ext-${certNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

    try {
      await apiClient('/api/certificates', {
        method: 'POST',
        body: JSON.stringify({
          certificateNumber: certNumber.trim(),
          slug,
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim() || null,
          issuerName: title.trim(),
          originalIssuer: originalIssuer.trim() || null,
          issueDate,
          externalPdfUrl: externalPdfUrl,
          externalVerificationUrl: verificationUrl.trim() || null,
          notes: notes.trim() || null,
          isExternal: true,
          status: "issued",
          organizationId: profile?.organization_id,
          createdBy: user?.id,
        }),
      });
      setSaving(false);
      toast.success("External certificate registered!");
      navigate("/registry");
    } catch (err: any) {
      setSaving(false);
      toast.error(err?.message || "Failed to register certificate");
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/registry")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Register External Certificate</h1>
            <p className="text-muted-foreground">Add a certificate issued outside TRUSTIFICATE to the registry</p>
          </div>
        </div>

        <Card className="border-accent/30">
          <CardContent className="flex items-center gap-3 py-4">
            <Globe className="h-5 w-5 text-accent shrink-0" />
            <p className="text-sm text-muted-foreground">
              External certificates will be marked as "Externally Registered" and clearly distinguished from platform-issued documents.
            </p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Certificate Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="AWS Solutions Architect Certification" required />
              </div>
              <div className="space-y-2">
                <Label>Issuer Organization</Label>
                <Input value={originalIssuer} onChange={(e) => setOriginalIssuer(e.target.value)} placeholder="Amazon Web Services" />
              </div>
              <div className="space-y-2">
                <Label>Certificate Number *</Label>
                <Input value={certNumber} onChange={(e) => setCertNumber(e.target.value)} placeholder="AWS-SAA-2026-12345" required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recipient Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Name *</Label>
                  <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Recipient Email</Label>
                  <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attachments & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Certificate PDF</Label>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors flex-1">
                    <Upload className="h-4 w-4" />
                    {pdfFile ? pdfFile.name : "Click to upload PDF"}
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>External Verification URL</Label>
                <Input value={verificationUrl} onChange={(e) => setVerificationUrl(e.target.value)} placeholder="https://verify.example.com/cert/12345" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes about this certificate..." rows={3} />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/registry")}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Registering..." : "Register Certificate"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

