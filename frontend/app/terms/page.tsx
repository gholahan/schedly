import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Schedly',
  description: 'Terms of Service for Schedly and calendar integration services',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/login" className="font-semibold text-lg tracking-tight">
            Schedly
          </Link>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <Link href="/privacy" className="hover:text-text-primary">
              Privacy Policy
            </Link>
            <Link href="/login" className="hover:text-text-primary">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-text-secondary mb-8">
          Last updated: October 20, 2026
        </p>

        <div className="space-y-8 text-text-primary leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              1. Acceptance of Terms
            </h2>
            <p className="text-text-secondary">
              Welcome to Schedly. By accessing or using our website, web application, AI scheduling assistant, and calendar integration services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              2. Description of Service
            </h2>
            <p className="text-text-secondary">
              Schedly is an AI-powered calendar management and scheduling assistant. The Service connects with third-party calendar providers (such as Google Calendar) via OAuth 2.0 to read availability, organize schedules, and create or update calendar events based on your instructions and natural language prompts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              3. Account Registration and Security
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</li>
              <li>You must immediately notify us of any unauthorized use or security breaches of your account.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              4. Calendar Integration and OAuth Access
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>By connecting your external calendar (e.g., Google Calendar), you grant Schedly permission to access, read, create, and modify calendar events as required to deliver the scheduling features.</li>
              <li>You represent and warrant that you have all necessary rights and permissions to connect your calendar accounts and grant us access to calendar data.</li>
              <li>You can revoke calendar access at any time through your calendar provider settings or your Schedly account settings.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              5. Acceptable Use Policy
            </h2>
            <p className="text-text-secondary">
              You agree not to misuse the Service or assist any other party in doing so. Specifically, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>Use the Service for any unlawful purpose or in violation of any local, state, national, or international law.</li>
              <li>Attempt to gain unauthorized access to Schedly systems, user accounts, or connected calendar data.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Use automated scraping, bots, or unauthorized scripts to extract data from Schedly.</li>
              <li>Submit malicious code, viruses, or harmful prompts intended to exploit or compromise the AI models or application infrastructure.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              6. Intellectual Property Rights
            </h2>
            <p className="text-text-secondary">
              All rights, title, and interest in and to the Service (excluding user content and connected calendar data), including user interface design, graphics, code, algorithms, and trademarks, are and will remain the exclusive property of Schedly and its licensors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              7. Disclaimer of Warranties
            </h2>
            <p className="text-text-secondary">
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee that the Service will be uninterrupted, error-free, or completely secure, or that AI-scheduled events will be error-free.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              8. Limitation of Liability
            </h2>
            <p className="text-text-secondary">
              To the maximum extent permitted by law, Schedly shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your access to or use of (or inability to use) the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              9. Termination
            </h2>
            <p className="text-text-secondary">
              We may suspend or terminate your access to the Service at any time, with or without cause or notice, if we believe you have violated these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              10. Changes to Terms
            </h2>
            <p className="text-text-secondary">
              We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the date at the top of these Terms. Your continued use of the Service after such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              11. Contact Information
            </h2>
            <p className="text-text-secondary">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-text-primary font-medium">
              Email: support@schedly.ai
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 mt-16 text-center text-sm text-text-secondary">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 Schedly. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
