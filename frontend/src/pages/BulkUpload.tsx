import { useState, useRef } from "react";
import { buildTemplateSnapshot } from "@/lib/certificate-snapshot";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlanGuard } from "@/hooks/usePlanGuard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { useEffect } from "react";

interface ParsedRow {
  recipientName: string;
  recipientEmail: string;
  courseName: string;
  issueDate: string;
  valid: boolean;
  error?: string;
}

export default function BulkUploadPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { checkLimit, incrementUsage } = usePlanGuard();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [planInfo, setPlanInfo] = useState<{ plan_name?: string; usage?: number; limit?: number }>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    if (!profile?.organization_id) return;
    supabase
      .from("certificate_templates")
      .select("id, title, number_prefix")
      .eq("organization_id", profile.organization_id)
      .eq("is_active", true)
      .order("title")
      .then(({ data }) => setTemplates(data || []));
  }, [profile?.organization_id]);

  const downloadSampleCSV = () => {
    const csv = "recipient_name,recipient_email,course_name,issue_date\nJane Smith,jane@example.com,Web Development Fundamentals,2026-03-08\nJohn Doe,john@example.com,Data Science 101,2026-03-08";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TRUSTIFICATE-bulk-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
    const nameIdx = headers.findIndex((h) => h.includes("name") && h.includes("recipient") || h === "name" || h === "recipient_name");
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const courseIdx = headers.findIndex((h) => h.includes("course") || h.includes("title"));
    const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("issue"));

    return lines.slice(1).filter(l => l.trim()).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      const name = nameIdx >= 0 ? cols[nameIdx] : "";
      const email = emailIdx >= 0 ? cols[emailIdx] : "";
      const course = courseIdx >= 0 ? cols[courseIdx] : "";
      const date = dateIdx >= 0 ? cols[dateIdx] : new Date().toISOString().split("T")[0];

      const errors: string[] = [];
      if (!name) errors.push("Name required");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email");

      return {
        recipientName: name,
        recipientEmail: email,
        courseName: course,
        issueDate: date || new Date().toISOString().split("T")[0],
        valid: errors.length === 0,
        error: errors.join(", "),
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text));
    };
    reader.readAsText(file);
  };

  const handleBulkIssue = async () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) {
      toast.error("Select a template first");
      return;
    }

    const validRows = rows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to process");
      return;
    }

    // Plan guard: check remaining quota
    const guard = await checkLimit("certificates_created");
    if (!guard.allowed) {
      setPlanInfo({ plan_name: guard.plan_name, usage: guard.usage, limit: guard.limit });
      setUpgradeOpen(true);
      return;
    }
    const remaining = guard.remaining ?? 0;
    if (validRows.length > remaining) {
      toast.error(`You only have ${remaining} certificates remaining this month. CSV contains ${validRows.length} rows.`);
      return;
    }

    setUploading(true);
    let success = 0;
    let failed = 0;

    for (const row of validRows) {
      const { data: numData, error: numError } = await supabase.rpc("generate_certificate_number", {
        _prefix: template.number_prefix || "CERT",
      });

      if (numError || !numData) {
        failed++;
        continue;
      }

      const certNumber = numData as string;
      const slug = certNumber.toLowerCase().replace(/\s+/g, "-");

      const { error } = await supabase.from("certificates").insert({
        template_id: template.id,
        certificate_number: certNumber,
        slug,
        recipient_name: row.recipientName,
        recipient_email: row.recipientEmail || null,
        course_name: row.courseName || null,
        issuer_name: "TRUSTIFICATE",
        issue_date: row.issueDate,
        organization_id: profile?.organization_id,
        created_by: user?.id,
        status: "issued",
        metadata_json: { template_snapshot: buildTemplateSnapshot(template) } as any,
      });

      if (error) {
        failed++;
      } else {
        success++;
      }
    }

    setUploading(false);
    setResult({ success, failed });
    if (success > 0) {
      await incrementUsage("certificates_created", success);
      toast.success(`${success} certificate${success > 1 ? "s" : ""} issued successfully!`);
    }
    if (failed > 0) {
      toast.error(`${failed} certificate${failed > 1 ? "s" : ""} failed`);
    }
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  return (
    <>
    <AdminLayout>
      <div className="max-w-4xl space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documents")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bulk Issue Certificates</h1>
            <p className="text-muted-foreground">Upload a CSV file to issue multiple certificates at once</p>
          </div>
        </div>

        {/* Step 1: Template */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 1: Select Template</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="max-w-md">
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
          </CardContent>
        </Card>

        {/* Step 2: Upload CSV */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Step 2: Upload CSV</CardTitle>
            <CardDescription>
              CSV must have columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">recipient_name</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">recipient_email</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">course_name</code>,{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">issue_date</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" />
                {fileName || "Choose CSV File"}
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadSampleCSV}>
                <Download className="mr-1.5 h-4 w-4" />
                Download Sample CSV
              </Button>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          </CardContent>
        </Card>

        {/* Step 3: Preview */}
        {rows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Step 3: Preview ({rows.length} rows)
              </CardTitle>
              <div className="flex gap-2 mt-2">
                {validCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {validCount} valid
                  </Badge>
                )}
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {invalidCount} invalid
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Recipient Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i} className={!r.valid ? "bg-destructive/5" : ""}>
                        <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                        <TableCell className="font-medium">{r.recipientName || "â€”"}</TableCell>
                        <TableCell className="text-sm">{r.recipientEmail || "â€”"}</TableCell>
                        <TableCell className="text-sm">{r.courseName || "â€”"}</TableCell>
                        <TableCell className="text-sm">{r.issueDate}</TableCell>
                        <TableCell>
                          {r.valid ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <span className="text-xs text-destructive">{r.error}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Alert>
            <AlertDescription>
              Completed: {result.success} issued, {result.failed} failed.{" "}
              <Button variant="link" className="px-0 h-auto" onClick={() => navigate("/documents")}>
                View documents â†’
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        {rows.length > 0 && !result && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setRows([]); setFileName(""); }}>
              Clear
            </Button>
            <Button onClick={handleBulkIssue} disabled={uploading || validCount === 0 || !selectedTemplateId}>
              {uploading ? "Issuing..." : `Issue ${validCount} Certificate${validCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
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

