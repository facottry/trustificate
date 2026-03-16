import { useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("contact_submissions").insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      company: company.trim() || null,
      subject: subject || null,
      message: message.trim(),
    });

    setSubmitting(false);

    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    toast.success("Thank you! Our team will get back to you within 24 hours.");
    setFirstName("");
    setLastName("");
    setEmail("");
    setCompany("");
    setSubject("");
    setMessage("");
  };

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Get in touch
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Have questions about TRUSTIFICATE? Our team is here to help.
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 max-w-4xl mx-auto">
            <div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales Inquiry</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="enterprise">Enterprise Plans</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">admin@edutainverse.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-lg border bg-card">
                <h4 className="text-sm font-semibold mb-2">Enterprise Sales</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Need a custom solution? Our team can help with volume pricing, SSO, custom integrations, and dedicated support.
                </p>
                <p className="text-sm text-muted-foreground">
                  Email: <span className="font-medium text-foreground">enterprise@TRUSTIFICATE.app</span>
                </p>
              </div>

              <div className="p-5 rounded-lg border bg-card">
                <h4 className="text-sm font-semibold mb-2">Support</h4>
                <p className="text-sm text-muted-foreground">
                  Existing customers can reach our support team at{" "}
                  <span className="font-medium text-foreground">support@TRUSTIFICATE.app</span> or through the in-app help center.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

