import React from 'react';
import { Link } from 'react-router-dom';

const LegalLayout = ({ title, subtitle, updatedOn, children }) => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600">Legal</p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{subtitle}</p>
        <p className="mt-4 text-xs text-slate-500">Last updated: {updatedOn}</p>
      </div>

      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {children}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4 text-sm">
        <Link to="/" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
          Back to Home
        </Link>
        <Link to="/terms" className="font-medium text-slate-600 hover:text-slate-800 hover:underline">
          Terms of Service
        </Link>
        <Link to="/privacy" className="font-medium text-slate-600 hover:text-slate-800 hover:underline">
          Privacy Policy
        </Link>
      </div>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
    <div className="mt-2 space-y-3 text-sm leading-6 text-slate-700">{children}</div>
  </section>
);

export const TermsOfServicePage = () => (
  <LegalLayout
    title="Terms of Service"
    subtitle="These terms govern your access to and use of EthioRent services, including listing, browsing, messaging, and payment-related features."
    updatedOn="April 28, 2026"
  >
    <Section title="1. Acceptance of Terms">
      <p>By creating an account or using EthioRent, you agree to these Terms of Service and our Privacy Policy.</p>
      <p>If you do not agree with these terms, please do not use the platform.</p>
    </Section>

    <Section title="2. Eligibility and Accounts">
      <p>You must provide accurate information and keep your credentials secure.</p>
      <p>You are responsible for all activity under your account, including actions taken by anyone who gains access to your credentials.</p>
    </Section>

    <Section title="3. User Responsibilities">
      <p>Renters and owners must provide truthful information, communicate respectfully, and comply with applicable laws.</p>
      <p>Fraudulent listings, impersonation, harassment, or unlawful use of the service may result in suspension or termination.</p>
    </Section>

    <Section title="4. Listings, Verification, and Content">
      <p>Owners are solely responsible for listing accuracy, property availability, and the legality of offers posted.</p>
      <p>EthioRent may review, moderate, or remove content that violates our policies or legal requirements.</p>
    </Section>

    <Section title="5. Payments and Fees">
      <p>Where payment features are available, users agree to applicable service charges and third-party payment provider terms.</p>
      <p>EthioRent is not a bank and does not provide financial or legal advice.</p>
    </Section>

    <Section title="6. Limitation of Liability">
      <p>EthioRent provides a marketplace platform and does not guarantee outcomes of rental transactions between users.</p>
      <p>To the maximum extent permitted by law, EthioRent is not liable for indirect, incidental, or consequential damages arising from platform use.</p>
    </Section>

    <Section title="7. Suspension and Termination">
      <p>We may suspend or terminate accounts for violations of these terms, abuse, security risks, or legal compliance reasons.</p>
      <p>Users may stop using the service at any time.</p>
    </Section>

    <Section title="8. Updates to Terms">
      <p>We may update these terms from time to time. Continued use of the platform after updates means you accept the revised terms.</p>
    </Section>
  </LegalLayout>
);

export const PrivacyPolicyPage = () => (
  <LegalLayout
    title="Privacy Policy"
    subtitle="This policy explains what information we collect, how we use it, and the choices available to you when using EthioRent."
    updatedOn="April 28, 2026"
  >
    <Section title="1. Information We Collect">
      <p>We collect information you provide directly, such as your name, phone number, account role, profile details, and messages sent through the platform.</p>
      <p>We also collect technical data such as device/browser information, session logs, and usage analytics to improve performance and security.</p>
    </Section>

    <Section title="2. How We Use Information">
      <p>We use personal information to provide core platform features, verify accounts, process requests, support communication between users, and enhance service quality.</p>
      <p>We may use aggregated or de-identified data for analytics and service optimization.</p>
    </Section>

    <Section title="3. Sharing of Information">
      <p>We share information only when necessary to operate the platform, comply with legal obligations, prevent fraud, or with trusted service providers acting on our behalf.</p>
      <p>We do not sell your personal information.</p>
    </Section>

    <Section title="4. Data Retention and Security">
      <p>We retain information for as long as needed to provide services, meet legal obligations, resolve disputes, and enforce agreements.</p>
      <p>We apply reasonable administrative and technical safeguards; however, no method of storage or transmission is fully secure.</p>
    </Section>

    <Section title="5. Your Choices and Rights">
      <p>You may request access, correction, or deletion of your account information, subject to legal and operational requirements.</p>
      <p>You may manage cookies and browser permissions through your device or browser settings.</p>
    </Section>

    <Section title="6. Cookies and Similar Technologies">
      <p>We use cookies and local storage for authentication, preferences, and user experience improvements.</p>
      <p>Disabling certain cookies may affect platform functionality.</p>
    </Section>

    <Section title="7. Policy Changes">
      <p>We may update this Privacy Policy periodically. Material changes will be posted on this page with an updated effective date.</p>
    </Section>
  </LegalLayout>
);

