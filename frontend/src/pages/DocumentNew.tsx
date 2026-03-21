import { useEffect, useState } from "react";
import { buildTemplateSnapshot } from "@/lib/certificate-snapshot";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CertificateRenderer } from "@/components/CertificateRenderer";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useAIAssist } from "@/hooks/useAIAssist";
import { usePlanGuard } from "@/hooks/usePlanGuard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ArrowLeft, ArrowRight, Check, FileText, Sparkles } from "lucide-react";
import { Mascot, MascotLoader } from "@/components/Mascot";

export default function DocumentNewPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { checkLimit, refreshUsage } = usePlanGuard();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [planInfo, setPlanInfo] = useState<{ plan_name?: string; usage?: number; limit?: number }>({});
  const [step, setStep] = useState(1);
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
  const [generatedCert, setGeneratedCert] = useState<any>(null);
  const { loading: aiLoading, getDocumentSuggestions } = useAIAssist();

  const handleAISuggest = async () => {
    if (!selectedTemplate) return;
    const suggestions = await getDocumentSuggestions({
      templateTitle: selectedTemplate.title,
      templatePrefix: selectedTemplate.number_prefix,
      recipientName, courseName, companyName,
      placeholders: placeholders,
    });
    if (suggestions) {
      if (suggestions.recipientName && !recipientName) setRecipientName(suggestions.recipientName);
      if (suggestions.recipientEmail && !recipientEmail) setRecipientEmail(suggestions.recipientEmail);
      if (suggestions.courseName && !courseName) setCourseName(suggestions.courseName);
      if (suggestions.trainingName && !trainingName) setTrainingName(suggestions.trainingName);
      if (suggestions.companyName && !companyName) setCompanyName(suggestions.companyName);
      if (suggestions.score && !score) setScore(suggestions.score);
      if (suggestions.durationText && !durationText) setDurationText(suggestions.durationText);
      if (suggestions.issuerName && !issuerName) setIssuerName(suggestions.issuerName);
      if (suggestions.issuerTitle && !issuerTitle) setIssuerTitle(suggestions.issuerTitle);
      if (suggestions.completionDate && !completionDate) setCompletionDate(suggestions.completionDate);
      toast.success("AI pre-filled the form! Review and adjust as needed.");
    }
  };

  // Auto-trigger AI when entering step 2
  const goToStep2 = () => {
    setStep(2);
    // Auto-fill with AI after a short delay so the UI renders first
    setTimeout(() => {
      if (selectedTemplate && !recipientName) {
        handleAISuggest();
      }
    }, 300);
  };

  useEffect(() => {
    if (!profile?.organization_id) return;
    apiClient<any[]>('/api/templates?isActive=true')
      .then(({ data }) => setTemplates(data || []))
      .catch(() => setTemplates([]));
  }, [profile?.organization_id]);

  const handleTemplateChange = (templateId: string) => {
    const t = templates.find((t) => (t.id || t._id) === templateId);
    setSelectedTemplate(t);
    if (t) {
      const sig = (t.configuration?.signature_config as any) || {};
      setIssuerName(sig.issuer_name || "");
      setIssuerTitle(sig.issuer_title || "");
    }
  };

  const placeholders: string[] = selectedTemplate
    ? (Array.isArray(selectedTemplate.placeholders) ? selectedTemplate.placeholders : [])
    : [];

  const showField = (name: string) => placeholders.includes(name);

  const handleSaveOrGenerate = async (isDraft: boolean) => {
    if (!selectedTemplate || !recipientName.trim()) {
      toast.error("Select a template and enter recipient name");
      return;
    }
    if (!profile?.organization_id) {
      toast.error("Organization not loaded. Please refresh and try again.");
      setSaving(false);
      return;
    }
    setSaving(true);

    // Plan guard check
    if (!isDraft) {
      const guard = await checkLimit("certificates_created");
      if (!guard.allowed) {
        setPlanInfo({ plan_name: guard.plan_name, usage: guard.usage, limit: guard.limit });
        setUpgradeOpen(true);
        setSaving(false);
        return;
      }
    }

    // Generate certificate number on backend
    const certPrefix = selectedTemplate.numberPrefix || selectedTemplate.number_prefix || "CERT";
    const certNumber = `${certPrefix}-${Date.now().toString(36).toUpperCase()}`;
    const slug = certNumber.toLowerCase().replace(/\s+/g, "-");

    try {
      const { data: certData } = await apiClient<any>('/api/certificates', {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate.id || selectedTemplate._id,
          certificateNumber: certNumber,
          slug,
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim() || null,
          courseName: courseName.trim() || null,
          trainingName: trainingName.trim() || null,
          companyName: companyName.trim() || null,
          score: score.trim() || null,
          durationText: durationText.trim() || null,
          issuerName: issuerName.trim() || "TRUSTIFICATE",
          issuerTitle: issuerTitle.trim() || null,
          issueDate,
          completionDate: completionDate || null,
          organizationId: profile.organization_id,
          createdBy: user?.id,
          status: isDraft ? "draft" : "issued",
          metadataJson: { template_snapshot: buildTemplateSnapshot(selectedTemplate) },
        }),
      });

      if (!isDraft) {
        await refreshUsage();
      }

      setGeneratedCert(certData);
      setSaving(false);

      if (isDraft) {
        toast.success("Draft saved!");
        navigate("/documents");
      } else {
        setStep(4);
        toast.success(`Document ${certNumber} generated!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create certificate");
      setSaving(false);
    }
  };

  const handleGenerate = () => handleSaveOrGenerate(false);
  const handleSaveDraft = () => handleSaveOrGenerate(true);

  const theme = (selectedTemplate?.configuration?.color_theme as any) || {};
  const bgStyle = (selectedTemplate?.configuration?.background_style as any) || {};
  const sigConfig = (selectedTemplate?.configuration?.signature_config as any) || {};

  const steps = [
    { num: 1, label: "Select Template" },
    { num: 2, label: "Fill Details" },
    { num: 3, label: "Preview" },
    { num: 4, label: "Generated" },
  ];

  return (
    <>
    <AdminLayout>
      <div className="max-w-3xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Issue Document</h1>
            <p className="text-muted-foreground">Generate a new certificate from a template</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`text-sm hidden sm:inline ${step >= s.num ? "font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="h-px w-8 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Template */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Template</CardTitle>
              <CardDescription>Choose a document blueprint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active templates. <a href="/templates/new" className="text-primary hover:underline">Create one first</a>
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {templates.map((t) => {
                    const tTheme = (t.configuration?.color_theme as any) || {};
                    const tId = t.id || t._id;
                    return (
                      <div
                        key={tId}
                        onClick={() => handleTemplateChange(tId)}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                          (selectedTemplate?.id || selectedTemplate?._id) === tId ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-white font-bold text-xs"
                            style={{ backgroundColor: tTheme.primary || "hsl(192,85%,22%)" }}
                          >
                            {(t.numberPrefix || t.number_prefix)?.charAt(0) || "C"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{t.title}</p>
                            <p className="text-xs text-muted-foreground">{t.numberPrefix || t.number_prefix} · {t.layout}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={goToStep2} disabled={!selectedTemplate}>
                  Next <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Fill Details */}
        {step === 2 && selectedTemplate && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Document Details</CardTitle>
                  <CardDescription>Enter recipient and certificate information</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleAISuggest} disabled={aiLoading}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {aiLoading ? "Thinking..." : "AI Fill"}
                </Button>
              </div>
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
                <div className="space-y-2"><Label>Course Name</Label><Input value={courseName} onChange={(e) => setCourseName(e.target.value)} /></div>
              )}
              {showField("training_name") && (
                <div className="space-y-2"><Label>Training Name</Label><Input value={trainingName} onChange={(e) => setTrainingName(e.target.value)} /></div>
              )}
              {showField("company_name") && (
                <div className="space-y-2"><Label>Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
              )}
              {showField("score") && (
                <div className="space-y-2"><Label>Score</Label><Input value={score} onChange={(e) => setScore(e.target.value)} placeholder="95%" /></div>
              )}
              {showField("duration_text") && (
                <div className="space-y-2"><Label>Duration</Label><Input value={durationText} onChange={(e) => setDurationText(e.target.value)} placeholder="3 months" /></div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Issue Date</Label><Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></div>
                <div className="space-y-2"><Label>Completion Date</Label><Input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Issuer Name</Label><Input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Issuer Title</Label><Input value={issuerTitle} onChange={(e) => setIssuerTitle(e.target.value)} /></div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleSaveDraft} disabled={saving || !recipientName.trim()}>
                    {saving ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!recipientName.trim()}>
                    Preview <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Preview */}
        {step === 3 && selectedTemplate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificate Preview</CardTitle>
              <CardDescription>Review before generating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center overflow-auto">
                <div className="scale-[0.5] origin-top">
                  <CertificateRenderer
                    data={{
                      recipientName, courseName, trainingName, companyName, score,
                      issueDate: new Date(issueDate).toLocaleDateString(),
                      completionDate: completionDate ? new Date(completionDate).toLocaleDateString() : undefined,
                      durationText, issuerName: issuerName || "TRUSTIFICATE", issuerTitle,
                      certificateNumber: `${selectedTemplate.numberPrefix || selectedTemplate.number_prefix || "CERT"}-XXXX-XXXXXX`,
                      templateTitle: selectedTemplate.title,
                      templateSubtitle: selectedTemplate.configuration?.subtitle,
                      bodyText: selectedTemplate.configuration?.body_text || "",
                      colorTheme: theme,
                      backgroundPattern: bgStyle.pattern,
                      signatureImageUrl: sigConfig.signature_image_url,
                      sealImageUrl: ((selectedTemplate?.configuration?.seal_config as any) || {}).seal_image_url,
                      showCertNumber: sigConfig.show_cert_number !== false,
                      layout: selectedTemplate.layout,
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
                    {saving ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button onClick={handleGenerate} disabled={saving}>
                    {saving ? "Generating..." : "Generate Certificate"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Generated */}
        {step === 4 && generatedCert && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
              <Mascot mood="success" size="xl" message="Certificate stamped and ready!" />
              <h2 className="text-xl font-bold">Document Generated!</h2>
              <div className="space-y-2 text-sm">
                <p>
                  Certificate Number:{" "}
                  <span className="font-mono font-bold text-primary">{generatedCert.certificateNumber || generatedCert.certificate_number}</span>
                </p>
                <p className="text-muted-foreground">
                  Verification URL: {window.location.origin}/certificate/{generatedCert.slug}
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/certificate/${generatedCert.slug}`);
                  toast.success("Link copied!");
                }}>
                  Copy Link
                </Button>
                <Button asChild>
                  <a href={`/certificate/${generatedCert.slug}`} target="_blank">
                    View Certificate
                  </a>
                </Button>
              </div>
              <Button variant="ghost" className="mt-2" onClick={() => {
                setStep(1);
                setSelectedTemplate(null);
                setRecipientName("");
                setRecipientEmail("");
                setCourseName("");
                setScore("");
                setGeneratedCert(null);
              }}>
                Issue Another
              </Button>
            </CardContent>
          </Card>
        )}
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

