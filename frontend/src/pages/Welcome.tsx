import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Upload, Globe, ArrowRight, BookOpen } from "lucide-react";
import { Mascot } from "@/components/Mascot";

export default function WelcomePage() {
  const { profile } = useAuth();
  const name = profile?.display_name || "there";

  const steps = [
    {
      icon: FileText,
      title: "Issue your first credential",
      description: "Create a verifiable certificate using one of the pre-built templates.",
      href: "/documents/new",
      cta: "Issue Document",
    },
    {
      icon: Upload,
      title: "Bulk issue via CSV",
      description: "Upload a spreadsheet to issue hundreds of credentials at once.",
      href: "/documents/bulk",
      cta: "Bulk Upload",
    },
    {
      icon: Globe,
      title: "Register an external certificate",
      description: "Add credentials from other providers to your unified registry.",
      href: "/registry/external/new",
      cta: "Register External",
    },
    {
      icon: BookOpen,
      title: "Read the API docs",
      description: "Integrate TRUSTIFICATE into your systems with our REST API.",
      href: "/docs",
      cta: "View Docs",
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center pt-4">
          <Mascot mood="greeting" size="xl" showMessage={false} className="mb-2" />
          <h1 className="text-2xl font-bold">Welcome, {name}! 🎉</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Your account is ready. We've set up sample templates and credentials to get you started. Here's what to do next:
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.title} className="group hover:shadow-md hover:border-primary/30 transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{step.description}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to={step.href}>
                    {step.cta} <ArrowRight className="ml-1.5 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">Skip to Dashboard <ArrowRight className="ml-1.5 h-3 w-3" /></Link>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

