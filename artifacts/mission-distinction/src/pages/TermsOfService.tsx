import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft size={16} /> Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-primary h-7 w-7" />
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Last updated: 15 June 2026 · Effective date: 15 June 2026
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground leading-7">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Mission Distinction ("Platform", "we", "us"), you agree to be bound by these Terms
              of Service ("Terms") and our{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
              These Terms constitute a legally binding agreement between you and Mission Distinction.
            </p>
            <p>
              If you are registering on behalf of an institution, you represent that you have the authority to bind that
              institution to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Eligibility</h2>
            <p>To use Mission Distinction, you must:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Be 18 years of age or older (MBBS students are typically 18+)</li>
              <li>Be enrolled in or affiliated with an MBBS programme</li>
              <li>Provide accurate registration information</li>
              <li>Not have a previously terminated account due to violation of these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Account Registration</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must provide a valid email address and verify it to access all features.</li>
              <li>You are responsible for maintaining the confidentiality of your password and all activity under your account.</li>
              <li>You must notify us immediately at <a href="mailto:missiondistinction108@gmail.com" className="text-primary hover:underline">missiondistinction108@gmail.com</a> if you suspect unauthorised access to your account.</li>
              <li>One account per person. Creating multiple accounts to circumvent restrictions is prohibited.</li>
              <li>Admin accounts require an invitation code and are subject to additional verification.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Free Service & No Warranty</h2>
            <p>
              Mission Distinction is provided <strong className="text-foreground">free of charge</strong> to all registered
              students. We make no representations that the platform will be uninterrupted, error-free, or that content
              will always be accurate. Use the platform as a supplementary study resource — it is{" "}
              <strong className="text-foreground">not a substitute for official NMC-prescribed curriculum materials</strong>,
              textbooks, or guidance from qualified faculty.
            </p>
            <p className="mt-2">
              We reserve the right to modify, suspend, or discontinue any feature or the entire platform at any time
              without prior notice or liability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Academic Content Disclaimer</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-sm">
              <p className="text-yellow-400 font-medium mb-2">⚠️ Important Notice</p>
              <p>
                All quiz questions, notes, and study materials on Mission Distinction are for educational and
                supplementary learning purposes only. Content is <strong className="text-foreground">not officially
                endorsed by the National Medical Commission (NMC), any medical university, or hospital</strong>.
                Always verify clinical information with authoritative sources before applying it in any professional
                context. Mission Distinction accepts no responsibility for academic outcomes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Share, sell, or distribute platform content without written permission</li>
              <li>Use automated tools (bots, scrapers) to access the platform</li>
              <li>Attempt to reverse-engineer, decompile, or tamper with the platform</li>
              <li>Upload or share content that is defamatory, obscene, harassing, or violates any third-party rights</li>
              <li>Impersonate any person, institution, or brand</li>
              <li>Share your login credentials with others</li>
              <li>Use the platform for any commercial purpose without our prior written consent</li>
              <li>Post or share content that violates any applicable Indian law, including the IT Act, 2000</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Community Guidelines</h2>
            <p>
              The Mission Distinction community features (chat, doubts, Q&A) are spaces for academic collaboration.
              All members must:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Be respectful and constructive in all interactions</li>
              <li>Not share personal contact information of other users without consent</li>
              <li>Report inappropriate content using the in-app reporting features</li>
              <li>Not share answers to ongoing assessments or mock tests</li>
            </ul>
            <p className="mt-3">
              Violations of community guidelines may result in a warning, temporary suspension, or permanent ban,
              at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Intellectual Property</h2>
            <p>
              All content on Mission Distinction — including but not limited to quiz questions, study notes, PDF
              summaries, interface design, and branding — is the intellectual property of Mission Distinction or
              its content contributors, and is protected under applicable copyright laws.
            </p>
            <p className="mt-2">
              You are granted a limited, non-exclusive, non-transferable licence to access and use the content
              solely for your personal, non-commercial educational purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. User-Generated Content</h2>
            <p>
              By submitting content (doubts, community posts, answers, feedback) to Mission Distinction, you grant
              us a royalty-free, non-exclusive, worldwide licence to use, display, and moderate such content on
              the platform. You retain ownership of your original content.
            </p>
            <p className="mt-2">
              We reserve the right to remove any user-generated content that violates these Terms or applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Account Suspension & Termination</h2>
            <p>We may suspend or terminate your account if you:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Violate these Terms or our Community Guidelines</li>
              <li>Provide false or misleading registration information</li>
              <li>Engage in any activity that we believe may harm the platform or other users</li>
            </ul>
            <p className="mt-3">
              You may delete your account at any time from your Settings page. Upon deletion, your personal data
              will be processed as described in our{" "}
              <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, Mission Distinction and its operators shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages arising from your use
              of (or inability to use) the platform, including but not limited to loss of data, academic results, or
              opportunities.
            </p>
            <p className="mt-2">
              Our total liability to you for any claim arising from your use of the platform shall not exceed
              ₹500 (Indian Rupees five hundred), or the amount you paid us in the preceding 12 months (whichever
              is greater). Since the platform is free, this liability cap is effectively ₹500.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Grievance Mechanism</h2>
            <p>
              As required under Rule 3(11) of the Information Technology (Intermediary Guidelines and Digital Media
              Ethics Code) Rules, 2021, our designated Grievance Officer can be reached at:
            </p>
            <div className="bg-card/40 border border-border/40 rounded-lg p-4 text-sm mt-3 space-y-1">
              <p className="text-foreground font-medium">Grievance Officer: Mission Distinction Admin</p>
              <p>Email: <a href="mailto:missiondistinction108@gmail.com" className="text-primary hover:underline">missiondistinction108@gmail.com</a></p>
              <p>Response time: We will acknowledge within 24 hours and resolve within 15 days</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">13. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall first be addressed through our
              grievance mechanism. If unresolved, disputes shall be subject to the exclusive jurisdiction of
              the competent courts in Odisha, India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">14. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will provide at least 7 days' notice via an in-app
              announcement before material changes take effect. Continued use of the platform after that date
              constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground/60">
            <p>© 2026 Mission Distinction. All rights reserved.</p>
            <p className="mt-1">
              <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
              {" · "}
              <a href="mailto:missiondistinction108@gmail.com" className="text-primary hover:underline">Contact Us</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
