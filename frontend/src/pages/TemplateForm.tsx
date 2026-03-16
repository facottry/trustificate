import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CertificateRenderer } from "@/components/CertificateRenderer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAIAssist } from "@/hooks/useAIAssist";
import { usePlanGuard } from "@/hooks/usePlanGuard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ArrowLeft, Plus, Eye, Sparkles, Settings2, Upload, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

const AVAILABLE_PLACEHOLDERS = [
  "recipient_name", "course_name", "score", "issue_date", "completion_date",
  "duration_text", "company_name", "training_name", "issuer_name", "issuer_title", "certificate_number",
];

const FONT_OPTIONS = [
  { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Lora', serif", label: "Lora" },
];

const BACKGROUND_PATTERNS = [
  { value: "none", label: "None", preview: "bg-background" },
  { value: "dots", label: "Dots", preview: "bg-muted" },
  { value: "grid", label: "Grid", preview: "bg-muted" },
  { value: "diagonal", label: "Diagonal Lines", preview: "bg-muted" },
  { value: "waves", label: "Waves", preview: "bg-muted" },
  { value: "floral", label: "Floral Corner", preview: "bg-muted" },
];

export default function TemplateFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { checkLimit, incrementUsage } = usePlanGuard();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [planInfo, setPlanInfo] = useState<{ plan_name?: string; usage?: number; limit?: number }>({});

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [layout, setLayout] = useState<"portrait" | "landscape">("landscape");
  const [numberPrefix, setNumberPrefix] = useState("CERT");
  const [primaryColor, setPrimaryColor] = useState("#0a4f5c");
  const [secondaryColor, setSecondaryColor] = useState("#d4a853");
  const [backgroundColor, setBackgroundColor] = useState("#fffdf5");
  const [fontColor, setFontColor] = useState("#374151");
  const [fontFamily, setFontFamily] = useState("'Plus Jakarta Sans', sans-serif");
  const [backgroundPattern, setBackgroundPattern] = useState("none");
  const [selectedPlaceholders, setSelectedPlaceholders] = useState<string[]>([]);
  const [issuerName, setIssuerName] = useState("");
  const [issuerTitle, setIssuerTitle] = useState("");
  const [signatureImageUrl, setSignatureImageUrl] = useState("");
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [sealImageUrl, setSealImageUrl] = useState("");
  const [sealUploading, setSealUploading] = useState(false);
  const [showCertNumber, setShowCertNumber] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [showPreview, setShowPreview] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { loading: aiLoading, getTemplateSuggestions } = useAIAssist();

  const handleAISuggest = async (overrideTitle?: string) => {
    const t = overrideTitle ?? title;
    if (!t.trim()) {
      toast.error("Enter a title first so AI knows what to generate");
      return;
    }
    const suggestions = await getTemplateSuggestions({ title: t, subtitle, bodyText, layout, numberPrefix });
    if (suggestions) {
      if (suggestions.title && !title) setTitle(suggestions.title);
      if (suggestions.subtitle) setSubtitle(suggestions.subtitle);
      if (suggestions.bodyText) setBodyText(suggestions.bodyText);
      if (suggestions.numberPrefix) setNumberPrefix(suggestions.numberPrefix);
      if (suggestions.issuerName) setIssuerName(suggestions.issuerName);
      if (suggestions.issuerTitle) setIssuerTitle(suggestions.issuerTitle);
      if (suggestions.primaryColor) setPrimaryColor(suggestions.primaryColor);
      if (suggestions.secondaryColor) setSecondaryColor(suggestions.secondaryColor);
      if (suggestions.suggestedPlaceholders) {
        setSelectedPlaceholders(prev => [...new Set([...prev, ...suggestions.suggestedPlaceholders])]);
      }
      toast.success("AI generated the template! Review and tweak as needed.");
    }
  };

  const handleTitleBlur = () => {
    if (title.trim() && !bodyText.trim() && !isEdit) {
      handleAISuggest(title);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setSignatureUploading(true);
    // Mock upload
    setTimeout(() => {
      setSignatureImageUrl(`https://via.placeholder.com/200x100?text=Signature`);
      setSignatureUploading(false);
      toast.success("Signature uploaded");
    }, 1000);
  };

  const handleSealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setSealUploading(true);
    // Mock upload
    setTimeout(() => {
      setSealImageUrl(`https://via.placeholder.com/100x100?text=Seal`);
      setSealUploading(false);
      toast.success("Seal uploaded");
    }, 1000);
  };

  useEffect(() => {
    if (!id) return;
    apiClient(`/api/templates/${id}`)
      .then((response) => {
        const data = response.data;
        setTitle(data.title);
        setSubtitle(data.subtitle || "");
        setBodyText(data.bodyText);
        setLayout(data.layout);
        setNumberPrefix(data.numberPrefix);
        const theme = (data.colorTheme as any) || {};
        setPrimaryColor(theme.primary || "#0a4f5c");
        setSecondaryColor(theme.secondary || "#d4a853");
        setBackgroundColor(theme.background || "#fffdf5");
        setFontColor(theme.fontColor || "#374151");
        setFontFamily(theme.fontFamily || "'Plus Jakarta Sans', sans-serif");
        const bgStyle = (data.backgroundStyle as any) || {};
        setBackgroundPattern(bgStyle.pattern || "none");
        setSelectedPlaceholders(Array.isArray(data.placeholders) ? data.placeholders as string[] : []);
        const sig = (data.signatureConfig as any) || {};
        setIssuerName(sig.issuerName || "");
        setIssuerTitle(sig.issuerTitle || "");
        setSignatureImageUrl(sig.signatureImageUrl || "");
        setShowCertNumber(sig.showCertNumber !== false);
        const seal = (data.sealConfig as any) || {};
        setSealImageUrl(seal.sealImageUrl || "");
        setLoading(false);
      })
      .catch((error) => {
        toast.error("Template not found");
        navigate("/templates");
      });
  }, [id]);

  const insertPlaceholder = (p: string) => {
    setBodyText((prev) => prev + `{{${p}}}`);
    if (!selectedPlaceholders.includes(p)) {
      setSelectedPlaceholders((prev) => [...prev, p]);
    }
  };

  const buildPayload = (isDraft: boolean) => ({
    title: title.trim(),
    subtitle: subtitle.trim() || null,
    body_text: bodyText.trim() || "Draft — body text pending",
    layout,
    number_prefix: numberPrefix.toUpperCase(),
    placeholders: selectedPlaceholders,
    color_theme: {
      primary: primaryColor,
      secondary: secondaryColor,
      background: backgroundColor,
      fontColor,
      fontFamily,
    },
    background_style: { pattern: backgroundPattern },
    signature_config: { issuer_name: issuerName, issuer_title: issuerTitle, signature_image_url: signatureImageUrl || null, show_cert_number: showCertNumber },
    seal_config: { seal_image_url: sealImageUrl || null },
    organization_id: profile!.organization_id,
    created_by: user?.id,
    is_active: isDraft ? false : true,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyText.trim()) {
      toast.error("Title and body text are required");
      return;
    }
    if (!profile?.organization_id) {
      toast.error("Organization not loaded. Please refresh and try again.");
      return;
    }
    setSaving(true);
    const payload = buildPayload(false);

    // Plan guard for new templates
    if (!isEdit) {
      const guard = await checkLimit("templates_created");
      if (!guard.allowed) {
        setPlanInfo({ plan_name: guard.plan_name, usage: guard.usage, limit: guard.limit });
        setUpgradeOpen(true);
        setSaving(false);
        return;
      }
    }

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("certificate_templates").update(payload).eq("id", id!));
    } else {
      ({ error } = await supabase.from("certificate_templates").insert(payload));
    }

    setSaving(false);
    if (error) toast.error(error.message);
    else {
      if (!isEdit) await incrementUsage("templates_created");
      toast.success(isEdit ? "Template updated" : "Template created");
      navigate("/templates");
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error("At least a title is required to save a draft");
      return;
    }
    if (!profile?.organization_id) {
      toast.error("Organization not loaded. Please refresh and try again.");
      return;
    }
    setSaving(true);
    const payload = buildPayload(true);

    let error;
    if (isEdit) {
      ({ error } = await supabase.from("certificate_templates").update(payload).eq("id", id!));
    } else {
      ({ error } = await supabase.from("certificate_templates").insert(payload));
    }

    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Draft saved");
      navigate("/templates");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  const previewData = {
    recipientName: "Jane Doe",
    courseName: "Sample Course",
    trainingName: "Training Program",
    companyName: "Acme Corp",
    score: "95%",
    issueDate: new Date().toLocaleDateString(),
    completionDate: new Date().toLocaleDateString(),
    durationText: "3 months",
    issuerName: issuerName || "John Smith",
    issuerTitle: issuerTitle || "Director",
    certificateNumber: `${numberPrefix}-2026-000001`,
    templateTitle: title || "Certificate Title",
    templateSubtitle: subtitle || "Certificate of Achievement",
    bodyText: bodyText || "Certificate body text preview...",
    colorTheme: {
      primary: primaryColor,
      secondary: secondaryColor,
      background: backgroundColor,
      fontColor,
      fontFamily,
    },
    backgroundPattern,
    signatureImageUrl,
    sealImageUrl,
    showCertNumber,
    layout,
  };

  return (
    <>
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/templates")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isEdit ? "Edit Template" : "New Template"}</h1>
              <p className="text-muted-foreground">
                {isEdit ? "Update document blueprint" : "Create a reusable document blueprint"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAISuggest()} disabled={aiLoading}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {aiLoading ? "Thinking..." : "AI Assist"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="mr-1.5 h-4 w-4" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : ""}`}>
          {/* Form */}
          <form onSubmit={handleSave} className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} placeholder="e.g. Internship Completion, Safety Training" required />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Certificate of Achievement" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Layout</Label>
                    <Select value={layout} onValueChange={(v: any) => setLayout(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape">Landscape</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Number Prefix</Label>
                    <Input value={numberPrefix} onChange={(e) => setNumberPrefix(e.target.value)} placeholder="CERT" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Certificate Body</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_PLACEHOLDERS.map((p) => (
                    <Badge
                      key={p}
                      variant={selectedPlaceholders.includes(p) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => insertPlaceholder(p)}
                    >
                      <Plus className="mr-0.5 h-3 w-3" />
                      {`{{${p}}}`}
                    </Badge>
                  ))}
                </div>
                <Textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="For successfully completing {{course_name}}..."
                  rows={5}
                  required
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Appearance & Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                      <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 font-mono text-sm" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Issuer Name</Label>
                    <Input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} placeholder="John Smith" />
                  </div>
                  <div className="space-y-2">
                    <Label>Issuer Title</Label>
                    <Input value={issuerTitle} onChange={(e) => setIssuerTitle(e.target.value)} placeholder="Program Director" />
                  </div>
                </div>

                {/* Signature Image Upload */}
                <div className="space-y-2">
                  <Label>Signature Image <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  {signatureImageUrl ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <img src={signatureImageUrl} alt="Signature" className="h-12 max-w-[160px] object-contain" />
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setSignatureImageUrl("")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                      <Upload className="h-4 w-4" />
                      {signatureUploading ? "Uploading..." : "Upload signature image"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} disabled={signatureUploading} />
                    </label>
                  )}
                </div>

                {/* Seal Image Upload */}
                <div className="space-y-2">
                  <Label>Seal Image <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  {sealImageUrl ? (
                    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <img src={sealImageUrl} alt="Seal" className="h-14 w-14 object-contain" />
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setSealImageUrl("")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                      <Upload className="h-4 w-4" />
                      {sealUploading ? "Uploading..." : "Upload seal image"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleSealUpload} disabled={sealUploading} />
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <Label className="text-sm">Show Certificate Number</Label>
                    <p className="text-xs text-muted-foreground">Display certificate number on the document</p>
                  </div>
                  <Switch checked={showCertNumber} onCheckedChange={setShowCertNumber} />
                </div>

                {/* Advanced Mode */}
                <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground">
                      <Settings2 className="mr-1.5 h-4 w-4" />
                      {showAdvanced ? "Hide Advanced Options" : "Advanced Options"}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Background Color</Label>
                        <div className="flex gap-2">
                          <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                          <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="flex-1 font-mono text-sm" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Font Color</Label>
                        <div className="flex gap-2">
                          <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                          <Input value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="flex-1 font-mono text-sm" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Font Family</Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              <span style={{ fontFamily: f.value }}>{f.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Background Pattern</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {BACKGROUND_PATTERNS.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setBackgroundPattern(p.value)}
                            className={`rounded-lg border-2 p-3 text-center text-xs font-medium transition-colors ${
                              backgroundPattern === p.value
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-border hover:border-primary/30 text-muted-foreground"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/templates")}>Cancel</Button>
              <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={saving}>
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : isEdit ? "Update Template" : "Create Template"}
              </Button>
            </div>
          </form>

          {/* Live Preview */}
          {showPreview && (
            <div className="sticky top-20">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center overflow-auto">
                  <div className="scale-[0.45] origin-top">
                    <CertificateRenderer data={previewData} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
    <UpgradeModal
      open={upgradeOpen}
      onOpenChange={setUpgradeOpen}
      currentPlan={planInfo.plan_name}
      metric="templates_created"
      usage={planInfo.usage}
      limit={planInfo.limit}
    />
    </>
  );
}
