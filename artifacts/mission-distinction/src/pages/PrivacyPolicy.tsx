import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
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
            <Shield className="text-primary h-7 w-7" />
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Last updated: 15 June 2026 · Effective date: 15 June 2026
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground leading-7">

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. About This Policy</h2>
            <p>
              Mission Distinction ("we", "us", "our") is a free medical education platform operated for 1st Year MBBS
              students in Odisha, India. This Privacy Policy describes how we collect, use, store, and protect your
              personal data in compliance with the <strong className="text-foreground">Digital Personal Data Protection Act, 2023
              (DPDPA 2023)</strong>, the Information Technology Act, 2000, and other applicable Indian laws.
            </p>
            <p>
              By registering or using Mission Distinction, you (the "Data Principal") consent to the practices described
              in this policy. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Data Fiduciary</h2>
            <p>The Data Fiduciary responsible for your personal data is:</p>
            <div className="bg-card/40 border border-border/40 rounded-lg p-4 mt-3 text-sm">
              <p className="text-foreground font-medium">Mission Distinction</p>
              <p>Email: <a href="mailto:missiondistinction108@gmail.com" className="text-primary hover:underline">missiondistinction108@gmail.com</a></p>
              <p>Platform: <span className="text-foreground">missiondistinction.in</span></p>
              <p>Grievance Officer: Admin, Mission Distinction</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Personal Data We Collect</h2>
            <p>We collect only the data necessary to provide our services ("purpose limitation" under DPDPA 2023):</p>
            <table className="w-full text-sm mt-3 border border-border/40 rounded-lg overflow-hidden">
              <thead className="bg-card/60 text-foreground">
                <tr>
                  <th className="text-left p-3 border-b border-border/40">Data</th>
                  <th className="text-left p-3 border-b border-border/40">Purpose</th>
                  <th className="text-left p-3 border-b border-border/40">Required?</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Full name", "Display in profile and leaderboard", "Yes"],
                  ["Email address", "Account creation, email verification, password reset", "Yes"],
                  ["Mobile number", "Optional contact for account recovery", "No"],
                  ["College & academic year", "Personalise content; college leaderboard", "Yes"],
                  ["Password (hashed)", "Authentication — stored as bcrypt hash, never in plain text", "Yes"],
                  ["Profile photo", "Avatar display — uploaded to Cloudinary", "No"],
                  ["Quiz scores & attempts", "Progress tracking, leaderboard, analytics", "Yes"],
                  ["Study streak", "Gamification and motivation features", "Auto"],
                  ["Bookmarks", "Save notes, PDFs for later access", "Auto"],
                  ["Feedback & doubts", "Improve platform; answer student queries", "No"],
                  ["Device push token", "Optional push notifications for announcements", "No"],
                  ["IP address & device info", "Security logging, fraud prevention", "Auto"],
                ].map(([data, purpose, req]) => (
                  <tr key={data} className="border-b border-border/20">
                    <td className="p-3 text-foreground font-medium">{data}</td>
                    <td className="p-3">{purpose}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${req === "Yes" ? "bg-primary/20 text-primary" : req === "No" ? "bg-muted text-muted-foreground" : "bg-blue-500/20 text-blue-400"}`}>
                        {req}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To create and manage your account</li>
              <li>To provide access to quizzes, notes, PDFs, and community features</li>
              <li>To display progress, leaderboard rankings, and study streaks</li>
              <li>To send transactional emails (email verification, password reset)</li>
              <li>To send push notifications about new content and announcements (only with your consent)</li>
              <li>To detect and prevent fraud, abuse, or security breaches</li>
              <li>To improve platform features based on aggregated, anonymised usage data</li>
              <li>To respond to your doubts, feedback, and support requests</li>
            </ul>
            <p className="mt-3">
              We <strong className="text-foreground">do not</strong> sell, rent, or trade your personal data to third parties
              for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Third-Party Service Providers</h2>
            <p>We use the following sub-processors who may process your personal data on our behalf:</p>
            <div className="space-y-3 mt-3">
              {[
                ["Cloudinary", "Image hosting for profile avatars", "USA", "Data Processing Agreement in place"],
                ["SendGrid (Twilio)", "Transactional email delivery", "USA", "Email addresses only"],
                ["Firebase (Google)", "Google OAuth sign-in", "USA", "OAuth token only; governed by Google's Privacy Policy"],
                ["PostHog", "Product analytics (anonymised, no PII)", "EU/USA", "Anonymised event data only"],
                ["Replit Inc.", "Cloud hosting infrastructure", "USA", "Infrastructure provider"],
              ].map(([provider, purpose, country, note]) => (
                <div key={provider} className="bg-card/30 border border-border/30 rounded-lg p-3 text-sm">
                  <p className="text-foreground font-medium">{provider}</p>
                  <p>{purpose} · <span className="text-foreground/60">Stored in: {country}</span></p>
                  <p className="text-xs text-muted-foreground/80 mt-1">{note}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Data Retention</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-foreground">Active accounts:</strong> Data retained while your account is active</li>
              <li><strong className="text-foreground">Deleted accounts:</strong> Personal data (name, email, mobile number) is deleted within 30 days of an account deletion request. Anonymised quiz statistics may be retained for analytical purposes.</li>
              <li><strong className="text-foreground">Security logs:</strong> Retained for 180 days as required by CERT-In Directive 2022</li>
              <li><strong className="text-foreground">Email tokens:</strong> Deleted immediately after use or after 24 hours, whichever comes first</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Your Rights Under DPDPA 2023</h2>
            <p>As a Data Principal under the Digital Personal Data Protection Act, 2023, you have the following rights:</p>
            <div className="space-y-3 mt-3">
              {[
                ["Right to Access (§11)", "Request a summary of the personal data we hold about you and the purposes for which it is processed."],
                ["Right to Correction (§12)", "Request correction or update of inaccurate personal data."],
                ["Right to Erasure (§12)", "Request deletion of your personal data. You can do this directly from your Settings page. We will process your request within 30 days."],
                ["Right to Grievance Redressal (§13)", "Lodge a grievance with us. We will respond within 72 hours. If unsatisfied, you may approach the Data Protection Board of India."],
                ["Right to Nominate (§14)", "Nominate a person to exercise your rights in case of your death or incapacity."],
                ["Right to Withdraw Consent", "Withdraw your consent at any time by deleting your account. This will not affect the lawfulness of processing based on consent before withdrawal."],
              ].map(([right, desc]) => (
                <div key={right} className="bg-card/30 border border-border/30 rounded-lg p-3">
                  <p className="text-foreground font-medium text-sm">{right}</p>
                  <p className="text-sm mt-1">{desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              To exercise any of these rights, email us at{" "}
              <a href="mailto:missiondistinction108@gmail.com" className="text-primary hover:underline">
                missiondistinction108@gmail.com
              </a>{" "}
              with the subject line "DPDPA Data Request — [Your Right]".
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Data Security</h2>
            <p>We implement reasonable security practices and procedures as required under §8(4) of DPDPA 2023 and Rule 8 of IT (Reasonable Security Practices) Rules:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Passwords stored as bcrypt hashes (never in plain text)</li>
              <li>All data transmitted over HTTPS (TLS 1.2+)</li>
              <li>JSON Web Tokens with 15-minute expiry + rotating refresh tokens</li>
              <li>Rate limiting on all authentication endpoints</li>
              <li>Input sanitisation to prevent injection attacks</li>
              <li>Security headers (Helmet.js: HSTS, CSP, X-Frame-Options)</li>
            </ul>
            <p className="mt-3">
              In the event of a data breach, we will notify affected users and the Data Protection Board of India within the
              timeframe prescribed by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Children's Privacy</h2>
            <p>
              Mission Distinction is intended for MBBS students who are typically 18 years of age or older. We do not
              knowingly collect personal data from individuals under 18. If you believe a minor has registered, please
              contact us immediately at{" "}
              <a href="mailto:missiondistinction108@gmail.com" className="text-primary hover:underline">
                missiondistinction108@gmail.com
              </a>{" "}
              and we will delete the account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Cookies and Local Storage</h2>
            <p>
              Mission Distinction is a Progressive Web App (PWA) that uses browser{" "}
              <strong className="text-foreground">localStorage</strong> (not cookies) to store your authentication token
              and session data. This data never leaves your device except as part of API requests to our server. We do not
              use third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via an in-app
              announcement at least 7 days before the changes take effect. Continued use of the platform after the
              effective date constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Grievance Officer & Contact</h2>
            <div className="bg-card/40 border border-border/40 rounded-lg p-4 text-sm space-y-1">
              <p className="text-foreground font-medium">Grievance Officer: Mission Distinction Admin</p>
              <p>Email: <a href="mailto:missiondistinction108@gmail.com" className="text-primary hover:underline">missiondistinction108@gmail.com</a></p>
              <p>Response time: Within 72 hours on business days</p>
              <p className="text-xs text-muted-foreground mt-2">
                If your grievance is not resolved to your satisfaction, you may approach the{" "}
                <strong className="text-foreground">Data Protection Board of India</strong> as per §18 of the DPDPA 2023.
              </p>
            </div>
          </section>

          <div className="border-t border-border/40 pt-6 text-xs text-muted-foreground/60">
            <p>This Privacy Policy is governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Odisha, India.</p>
            <p className="mt-2">© 2026 Mission Distinction. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
