import { PublicLayout } from "@/components/PublicLayout";

export default function Terms() {
  return (
    <PublicLayout>
      <section className="py-20">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-10">Last updated: March 1, 2026</p>

          <div className="prose-sm space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>By accessing or using TRUSTIFICATE ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service. These Terms apply to all users, including organizations, administrators, and individuals who access verified documents.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">2. Description of Service</h2>
              <p>TRUSTIFICATE provides a platform for document issuance, credential management, and verification. The Service allows organizations to create, issue, and manage verifiable digital documents, and allows third parties to verify document authenticity through public verification endpoints.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">3. Account Registration</h2>
              <p>To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for safeguarding your account credentials and for any activity that occurs under your account.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">4. Permitted Use</h2>
              <p>You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to: (a) use the Service to issue fraudulent or misleading documents; (b) attempt to circumvent security measures; (c) reverse engineer or decompile any part of the Service; (d) use automated systems to access the Service without prior written consent.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">5. Document Issuance & Verification</h2>
              <p>Organizations using the Service to issue documents are solely responsible for the accuracy and legitimacy of the credentials they issue. TRUSTIFICATE provides the infrastructure for issuance and verification but does not validate the underlying content of documents. Verification results confirm that a document was issued through the platform and has not been revoked.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">6. External Certificates</h2>
              <p>The Service allows registration of externally issued certificates for cross-reference purposes. TRUSTIFICATE does not guarantee the authenticity of externally registered documents. External certificates are clearly marked as "Externally Registered" in the verification system.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">7. Payment & Billing</h2>
              <p>Paid features are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We reserve the right to modify pricing with 30 days' notice. Free-tier usage is subject to published limits and may be modified at our discretion.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">8. Intellectual Property</h2>
              <p>The Service and its original content, features, and functionality are owned by TRUSTIFICATE and are protected by international copyright, trademark, and other intellectual property laws. Documents created using the Service remain the intellectual property of the issuing organization.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">9. Data Handling</h2>
              <p>We handle personal data in accordance with our Privacy Policy. By using the Service, you acknowledge that you have read and understood our Privacy Policy. Organizations are responsible for ensuring they have appropriate consent to process personal data through the Service.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, TRUSTIFICATE shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">11. Termination</h2>
              <p>We may terminate or suspend your account at any time for violation of these Terms. Upon termination, your right to use the Service ceases immediately. Issued documents and their verification status may be retained for regulatory compliance purposes.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">12. Governing Law</h2>
              <p>These Terms shall be governed by the laws of the State of California, without regard to conflict of law provisions. Any disputes shall be resolved in the courts located in San Francisco County, California.</p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">13. Contact</h2>
              <p>For questions about these Terms, contact us at legal@TRUSTIFICATE.com.</p>
            </section>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

