import { PublicLayout } from "@/components/PublicLayout";

export default function Privacy() {
  return (
    <PublicLayout>
      <section className="py-20">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: March 1, 2026</p>

          <div className="prose-sm space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">1. Introduction</h2>
              <p>TRUSTIFICATE ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our document issuance and verification platform ("Service").</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">2. Information We Collect</h2>
              <p><strong className="text-foreground">Account Information:</strong> Name, email address, organization name, and role when you create an account.</p>
              <p><strong className="text-foreground">Document Data:</strong> Information contained in documents you create, issue, or register through the Service, including recipient names, certificate numbers, and associated metadata.</p>
              <p><strong className="text-foreground">Usage Data:</strong> Information about how you interact with the Service, including pages visited, features used, and verification queries.</p>
              <p><strong className="text-foreground">Technical Data:</strong> IP address, browser type, device information, and cookies necessary for the Service to function.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
              <p>We use collected information to: (a) provide and maintain the Service; (b) process document issuance and verification requests; (c) communicate with you about your account and the Service; (d) analyze usage patterns to improve the Service; (e) comply with legal obligations and enforce our Terms of Service.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">4. Document Verification & Public Data</h2>
              <p>When a document is issued through the Service, certain information becomes publicly accessible for verification purposes. This includes the certificate number, recipient name, issuer name, issue date, and document status. This public access is essential to the verification function of the Service and is consented to by the issuing organization.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">5. Data Sharing</h2>
              <p>We do not sell your personal information. We may share data with: (a) service providers who assist in operating the platform; (b) law enforcement when required by law; (c) business partners with your explicit consent. All third-party service providers are contractually obligated to protect your data.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">6. Data Retention</h2>
              <p>Account data is retained for the duration of your account. Document data may be retained after account closure for verification continuity and regulatory compliance. Verification logs are retained for 12 months. You may request deletion of your personal data by contacting privacy@TRUSTIFICATE.com.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">7. Data Security</h2>
              <p>We implement industry-standard security measures including encryption in transit (TLS 1.3), encryption at rest (AES-256), regular security audits, and access controls. While we strive to protect your data, no method of electronic storage is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">8. Your Rights</h2>
              <p>Depending on your jurisdiction, you may have the right to: (a) access your personal data; (b) correct inaccurate data; (c) request deletion of your data; (d) restrict processing; (e) data portability; (f) object to processing. To exercise these rights, contact privacy@TRUSTIFICATE.com.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">9. GDPR Compliance</h2>
              <p>For users in the European Economic Area, we process data under the legal bases of contract performance, legitimate interests, and consent. Our Data Protection Officer can be reached at dpo@TRUSTIFICATE.com.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">10. Cookies</h2>
              <p>We use essential cookies required for the Service to function, including authentication tokens and session management. We do not use third-party advertising cookies. Analytics cookies are used only with your consent.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">11. Children's Privacy</h2>
              <p>The Service is not directed to individuals under 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, contact us immediately.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">12. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">13. Contact Us</h2>
              <p>For privacy-related inquiries, contact us at privacy@TRUSTIFICATE.com or write to: TRUSTIFICATE, Inc., 123 Trust Avenue, Suite 400, San Francisco, CA 94105.</p>
            </section>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

