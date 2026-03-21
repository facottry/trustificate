import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface ApiStep {
  id: string;
  label: string;
  method: HttpMethod;
  path: string;
  description: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  pathParams?: Record<string, string>;
  requiresAuth?: boolean;
  note?: string;
}

interface Flow {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  steps: ApiStep[];
}

interface StepResult {
  status: number | null;
  data: unknown;
  error: string | null;
  duration: number | null;
  loading: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const TOKEN_KEY = "TRUSTIFICATE:token";

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/30",
  PATCH: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

// ── Flow Definitions ───────────────────────────────────────────────────────────
const FLOWS: Flow[] = [
  {
    id: "auth",
    title: "Authentication",
    icon: "🔐",
    description: "Register → verify email → login → get profile → logout",
    color: "from-blue-600 to-indigo-600",
    steps: [
      {
        id: "register",
        label: "Register",
        method: "POST",
        path: "/api/auth/register",
        description: "Create a new user account",
        body: { displayName: "Demo User", email: "demo@example.com", password: "Demo1234!" },
      },
      {
        id: "send-otp",
        label: "Send Verification OTP",
        method: "POST",
        path: "/api/auth/send-verification-otp",
        description: "Send OTP to verify email address",
        body: { email: "demo@example.com" },
      },
      {
        id: "verify-email",
        label: "Verify Email (OTP)",
        method: "POST",
        path: "/api/auth/verify-email",
        description: "Verify email using the OTP received",
        body: { email: "demo@example.com", otp: "123456" },
        note: "Replace OTP with the one received in email",
      },
      {
        id: "login",
        label: "Login",
        method: "POST",
        path: "/api/auth/login",
        description: "Authenticate and receive a JWT token",
        body: { email: "demo@example.com", password: "Demo1234!" },
      },
      {
        id: "get-me",
        label: "Get Profile",
        method: "GET",
        path: "/api/auth/me",
        description: "Fetch the authenticated user's profile",
        requiresAuth: true,
      },
      {
        id: "logout",
        label: "Logout",
        method: "POST",
        path: "/api/auth/logout",
        description: "Invalidate session (client discards JWT)",
        requiresAuth: true,
      },
    ],
  },
  {
    id: "password-reset",
    title: "Password Reset",
    icon: "🔑",
    description: "Forgot password → receive OTP → reset password",
    color: "from-orange-500 to-red-500",
    steps: [
      {
        id: "forgot-otp",
        label: "Forgot Password (OTP)",
        method: "POST",
        path: "/api/auth/forgot-password-otp",
        description: "Send a password reset OTP to the user's email",
        body: { email: "demo@example.com" },
      },
      {
        id: "reset-otp",
        label: "Reset Password (OTP)",
        method: "POST",
        path: "/api/auth/reset-password-otp",
        description: "Reset password using the OTP received",
        body: { email: "demo@example.com", otp: "123456", newPassword: "NewPass1234!" },
        note: "Replace OTP with the one received in email",
      },
      {
        id: "login-after-reset",
        label: "Login with New Password",
        method: "POST",
        path: "/api/auth/login",
        description: "Confirm the new password works",
        body: { email: "demo@example.com", password: "NewPass1234!" },
      },
    ],
  },
  {
    id: "organization",
    title: "Organization Management",
    icon: "🏢",
    description: "Create org → update → get usage → delete",
    color: "from-violet-600 to-purple-600",
    steps: [
      {
        id: "create-org",
        label: "Create Organization",
        method: "POST",
        path: "/api/organizations",
        description: "Create a new organization",
        requiresAuth: true,
        body: { name: "Demo Corp", slug: "demo-corp" },
      },
      {
        id: "list-orgs",
        label: "List Organizations",
        method: "GET",
        path: "/api/organizations",
        description: "List all organizations the user belongs to",
        requiresAuth: true,
      },
      {
        id: "get-org",
        label: "Get Organization",
        method: "GET",
        path: "/api/organizations/:id",
        description: "Get details of a specific organization",
        requiresAuth: true,
        pathParams: { id: "" },
        note: "Fill in the org ID from the create/list step",
      },
      {
        id: "update-org",
        label: "Update Organization",
        method: "PUT",
        path: "/api/organizations/:id",
        description: "Update organization details",
        requiresAuth: true,
        pathParams: { id: "" },
        body: { name: "Demo Corp Updated", website: "https://democorp.com", industry: "Technology" },
        note: "Fill in the org ID",
      },
      {
        id: "get-usage",
        label: "Get Usage",
        method: "GET",
        path: "/api/organizations/:id/usage",
        description: "Get plan usage and limits for the organization",
        requiresAuth: true,
        pathParams: { id: "" },
        note: "Fill in the org ID",
      },
    ],
  },
  {
    id: "template",
    title: "Template Management",
    icon: "📄",
    description: "Create template → list → get → update → delete",
    color: "from-teal-500 to-cyan-500",
    steps: [
      {
        id: "create-template",
        label: "Create Template",
        method: "POST",
        path: "/api/templates",
        description: "Create a new certificate template",
        requiresAuth: true,
        body: {
          title: "Course Completion Certificate",
          placeholders: ["recipientName", "courseName", "issueDate"],
          isActive: true,
          configuration: { backgroundColor: "#ffffff", fontFamily: "Inter" },
        },
      },
      {
        id: "list-templates",
        label: "List Templates",
        method: "GET",
        path: "/api/templates",
        description: "List all templates in the organization",
        requiresAuth: true,
      },
      {
        id: "get-template",
        label: "Get Template",
        method: "GET",
        path: "/api/templates/:id",
        description: "Get a specific template by ID",
        requiresAuth: true,
        pathParams: { id: "" },
        note: "Fill in the template ID from the create/list step",
      },
      {
        id: "update-template",
        label: "Update Template",
        method: "PUT",
        path: "/api/templates/:id",
        description: "Update template details",
        requiresAuth: true,
        pathParams: { id: "" },
        body: { title: "Advanced Course Completion Certificate", isActive: true },
        note: "Fill in the template ID",
      },
      {
        id: "delete-template",
        label: "Delete Template",
        method: "DELETE",
        path: "/api/templates/:id",
        description: "Delete a template",
        requiresAuth: true,
        pathParams: { id: "" },
        note: "Fill in the template ID",
      },
    ],
  },
  {
    id: "certificate",
    title: "Certificate Issuance",
    icon: "🎓",
    description: "Issue certificate → list → verify by number → get by slug",
    color: "from-amber-500 to-yellow-500",
    steps: [
      {
        id: "issue-cert",
        label: "Issue Certificate",
        method: "POST",
        path: "/api/certificates",
        description: "Issue a new certificate to a recipient",
        requiresAuth: true,
        body: {
          templateId: "",
          recipientName: "Jane Doe",
          recipientEmail: "jane@example.com",
          courseName: "Advanced React Development",
          issueDate: new Date().toISOString().split("T")[0],
          status: "issued",
        },
        note: "Fill in a valid templateId from your organization",
      },
      {
        id: "list-certs",
        label: "List Certificates",
        method: "GET",
        path: "/api/certificates",
        description: "List all certificates in the organization",
        requiresAuth: true,
      },
      {
        id: "get-cert",
        label: "Get Certificate",
        method: "GET",
        path: "/api/certificates/:id",
        description: "Get a specific certificate by ID",
        requiresAuth: true,
        pathParams: { id: "" },
        note: "Fill in the certificate ID",
      },
      {
        id: "verify-cert",
        label: "Verify Certificate (Public)",
        method: "GET",
        path: "/api/public/verify/:certificateNumber",
        description: "Publicly verify a certificate by its number — no auth required",
        pathParams: { certificateNumber: "" },
        note: "Fill in the certificate number from the issued certificate",
      },
      {
        id: "update-cert",
        label: "Update Certificate",
        method: "PUT",
        path: "/api/certificates/:id",
        description: "Update certificate details or status",
        requiresAuth: true,
        pathParams: { id: "" },
        body: { status: "revoked", notes: "Revoked due to policy change" },
        note: "Fill in the certificate ID",
      },
    ],
  },
  {
    id: "public",
    title: "Public Verification",
    icon: "🔍",
    description: "Verify certificate → platform stats → contact form",
    color: "from-green-500 to-emerald-500",
    steps: [
      {
        id: "platform-stats",
        label: "Platform Stats",
        method: "GET",
        path: "/api/public/platform-stats",
        description: "Get aggregated platform statistics — no auth required",
      },
      {
        id: "verify-public",
        label: "Verify Certificate",
        method: "GET",
        path: "/api/public/verify/:certificateNumber",
        description: "Verify a certificate by its number — no auth required",
        pathParams: { certificateNumber: "CERT-001" },
        note: "Replace with a real certificate number",
      },
      {
        id: "contact",
        label: "Contact Form",
        method: "POST",
        path: "/api/public/contact",
        description: "Submit a contact form — no auth required",
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          company: "Acme Inc",
          subject: "Demo inquiry",
          message: "I'd like to learn more about Trustificate.",
        },
      },
    ],
  },
  {
    id: "user",
    title: "User Profile",
    icon: "👤",
    description: "Get profile → update → change password",
    color: "from-pink-500 to-rose-500",
    steps: [
      {
        id: "get-profile",
        label: "Get My Profile",
        method: "GET",
        path: "/api/users/me",
        description: "Fetch the current user's profile",
        requiresAuth: true,
      },
      {
        id: "update-profile",
        label: "Update Profile",
        method: "PUT",
        path: "/api/users/:id",
        description: "Update user profile details",
        requiresAuth: true,
        pathParams: { id: "" },
        body: { displayName: "Updated Name", avatarUrl: null },
        note: "Fill in your user ID",
      },
      {
        id: "change-password",
        label: "Change Password",
        method: "PUT",
        path: "/api/users/change-password",
        description: "Change the current user's password",
        requiresAuth: true,
        body: { currentPassword: "Demo1234!", newPassword: "NewDemo1234!" },
      },
    ],
  },
  {
    id: "plan",
    title: "Plan & Billing",
    icon: "💳",
    description: "Validate coupon → upgrade plan",
    color: "from-slate-500 to-zinc-600",
    steps: [
      {
        id: "validate-coupon",
        label: "Validate Coupon",
        method: "POST",
        path: "/api/coupons/validate",
        description: "Validate a coupon code before applying",
        requiresAuth: true,
        body: { code: "DEMO50" },
      },
      {
        id: "upgrade-plan",
        label: "Upgrade Plan",
        method: "POST",
        path: "/api/organizations/:id/plan",
        description: "Upgrade an organization's subscription plan",
        requiresAuth: true,
        pathParams: { id: "" },
        body: { plan: "starter", couponCode: "" },
        note: "Fill in the org ID. Available plans: free, starter, pro, enterprise",
      },
    ],
  },
  {
    id: "ai",
    title: "AI Assist",
    icon: "🤖",
    description: "AI-powered document and template suggestions",
    color: "from-fuchsia-500 to-pink-600",
    steps: [
      {
        id: "ai-document",
        label: "Document Fill Assist",
        method: "POST",
        path: "/api/ai/assist",
        description: "Get AI suggestions for filling certificate fields",
        requiresAuth: true,
        body: {
          type: "document-fill",
          context: {
            templateTitle: "Course Completion Certificate",
            recipientName: "Jane Doe",
            courseName: "React Development",
          },
        },
      },
      {
        id: "ai-template",
        label: "Template Assist",
        method: "POST",
        path: "/api/ai/assist",
        description: "Get AI suggestions for designing a certificate template",
        requiresAuth: true,
        body: {
          type: "template-assist",
          context: {
            industry: "Technology",
            certificateType: "Course Completion",
            tone: "professional",
          },
        },
      },
    ],
  },
];

