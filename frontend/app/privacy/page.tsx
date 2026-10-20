import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Schedly',
  description: 'Privacy Policy for Schedly and OAuth calendar access',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/login" className="font-semibold text-lg tracking-tight">
            Schedly
          </Link>
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <Link href="/terms" className="hover:text-text-primary">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-text-primary">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-text-secondary mb-8">
          Last updated: October 20, 2026
        </p>

        <div className="space-y-8 text-text-primary leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              1. Introduction
            </h2>
            <p className="text-text-secondary">
              Welcome to Schedly ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and calendar integration services.
            </p>
            <p className="text-text-secondary">
              By accessing or using Schedly, you agree to the collection and use of information in accordance with this policy. If you disagree with any terms in this Privacy Policy, please discontinue use of our services immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              2. Information We Collect
            </h2>
            <p className="text-text-secondary">
              We collect information that you provide directly to us, as well as data automatically collected when you connect your external accounts or interact with our services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>
                <strong className="text-text-primary">Account Information:</strong> When you register for Schedly, we collect your email address, name, and profile details.
              </li>
              <li>
                <strong className="text-text-primary">Calendar Data (OAuth Integration):</strong> When you connect your Google Calendar (or other calendar providers) via OAuth 2.0, we access specific calendar scopes with your explicit consent. This includes calendar metadata, event summaries, descriptions, start and end times, attendee lists, and participant availability.
              </li>
              <li>
                <strong className="text-text-primary">Chat and Interaction Data:</strong> We store conversations, prompts, instructions, and preferences you share with our AI scheduling assistant to provide and personalize your experience.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              3. How We Use Your Information
            </h2>
            <p className="text-text-secondary">
              We use the information we collect for various purposes, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>Providing, operating, and maintaining Schedly's AI calendar and scheduling assistant.</li>
              <li>Reading and analyzing calendar availability to schedule meetings and manage time efficiently.</li>
              <li>Creating, updating, or deleting calendar events on your behalf upon your explicit request or automated agent execution.</li>
              <li>Communicating with you regarding service updates, security alerts, and support.</li>
              <li>Ensuring platform security, preventing abuse, and debugging technical issues.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              4. Google API Services & Limited Use Policy
            </h2>
            <p className="text-text-secondary">
              Schedly's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-info underline hover:opacity-80"
              >
                Google API Services User Data Policy
              </a>
              , including the <strong>Limited Use</strong> requirements.
            </p>
            <p className="text-text-secondary">
              Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>We only use access to read, write, modify, or control calendar events to provide user-facing scheduling features requested by you.</li>
              <li>We do not transfer Google calendar data to third parties unless required by law, or in connection with a merger, acquisition, or asset sale.</li>
              <li>We do not use Google calendar data to serve advertisements.</li>
              <li>We do not allow humans to read your calendar data unless you have affirmatively given explicit consent for specific support or debugging cases, or it is necessary for security purposes.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              5. Data Security & Storage
            </h2>
            <p className="text-text-secondary">
              We implement robust technical and organizational security measures designed to protect your personal data and calendar tokens against accidental loss, unauthorized access, destruction, or alteration. All data in transit is encrypted using TLS/HTTPS, and OAuth tokens are securely encrypted at rest.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              6. Your Rights and Revoking Access
            </h2>
            <p className="text-text-secondary">
              You maintain full control over your calendar integration at all times:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>
                <strong className="text-text-primary">Revoke OAuth Access:</strong> You can disconnect Schedly's access to your Google Calendar at any time through your Google Account permissions page at{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info underline hover:opacity-80"
                >
                  https://myaccount.google.com/permissions
                </a>{' '}
                or via Schedly account settings.
              </li>
              <li>
                <strong className="text-text-primary">Data Deletion:</strong> You can request the complete deletion of your Schedly account and all associated personal data by contacting our support team.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              7. Changes to This Privacy Policy
            </h2>
            <p className="text-text-secondary">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold border-b border-border pb-2">
              8. Contact Us
            </h2>
            <p className="text-text-secondary">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
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
