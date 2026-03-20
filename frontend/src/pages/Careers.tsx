import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { MapPin, Clock, Briefcase, Users, Zap, Heart, ArrowRight } from "lucide-react";

const openPositions = [
  {
    title: "Software Engineer Intern  Frontend",
    team: "Engineering",
    location: "Remote / Bangalore",
    type: "Internship",
    description: "Build intuitive interfaces that power credential verification for millions. Work with React, TypeScript, and modern design systems.",
  },
  {
    title: "Software Engineer Intern  Backend",
    team: "Engineering",
    location: "Remote / Bangalore",
    type: "Internship",
    description: "Design scalable APIs and infrastructure for secure document verification. Work with Node.js, PostgreSQL, and cloud services.",
  },
  {
    title: "Sales Intern",
    team: "Revenue",
    location: "Remote / Bangalore",
    type: "Internship",
    description: "Help educational institutions and enterprises discover TRUSTIFICATE. Learn B2B SaaS sales from experienced professionals.",
  },
  {
    title: "Social Media Marketing Intern",
    team: "Marketing",
    location: "Remote",
    type: "Internship",
    description: "Craft compelling narratives that showcase our impact. Grow our presence across LinkedIn, Twitter, and emerging platforms.",
  },
  {
    title: "Product Manager Intern",
    team: "Product",
    location: "Remote / Bangalore",
    type: "Internship",
    description: "Shape the future of digital credentials. Conduct user research, define requirements, and work closely with engineering.",
  },
];

const perks = [
  {
    icon: Zap,
    title: "Real Impact",
    description: "Work on products used by thousands of institutions worldwide.",
  },
  {
    icon: Users,
    title: "Mentorship",
    description: "Learn directly from experienced founders and industry veterans.",
  },
  {
    icon: Heart,
    title: "Flexibility",
    description: "Remote-first culture with flexible working hours.",
  },
  {
    icon: Briefcase,
    title: "Growth Path",
    description: "High-performing interns receive full-time offers.",
  },
];

export default function Careers() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4">We're Hiring</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Build the trust layer for credentials
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join a team solving one of the most persistent problems in education and employmentâ€”document fraud. We're building infrastructure that institutions trust.
          </p>
          <Button size="lg" asChild>
            <a href="#positions">View Open Positions</a>
          </Button>
        </div>
      </section>

      {/* Why TRUSTIFICATE */}
      <section className="py-16 border-b">
        <div className="container max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-12">Why TRUSTIFICATE?</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((perk) => (
              <div key={perk.title} className="text-center p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <perk.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{perk.title}</h3>
                <p className="text-sm text-muted-foreground">{perk.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-16">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-4">Open Positions</h2>
          <p className="text-muted-foreground text-center mb-10 max-w-xl mx-auto">
            We're looking for curious, driven individuals who want to make an impact early in their careers.
          </p>
          <div className="space-y-4">
            {openPositions.map((position) => (
              <Card key={position.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-lg">{position.title}</CardTitle>
                    <Badge variant="outline">{position.team}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{position.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {position.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {position.type}
                    </span>
                  </div>
                  <Button size="sm" variant="link" className="px-0 mt-3" asChild>
                    <Link to="/contact">
                      Apply Now <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5 border-t">
        <div className="container max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Don't see a role that fits?</h2>
          <p className="text-muted-foreground mb-6">
            We're always looking for exceptional talent. Send us your resume and tell us how you'd contribute.
          </p>
          <Button variant="outline" asChild>
            <Link to="/contact">Get in Touch</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}

