import { useEffect, useState } from "react";
import { buildTemplateSnapshot } from "@/lib/certificate-snapshot";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { usePlanGuard } from "@/hooks/usePlanGuard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ArrowLeft } from "lucide-react";

export default function CertificateNewPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { checkLimit, incrementUsage } = usePlanGuard();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [planInfo, setPlanInfo] = useState<{ plan_name?: string; usage?: number; limit?: number }>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [courseName, setCourseName] = useState("");
  const [trainingName, setTrainingName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [score, setScore] = useState("");
  const [durationText, setDurationText] = useState("");
  const [issuerName, setIssuerName] = useState("");
  const [issuerTitle, setIssuerTitle] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [completionDate, setCompletionDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!profile?.organizationId) return;
      try {
        const { data } = await apiClient<any[]>(`/api/templates`);
        setTemplates(data || []);
      } catch {
        setTemplates([]);
      }
    };
    loadTemplates();
  }, [profile?.organizationId]);

  const handleTemplateChange = (templateId: string) => {
    const t = templates.find((t) => t.id === templateId);
    setSelectedTemplate(t);
    if (t) {
      const sig = (t.signature_config as any) || {};
      setIssuerName(sig.issuer_name || "");
      setIssuerTitle(sig.issuer_title || "");
    }
  };

  const placeholders: string[] = selectedTemplate
    ? (Array.isArray(selectedTemplate.placeholders) ? selectedTemplate.placeholders : [])
    : [];

  const showField = (name: string) => placeholders.includes(name);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !recipientName.trim()) {
      toast.error("Select a template and enter recipient name");
      return;
    }
    setSaving(true);

    // Plan guard
    const guard = await checkLimit("certificates_created");
    if (!guard.allowed) {
      setPlanInfo({ plan_name: guard.plan_name, usage: guard.usage, limit: guard.limit });
      setUpgradeOpen(true);
      setSaving(false);
      return;
    }

    try {
      const { data } = await apiClient<{
        certificateNumber: string;
      }>(`/api/certificates/issue`, {
        method: "POST",
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          recipientDetails: {
            name: recipientName.trim(),
            email: recipientEmail.trim() || null,
            courseName: courseName.trim() || null,
            trainingName: trainingName.trim() || null,
            companyName: companyName.trim() || null,
            score: score.trim() || null,
            durationText: durationText.trim() || null,
            issuerName: issuerName.trim() || "TRUSTIFICATE",
            issuerTitle: issuerTitle.trim() || null,
            issueDate,
            completionDate: completionDate || null,
          },
          metadata: { template_snapshot: buildTemplateSnapshot(selectedTemplate) },
        }),
      });

      await incrementUsage("certificates_created");
      toast.success(`Certificate ${data.certificateNumber} issued!`);
      navigate("/certificates");
    } catch (error: any) {
      toast.error(error.message || "Failed to issue certificate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <AdminLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/certificates")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Issue Certificate</h1>
            <p className="text-muted-foreground">Generate a new certificate from a template</p>
          </div>
        </div>

        <form onSubmit={handleIssue} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Template</CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title} ({t.number_prefix})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templates.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No templates found.{" "}
                  <a href="/templates/new" className="text-primary hover:underline">
                    Create one first
                  </a>
                </p>
              )}
            </CardContent>
          </Card>

          {selectedTemplate && (
            <>
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
                  {(showField("course_name") || !placeholders.length) && (
                    <div className="space-y-2">
                      <Label>Course Name</Label>
                      <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} />
                    </div>
                  )}
                  {showField("training_name") && (
                    <div className="space-y-2">
                      <Label>Training Name</Label>
                      <Input value={trainingName} onChange={(e) => setTrainingName(e.target.value)} />
                    </div>
                  )}
                  {showField("company_name") && (
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                    </div>
                  )}
                  {showField("score") && (
                    <div className="space-y-2">
                      <Label>Score</Label>
                      <Input value={score} onChange={(e) => setScore(e.target.value)} placeholder="95%" />
                    </div>
                  )}
                  {showField("duration_text") && (
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input value={durationText} onChange={(e) => setDurationText(e.target.value)} placeholder="3 months" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Issue Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Issue Date</Label>
                      <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Completion Date</Label>
                      <Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Issuer Name</Label>
                      <Input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuer Title</Label>
                      <Input value={issuerTitle} onChange={(e) => setIssuerTitle(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => navigate("/certificates")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Issuing..." : "Issue Certificate"}
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </AdminLayout>
    <UpgradeModal
      open={upgradeOpen}
      onOpenChange={setUpgradeOpen}
      currentPlan={planInfo.plan_name}
      metric="certificates_created"
      usage={planInfo.usage}
      limit={planInfo.limit}
    />
    </>
  );
}

