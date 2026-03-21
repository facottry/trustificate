import { useEffect, useRef, useState } from "react";
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
import { apiClient, PUBLIC_URL } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useAIAssist } from "@/hooks/useAIAssist";
import { usePlanGuard } from "@/hooks/usePlanGuard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ArrowLeft, Plus, Eye, Sparkles, Settings2, Upload, X, Trash2 } from "lucide-react";
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
  { value: "none", label: "None" },
  { value: "dots", label: "Dots" },
  { value: "grid", label: "Grid" },
  { value: "diagonal", label: "Diagonal" },
  { value: "waves", label: "Waves" },
  { value: "floral", label: "Floral" },
];

// Scales certificate to fill available container width with no extra whitespace
function PreviewScaled({ layout, children }: { layout: string; children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const certW = layout === "portrait" ? 595 : 842;
  const certH = layout === "portrait" ? 842 : 595;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / certW));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [certW]);

  return (
    <div ref={wrapRef} className="w-full" style={{ height: certH * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: certW, height: certH }}>
        {children}
      </div>
    </div>
  );
}

export default function TemplateFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { checkLimit, incrementUsage } = usePlanGuard();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [planInfo, setPlanInfo] = useState<{ plan_name?: string; usage?: number; limit?: number }>({});

  const [templateName, setTemplateName] = useState("");
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);
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
  const [showQrCode, setShowQrCode] = useState(false);
  const [backdropImageUrl, setBackdropImageUrl] = useState("");
  const [backdropUploading, setBackdropUploading] = useState(false);
  const [logoLayout, setLogoLayout] = useState<"single" | "split">("single");
  const [logoAlignment, setLogoAlignment] = useState<"left" | "center" | "right">("center");
  const [logoLeftUrl, setLogoLeftUrl] = useState("");
  const [logoLeftUploading, setLogoLeftUploading] = useState(false);
  const [logoRightUrls, setLogoRightUrls] = useState<string[]>([]);
  const [logoRightUploading, setLogoRightUploading] = useState<boolean[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [showPreview, setShowPreview] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { loading: aiLoading, getTemplateSuggestions } = useAIAssist();

  const handleAISuggest = async (overrideTitle?: string) => {
    const t = overrideTitle ?? title;
    if (!t.trim()) { toast.error("Enter a title first so AI knows what to generate"); return; }
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

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!nameManuallyEdited) setTemplateName(value);
  };

  const handleTitleBlur = () => {
    if (title.trim() && !bodyText.trim() && !isEdit) handleAISuggest(title);
  };

  const uploadAsset = async (file: File, type: "signature" | "seal" | "backdrop" | "logo"): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("TRUSTIFICATE:token");
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const res = await fetch(`${baseUrl}/api/templates/assets/upload?type=${type}`, {
      method: "POST",
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Upload failed");
    return json.data?.url as string;
  };

  const makeUploadHandler = (
    setUrl: (u: string) => void,
    setUploading: (b: boolean) => void,
    type: "signature" | "seal" | "backdrop" | "logo",
    label: string
  ) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    setUploading(true);
    try {
      const url = await uploadAsset(file, type);
      setUrl(url);
      toast.success(`${label} uploaded`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSignatureUpload = makeUploadHandler(setSignatureImageUrl, setSignatureUploading, "signature", "Signature");
  const handleSealUpload = makeUploadHandler(setSealImageUrl, setSealUploading, "seal", "Seal");
  const handleBackdropUpload = makeUploadHandler(setBackdropImageUrl, setBackdropUploading, "backdrop", "Backdrop");
  const handleLogoLeftUpload = makeUploadHandler(setLogoLeftUrl, setLogoLeftUploading, "logo", "Logo");

  const handleLogoRightUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    setLogoRightUploading(prev => { const n = [...prev]; n[index] = true; return n; });
    try {
      const url = await uploadAsset(file, "logo");
      setLogoRightUrls(prev => { const n = [...prev]; n[index] = url; return n; });
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setLogoRightUploading(prev => { const n = [...prev]; n[index] = false; return n; });
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (!id) return;
    apiClient(`/api/templates/${id}`)
      .then((response) => {
        const data = response.data;
        const cfg = (data.configuration as any) || {};
        setTemplateName(data.name || data.title || "");
        if (data.name) setNameManuallyEdited(true);
        setTitle(data.title || "");
        setSubtitle(cfg.subtitle || "");
        setBodyText(cfg.body_text || "");
        setLayout(data.layout || "landscape");
        setNumberPrefix(data.numberPrefix || "CERT");
        const theme = cfg.color_theme || {};
        setPrimaryColor(theme.primary || "#0a4f5c");
        setSecondaryColor(theme.secondary || "#d4a853");
        setBackgroundColor(theme.background || "#fffdf5");
        setFontColor(theme.fontColor || "#374151");
        setFontFamily(theme.fontFamily || "'Plus Jakarta Sans', sans-serif");
        const bgStyle = cfg.background_style || {};
        setBackgroundPattern(bgStyle.pattern || "none");
        setSelectedPlaceholders(Array.isArray(data.placeholders) ? data.placeholders as string[] : []);
        const sig = cfg.signature_config || {};
        setIssuerName(sig.issuer_name || "");
        setIssuerTitle(sig.issuer_title || "");
        setSignatureImageUrl(sig.signature_image_url || "");
        setShowCertNumber(sig.show_cert_number !== false);
        const seal = cfg.seal_config || {};
        setSealImageUrl(seal.seal_image_url || "");
        setShowQrCode(cfg.show_qr_code === true);
        setBackdropImageUrl(cfg.backdrop_image_url || "");
        const logoConf = cfg.logo_config || {};
        setLogoLayout(logoConf.layout || "single");
        setLogoAlignment(logoConf.alignment || "center");
        setLogoLeftUrl(logoConf.left_url || "");
        setLogoRightUrls(Array.isArray(logoConf.right_urls) ? logoConf.right_urls : []);
        setLoading(false);
      })
      .catch(() => { toast.error("Template not found"); navigate("/templates"); });
  }, [id]);

  const insertPlaceholder = (p: string) => {
    setBodyText((prev) => prev + `{{${p}}}`);
    if (!selectedPlaceholders.includes(p)) setSelectedPlaceholders((prev) => [...prev, p]);
  };

  const buildPayload = (isDraft: boolean) => ({
    name: templateName.trim() || title.trim(),
    title: title.trim(),
    layout,
    numberPrefix: numberPrefix.toUpperCase(),
    placeholders: selectedPlaceholders,
    isActive: !isDraft,
    configuration: {
      subtitle: subtitle.trim() || null,
      body_text: bodyText.trim() || "Draft — body text pending",
      color_theme: { primary: primaryColor, secondary: secondaryColor, background: backgroundColor, fontColor, fontFamily },
      background_style: { pattern: backgroundPattern },
      signature_config: { issuer_name: issuerName, issuer_title: issuerTitle, signature_image_url: signatureImageUrl || null, show_cert_number: showCertNumber },
      seal_config: { seal_image_url: sealImageUrl || null },
      show_qr_code: showQrCode,
      backdrop_image_url: backdropImageUrl || null,
      logo_config: { layout: logoLayout, alignment: logoAlignment, left_url: logoLeftUrl || null, right_urls: logoRightUrls.filter(Boolean) },
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bodyText.trim()) { toast.error("Title and body text are required"); return; }
    if (!profile?.organization_id) { toast.error("Organization not loaded. Please refresh and try again."); return; }
    setSaving(true);
    if (!isEdit) {
      const guard = await checkLimit("templates_created");
      if (!guard.allowed) {
        setPlanInfo({ plan_name: guard.plan_name, usage: guard.usage, limit: guard.limit });
        setUpgradeOpen(true);
        setSaving(false);
        return;
      }
    }
    try {
      if (isEdit) await apiClient(`/api/templates/${id}`, { method: 'PUT', body: JSON.stringify(buildPayload(false)) });
      else await apiClient('/api/templates', { method: 'POST', body: JSON.stringify(buildPayload(false)) });
      if (!isEdit) await incrementUsage("templates_created");
      toast.success(isEdit ? "Template updated" : "Template created");
      navigate("/templates");
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) { toast.error("At least a title is required to save a draft"); return; }
    if (!profile?.organization_id) { toast.error("Organization not loaded. Please refresh and try again."); return; }
    setSaving(true);
    try {
      if (isEdit) await apiClient(`/api/templates/${id}`, { method: 'PUT', body: JSON.stringify(buildPayload(true)) });
      else await apiClient('/api/templates', { method: 'POST', body: JSON.stringify(buildPayload(true)) });
      toast.success("Draft saved");
      navigate("/templates");
    } catch (err: any) {
      toast.error(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
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
    colorTheme: { primary: primaryColor, secondary: secondaryColor, background: backgroundColor, fontColor, fontFamily },
    backgroundPattern,
    signatureImageUrl,
    sealImageUrl,
    showCertNumber,
    layout,
    showQrCode,
    verificationUrl: showQrCode ? `${PUBLIC_URL}/certificate/preview` : undefined,
    backdropImageUrl: backdropImageUrl || undefined,
    logoLayout,
    logoAlignment,
    logoLeftUrl: logoLeftUrl || undefined,
    logoRightUrls: logoRightUrls.filter(Boolean),
  };

  return (
    <>
      <AdminLayout>
        {/* Full-height split layout — escapes AdminLayout padding via negative margin */}
        <div className="flex flex-col -m-3 sm:-m-4 lg:-m-8" style={{ height: "calc(100vh - 48px)" }}>

          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b bg-background shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/templates")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-base font-bold leading-tight">{isEdit ? "Edit Template" : "New Template"}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {isEdit ? "Update document blueprint" : "Create a reusable document blueprint"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleAISuggest()} disabled={aiLoading}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {aiLoading ? "Thinking..." : "AI Assist"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                {showPreview ? "Hide" : "Preview"}
              </Button>
            </div>
          </div>

          {/* Body: two independently scrollable columns */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* ── Settings column ── */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              <form onSubmit={handleSave} className="space-y-4 p-4 lg:p-5">

                {/* Basic Info */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Template Name <span className="text-muted-foreground font-normal">(for your reference)</span></Label>
                      <Input value={templateName} onChange={(e) => { setTemplateName(e.target.value); setNameManuallyEdited(true); }} placeholder="Auto-filled from title" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Title <span className="text-muted-foreground font-normal">(shown on certificate)</span></Label>
                      <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} onBlur={handleTitleBlur} placeholder="e.g. Internship Completion" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Subtitle</Label>
                      <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Certificate of Achievement" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Layout</Label>
                        <Select value={layout} onValueChange={(v: any) => setLayout(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="landscape">Landscape</SelectItem>
                            <SelectItem value="portrait">Portrait</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Number Prefix</Label>
                        <Input value={numberPrefix} onChange={(e) => setNumberPrefix(e.target.value)} placeholder="CERT" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Body */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm">Certificate Body</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5 px-4 pb-4">
                    <div className="flex flex-wrap gap-1">
                      {AVAILABLE_PLACEHOLDERS.map((p) => (
                        <Badge key={p} variant={selectedPlaceholders.includes(p) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => insertPlaceholder(p)}>
                          <Plus className="mr-0.5 h-2.5 w-2.5" />{`{{${p}}}`}
                        </Badge>
                      ))}
                    </div>
                    <Textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="For successfully completing {{course_name}}..." rows={4} required />
                  </CardContent>
                </Card>

                {/* Appearance */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm">Appearance & Signature</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-4 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Primary Color</Label>
                        <div className="flex gap-2">
                          <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-10 rounded border cursor-pointer shrink-0" />
                          <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 font-mono text-xs" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Secondary Color</Label>
                        <div className="flex gap-2">
                          <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-9 w-10 rounded border cursor-pointer shrink-0" />
                          <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Issuer Name</Label>
                        <Input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} placeholder="John Smith" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Issuer Title</Label>
                        <Input value={issuerTitle} onChange={(e) => setIssuerTitle(e.target.value)} placeholder="Program Director" />
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Signature Image <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      {signatureImageUrl ? (
                        <div className="flex items-center gap-3 rounded-lg border p-2.5">
                          <img src={signatureImageUrl} alt="Signature" className="h-10 max-w-[140px] object-contain" />
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive" onClick={() => setSignatureImageUrl("")}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                          <Upload className="h-3.5 w-3.5" />{signatureUploading ? "Uploading..." : "Upload signature"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleSignatureUpload} disabled={signatureUploading} />
                        </label>
                      )}
                    </div>

                    {/* Seal */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Seal Image <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      {sealImageUrl ? (
                        <div className="flex items-center gap-3 rounded-lg border p-2.5">
                          <img src={sealImageUrl} alt="Seal" className="h-12 w-12 object-contain" />
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive" onClick={() => setSealImageUrl("")}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                          <Upload className="h-3.5 w-3.5" />{sealUploading ? "Uploading..." : "Upload seal"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleSealUpload} disabled={sealUploading} />
                        </label>
                      )}
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center justify-between rounded-lg border p-2.5">
                      <Label className="text-xs cursor-pointer">Show Certificate Number</Label>
                      <Switch checked={showCertNumber} onCheckedChange={setShowCertNumber} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-2.5">
                      <div>
                        <Label className="text-xs cursor-pointer">Show QR Code on Certificate</Label>
                        <p className="text-[11px] text-muted-foreground">Scannable verification QR in bottom-right</p>
                      </div>
                      <Switch checked={showQrCode} onCheckedChange={setShowQrCode} />
                    </div>

                    {/* Backdrop */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Backdrop Image <span className="text-muted-foreground font-normal">(full background)</span></Label>
                      {backdropImageUrl ? (
                        <div className="flex items-center gap-3 rounded-lg border p-2.5">
                          <img src={backdropImageUrl} alt="Backdrop" className="h-12 w-16 object-cover rounded" />
                          <span className="text-xs text-muted-foreground flex-1">Backdrop set</span>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setBackdropImageUrl("")}><X className="h-3.5 w-3.5" /></Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                          <Upload className="h-3.5 w-3.5" />{backdropUploading ? "Uploading..." : "Upload full-page background"}
                          <input type="file" accept="image/*" className="hidden" onChange={handleBackdropUpload} disabled={backdropUploading} />
                        </label>
                      )}
                    </div>

                    {/* Logo */}
                    <div className="space-y-2.5 rounded-lg border p-3">
                      <Label className="text-xs">Logo Layout</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["single", "split"] as const).map((opt) => (
                          <button key={opt} type="button" onClick={() => setLogoLayout(opt)}
                            className={`rounded-lg border-2 p-2 text-center text-xs font-medium transition-colors ${logoLayout === opt ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30 text-muted-foreground"}`}>
                            {opt === "single" ? "Single" : "Split (L + R)"}
                          </button>
                        ))}
                      </div>
                      {logoLayout === "single" && (
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["left", "center", "right"] as const).map((a) => (
                            <button key={a} type="button" onClick={() => setLogoAlignment(a)}
                              className={`rounded border-2 py-1 text-xs font-medium capitalize transition-colors ${logoAlignment === a ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30 text-muted-foreground"}`}>
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">{logoLayout === "split" ? "Left logo" : "Logo"}</Label>
                        {logoLeftUrl ? (
                          <div className="flex items-center gap-2 rounded-lg border p-2">
                            <img src={logoLeftUrl} alt="Logo" className="h-8 max-w-[80px] object-contain" />
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive" onClick={() => setLogoLeftUrl("")}><X className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                            <Upload className="h-3.5 w-3.5" />{logoLeftUploading ? "Uploading..." : "Upload logo"}
                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoLeftUpload} disabled={logoLeftUploading} />
                          </label>
                        )}
                      </div>
                      {logoLayout === "split" && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] text-muted-foreground">Right logos (up to 4)</Label>
                            {logoRightUrls.length < 4 && (
                              <Button type="button" variant="ghost" size="sm" className="h-5 text-xs px-1.5" onClick={() => setLogoRightUrls(prev => [...prev, ""])}>
                                <Plus className="h-2.5 w-2.5 mr-0.5" />Add
                              </Button>
                            )}
                          </div>
                          {logoRightUrls.map((url, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              {url ? (
                                <div className="flex flex-1 items-center gap-2 rounded-lg border p-2">
                                  <img src={url} alt={`Partner ${i + 1}`} className="h-7 max-w-[70px] object-contain" />
                                  <Button type="button" variant="ghost" size="icon" className="h-5 w-5 ml-auto text-muted-foreground hover:text-destructive" onClick={() => setLogoRightUrls(prev => prev.filter((_, idx) => idx !== i))}><X className="h-2.5 w-2.5" /></Button>
                                </div>
                              ) : (
                                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed p-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
                                  <Upload className="h-3 w-3" />{logoRightUploading[i] ? "Uploading..." : `Partner ${i + 1}`}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoRightUpload(e, i)} disabled={logoRightUploading[i]} />
                                </label>
                              )}
                              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setLogoRightUrls(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Advanced */}
                    <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground text-xs">
                          <Settings2 className="mr-1.5 h-3.5 w-3.5" />
                          {showAdvanced ? "Hide Advanced" : "Advanced Options"}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Background Color</Label>
                            <div className="flex gap-2">
                              <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="h-9 w-10 rounded border cursor-pointer shrink-0" />
                              <Input value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="flex-1 font-mono text-xs" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Font Color</Label>
                            <div className="flex gap-2">
                              <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="h-9 w-10 rounded border cursor-pointer shrink-0" />
                              <Input value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="flex-1 font-mono text-xs" />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Font Family</Label>
                          <Select value={fontFamily} onValueChange={setFontFamily}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FONT_OPTIONS.map((f) => (
                                <SelectItem key={f.value} value={f.value}><span style={{ fontFamily: f.value }}>{f.label}</span></SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Background Pattern</Label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {BACKGROUND_PATTERNS.map((p) => (
                              <button key={p.value} type="button" onClick={() => setBackgroundPattern(p.value)}
                                className={`rounded-lg border-2 p-2 text-center text-xs font-medium transition-colors ${backgroundPattern === p.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/30 text-muted-foreground"}`}>
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2 pb-6">
                  <Button type="button" variant="outline" onClick={() => navigate("/templates")}>Cancel</Button>
                  <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={saving}>
                    {saving ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : isEdit ? "Update" : "Create Template"}
                  </Button>
                </div>
              </form>
            </div>

            {/* ── Preview column ── independently scrollable, fills height */}
            {showPreview && (
              <div className="hidden lg:flex flex-col border-l bg-muted/20" style={{ width: "46%" }}>
                <div className="px-4 py-2 border-b bg-background shrink-0">
                  <p className="text-xs font-medium text-muted-foreground">Live Preview</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <PreviewScaled layout={layout}>
                    <CertificateRenderer data={previewData} />
                  </PreviewScaled>
                </div>
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