// ── Helper: build URL with path params ────────────────────────────────────────
function buildUrl(path: string, pathParams?: Record<string, string>): string {
  if (!pathParams) return BASE_URL + path;
  let resolved = path;
  for (const [key, val] of Object.entries(pathParams)) {
    resolved = resolved.replace(`:${key}`, val || `:${key}`);
  }
  return BASE_URL + resolved;
}

// ── Helper: execute a step ─────────────────────────────────────────────────────
async function executeStep(
  step: ApiStep,
  bodyOverride: string,
  pathParamsOverride: Record<string, string>,
  token: string
): Promise<{ status: number; data: unknown; duration: number }> {
  const url = buildUrl(step.path, pathParamsOverride);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (step.requiresAuth && token) headers["Authorization"] = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (step.method !== "GET" && step.method !== "DELETE") {
    body = bodyOverride;
  }

  const start = performance.now();
  const res = await fetch(url, { method: step.method, headers, body, credentials: "include" });
  const duration = Math.round(performance.now() - start);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, duration };
}

// ── StepCard ───────────────────────────────────────────────────────────────────
function StepCard({
  step,
  index,
  result,
  token,
  onRun,
}: {
  step: ApiStep;
  index: number;
  result: StepResult;
  token: string;
  onRun: (step: ApiStep, body: string, pathParams: Record<string, string>) => void;
}) {
  const [body, setBody] = useState(
    step.body ? JSON.stringify(step.body, null, 2) : ""
  );
  const [pathParams, setPathParams] = useState<Record<string, string>>(
    step.pathParams ?? {}
  );

  const hasPathParams = step.pathParams && Object.keys(step.pathParams).length > 0;

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
          {index + 1}
        </span>
        <Badge variant="outline" className={cn("text-xs font-mono font-semibold border", METHOD_COLORS[step.method])}>
          {step.method}
        </Badge>
        <code className="text-xs text-muted-foreground font-mono truncate flex-1">{step.path}</code>
        <span className="text-sm font-medium text-foreground">{step.label}</span>
        {step.requiresAuth && (
          <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-400 bg-yellow-500/10">
            🔒 auth
          </Badge>
        )}
      </div>

      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{step.description}</p>

        {step.note && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-3 py-2">
            ⚠️ {step.note}
          </div>
        )}

        {/* Path params */}
        {hasPathParams && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Path Parameters</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(pathParams).map((key) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs font-mono text-muted-foreground">:{key}</Label>
                  <Input
                    value={pathParams[key]}
                    onChange={(e) => setPathParams((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={`Enter ${key}`}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body editor */}
        {step.body && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Request Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="font-mono text-xs min-h-[100px] resize-y"
              spellCheck={false}
            />
          </div>
        )}

        {/* Run button + status */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => onRun(step, body, pathParams)}
            disabled={result.loading}
            className="shrink-0"
          >
            {result.loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running...
              </span>
            ) : (
              "▶ Run"
            )}
          </Button>
          {result.status !== null && (
            <div className="flex items-center gap-2 text-xs">
              <Badge
                variant="outline"
                className={cn(
                  "font-mono border",
                  result.status >= 200 && result.status < 300
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                )}
              >
                {result.status}
              </Badge>
              {result.duration !== null && (
                <span className="text-muted-foreground">{result.duration}ms</span>
              )}
            </div>
          )}
          {result.error && (
            <span className="text-xs text-red-400 truncate">{result.error}</span>
          )}
        </div>

        {/* Response */}
        {result.data !== null && result.status !== null && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Response</Label>
            <ScrollArea className="h-[160px] w-full rounded border border-border bg-muted/30">
              <pre className="p-3 text-xs font-mono text-foreground whitespace-pre-wrap break-all">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

// ── FlowPanel ──────────────────────────────────────────────────────────────────
function FlowPanel({ flow, token }: { flow: Flow; token: string }) {
  const [results, setResults] = useState<Record<string, StepResult>>({});

  const setStepResult = useCallback((stepId: string, update: Partial<StepResult>) => {
    setResults((prev) => ({
      ...prev,
      [stepId]: { status: null, data: null, error: null, duration: null, loading: false, ...prev[stepId], ...update },
    }));
  }, []);

  const handleRun = useCallback(
    async (step: ApiStep, body: string, pathParams: Record<string, string>) => {
      setStepResult(step.id, { loading: true, error: null, data: null, status: null });
      try {
        const { status, data, duration } = await executeStep(step, body, pathParams, token);
        setStepResult(step.id, { status, data, duration, loading: false });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        setStepResult(step.id, { error: msg, loading: false });
      }
    },
    [token, setStepResult]
  );

  const runAll = useCallback(async () => {
    for (const step of flow.steps) {
      const bodyEl = document.querySelector<HTMLTextAreaElement>(`[data-step-body="${step.id}"]`);
      const body = bodyEl?.value ?? (step.body ? JSON.stringify(step.body) : "");
      setStepResult(step.id, { loading: true, error: null, data: null, status: null });
      try {
        const { status, data, duration } = await executeStep(step, body, step.pathParams ?? {}, token);
        setStepResult(step.id, { status, data, duration, loading: false });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error";
        setStepResult(step.id, { error: msg, loading: false });
      }
      // small delay between steps
      await new Promise((r) => setTimeout(r, 300));
    }
  }, [flow.steps, token, setStepResult]);

  const completedCount = Object.values(results).filter(
    (r) => r.status !== null && r.status >= 200 && r.status < 300
  ).length;

  return (
    <div className="space-y-4">
      {/* Flow header */}
      <div className={cn("rounded-xl p-4 bg-gradient-to-r text-white", flow.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{flow.icon}</span>
            <div>
              <h2 className="text-lg font-bold">{flow.title}</h2>
              <p className="text-sm text-white/80">{flow.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/70">
              {completedCount}/{flow.steps.length} done
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={runAll}
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            >
              ▶▶ Run All
            </Button>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {flow.steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            index={i}
            result={results[step.id] ?? { status: null, data: null, error: null, duration: null, loading: false }}
            token={token}
            onRun={handleRun}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Playground Page ───────────────────────────────────────────────────────
export default function Playground() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [activeFlow, setActiveFlow] = useState(FLOWS[0].id);

  const currentFlow = FLOWS.find((f) => f.id === activeFlow) ?? FLOWS[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight">🧪 API Playground</span>
            <Badge variant="outline" className="text-xs">Trustificate</Badge>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Label className="text-xs text-muted-foreground shrink-0">JWT Token</Label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your Bearer token here (auto-loaded from localStorage)"
              className="h-8 text-xs font-mono"
            />
            {token && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={() => setToken("")}
              >
                ✕
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground hidden md:block">
            <code className="bg-muted px-2 py-1 rounded">{BASE_URL}</code>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar: flow list */}
        <aside className="w-56 shrink-0 space-y-1 sticky top-[61px] self-start">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3 px-2">
            API Flows
          </p>
          {FLOWS.map((flow) => (
            <button
              key={flow.id}
              onClick={() => setActiveFlow(flow.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2.5",
                activeFlow === flow.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <span className="text-base">{flow.icon}</span>
              <span className="truncate">{flow.title}</span>
            </button>
          ))}

          <Separator className="my-3" />

          <div className="px-2 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Quick Links</p>
            <a
              href="/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              📖 Swagger Docs ↗
            </a>
            <a
              href="/dashboard"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              🏠 Dashboard
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <Tabs value={activeFlow} onValueChange={setActiveFlow}>
            <TabsList className="hidden">
              {FLOWS.map((f) => <TabsTrigger key={f.id} value={f.id}>{f.title}</TabsTrigger>)}
            </TabsList>
            {FLOWS.map((flow) => (
              <TabsContent key={flow.id} value={flow.id} className="mt-0">
                <FlowPanel flow={flow} token={token} />
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
