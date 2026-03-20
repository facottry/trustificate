import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const values = [
  { title: "Trust First", desc: "Every feature we build starts with the question: does this increase trust in the document ecosystem?" },
  { title: "Institutional Grade", desc: "We build for universities, training institutes, and enterprises. Our standards reflect the institutions that rely on us." },
  { title: "Open Verification", desc: "Document verification should be free, instant, and accessible to anyone no account required." },
  { title: "Privacy by Design", desc: "We collect only what's necessary. Document data belongs to issuers and recipients, not to us." },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
              Building infrastructure for trusted credentials
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              TRUSTIFICATE was founded on a simple belief: every credential should be instantly
              verifiable. We're building enterprise-grade infrastructure that makes document fraud impossible
              and verification effortless—at any scale.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 border-t">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            In a world where document fraud costs organizations billions annually, we believe
            verification should be a fundamental right not a luxury. TRUSTIFICATE provides the
            infrastructure for any organization to issue tamper-proof credentials and for anyone
            to verify them instantly.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We serve training institutes issuing completion certificates, corporations managing compliance documents,
            educational institutions distributing diplomas, and professional bodies granting accreditations.
            Our platform ensures that every credential is authentic, traceable, and trustworthy.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 border-t">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold mb-8">Our Values</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="p-5 rounded-lg border bg-card">
                <h3 className="text-sm font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 border-t">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold mb-6">What We Do</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">For Issuers:</strong> Design custom certificate templates,
              issue documents individually or in bulk via CSV, and manage your entire credential registry from one dashboard.
            </p>
            <p>
              <strong className="text-foreground">For Recipients:</strong> Receive verified, tamper-proof digital credentials
              that can be shared anywhere with a unique verification link and QR code.
            </p>
            <p>
              <strong className="text-foreground">For Verifiers:</strong> Instantly verify any TRUSTIFICATE credential
              for free no account needed. Just enter the certificate number or scan the QR code.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t">
        <div className="container">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Start issuing verifiable credentials today</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Whether you're a training institute, university, or enterprise TRUSTIFICATE is built for you.
            </p>
            <Button onClick={() => navigate("/signup")}>
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

