import bcrypt from "bcryptjs";
import { prisma } from "../src/db/prisma";
import { env } from "../src/config/env";
import { ingestDocument } from "../src/ingest/ingest";

// Demo content. English documents; the assistant answers in the visitor's
// language (EN/ES/PT) grounded in these same sources.
const KBS: {
  name: string;
  description: string;
  color: string;
  docs: { title: string; text: string }[];
}[] = [
  {
    name: "Northwind Product Handbook",
    description: "How the Northwind app works, for customers and new teammates.",
    color: "brand",
    docs: [
      {
        title: "Getting Started",
        text: `Welcome to Northwind.

Northwind is a workspace for teams to manage projects, tasks, and documents in one place. To get started, create a workspace from the dashboard and give it a name. Each workspace is isolated, so a company can run several workspaces for different departments.

Invite your team by opening Settings, then Members, and entering their email addresses. Invited members receive an email with a link to join. You can assign each member a role: Owner, Admin, or Member. Owners can delete the workspace and manage billing. Admins can manage members and settings. Members can create and edit projects but cannot change billing.

After inviting your team, create your first project. A project holds tasks, files, and a discussion thread. You can organize tasks into lists and drag them between stages such as To do, In progress, and Done.`,
      },
      {
        title: "Billing and Plans",
        text: `Northwind offers three plans.

The Free plan includes up to 3 members, 2 projects, and 1 GB of file storage. It is free forever and does not require a credit card.

The Pro plan costs 12 US dollars per member per month, billed monthly, or 10 US dollars per member per month when billed annually. Pro includes unlimited projects, 50 GB of storage per member, priority support, and advanced permissions.

The Business plan costs 22 US dollars per member per month. It adds single sign-on (SSO), audit logs, custom roles, and a dedicated account manager.

You can upgrade or downgrade at any time from Settings, then Billing. When you upgrade, the change takes effect immediately and we charge a prorated amount for the rest of the billing period. When you downgrade, the change takes effect at the start of the next billing period.

Refunds: if you cancel a paid plan within 14 days of your first payment, contact support for a full refund. After 14 days, plans are non-refundable, but you keep access until the end of the period you already paid for.`,
      },
      {
        title: "Security and Data",
        text: `Security at Northwind.

All data is encrypted in transit using TLS 1.2 or higher, and encrypted at rest using AES-256. We never train machine learning models on customer content.

We keep automated backups of your workspace every day and retain them for 30 days. If you delete a project, it moves to Trash and can be restored for 30 days before it is permanently removed.

Business plan customers can enable single sign-on with SAML and enforce it for all members. Business customers also get audit logs that record sign-ins, permission changes, and data exports.

If you delete your workspace, all associated data is permanently erased within 30 days. You can request an export of your data at any time from Settings, then Data, which produces a downloadable archive.`,
      },
    ],
  },
  {
    name: "HR Policies",
    description: "Company policies for employees: time off, remote work, and conduct.",
    color: "emerald",
    docs: [
      {
        title: "Time Off Policy",
        text: `Paid time off.

Full-time employees receive 22 days of paid vacation per year, accrued monthly. Unused vacation of up to 5 days can be carried over into the next calendar year; anything above 5 days is forfeited at year end.

Sick leave is separate from vacation. Employees receive 10 paid sick days per year. Sick days do not carry over. For any absence longer than 3 consecutive days, a medical note is required.

To request time off, submit a request in the HR portal at least 2 weeks in advance for vacation. Your manager approves or declines within 3 business days. Sick leave can be reported on the same day by notifying your manager and logging it in the portal.

Public holidays follow the national calendar and do not count against your vacation balance.`,
      },
      {
        title: "Remote Work Policy",
        text: `Working remotely.

All employees may work remotely up to 3 days per week. Fully remote arrangements are available for specific roles and require director approval.

Remote employees receive a one-time home office stipend of 500 US dollars for equipment, plus 40 US dollars per month toward internet costs. Equipment purchased with the stipend remains company property.

Core collaboration hours are 10:00 to 16:00 in your team's primary time zone. Outside those hours you can arrange your schedule freely as long as your work is completed and meetings are attended.

When working remotely, you must use the company VPN to access internal systems, keep your device locked when unattended, and never store customer data on personal drives.`,
      },
      {
        title: "Code of Conduct",
        text: `Our code of conduct.

We are committed to a respectful, inclusive workplace. Harassment, discrimination, and bullying of any kind are not tolerated, whether in person or online.

Employees should act with honesty and integrity, avoid conflicts of interest, and protect confidential company and customer information.

If you experience or witness a violation, report it to your manager or to the HR team through the confidential reporting form. All reports are handled discreetly, and retaliation against anyone who reports a concern in good faith is strictly prohibited.

Violations of this code may result in disciplinary action, up to and including termination.`,
      },
    ],
  },
  {
    name: "Support FAQ",
    description: "Common questions from customers about accounts, integrations, and issues.",
    color: "sky",
    docs: [
      {
        title: "Account and Login",
        text: `Account and login questions.

To reset your password, go to the sign-in page and click "Forgot password". Enter your email and we will send a reset link that is valid for 60 minutes.

To enable two-factor authentication, open Settings, then Security, and choose "Enable 2FA". You can use any authenticator app such as Google Authenticator or Authy. We recommend saving your backup codes in a safe place.

To change the email address on your account, open Settings, then Profile, and update your email. We will send a confirmation link to the new address; the change takes effect once you confirm it.

If you are locked out and cannot receive reset emails, contact support with the email on your account and we will help you recover access.`,
      },
      {
        title: "Integrations",
        text: `Integrations and the API.

Northwind connects to Slack, so you can receive notifications in a channel when tasks are assigned or completed. To connect Slack, open Settings, then Integrations, and click "Connect Slack".

You can create API keys from Settings, then Developer. Each key is shown only once, so copy it immediately. API requests are authenticated with a Bearer token and are rate limited to 100 requests per minute.

Webhooks let you receive real-time events. Add a webhook URL in the Developer settings and choose which events to subscribe to, such as task.created or project.updated. We sign every webhook payload so you can verify it came from us.

A Zapier integration is available for connecting Northwind to thousands of other apps without writing code.`,
      },
      {
        title: "Troubleshooting",
        text: `Troubleshooting common issues.

If the app is slow or not loading, first check our status page for any ongoing incidents. Then try a hard refresh, clear your browser cache, or use an incognito window to rule out extensions.

If you see an "Access denied" error, your role may not have permission for that action. Ask a workspace Admin or Owner to adjust your role in Settings, then Members.

If file uploads fail, confirm the file is under the 25 MB limit and is a supported type. Very large files should be shared as a link instead.

Still stuck? Contact support from the Help menu, or email support@northwind.example. Support is available Monday to Friday, 9:00 to 18:00, and Business plan customers receive priority responses within 4 hours.`,
      },
    ],
  },
];

async function main() {
  const email = env.demoEmail.toLowerCase();

  // Idempotent: wipe any prior demo data (cascade) and rebuild.
  await prisma.user.deleteMany({ where: { email } });

  const passwordHash = await bcrypt.hash(env.demoPassword, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name: "Demo User", locale: "en" },
  });
  console.log("Created demo user:", user.email);

  for (const kbSpec of KBS) {
    const kb = await prisma.knowledgeBase.create({
      data: {
        userId: user.id,
        name: kbSpec.name,
        description: kbSpec.description,
        color: kbSpec.color,
      },
    });
    console.log(`\nKB: ${kb.name}`);
    for (const doc of kbSpec.docs) {
      const d = await ingestDocument({
        kbId: kb.id,
        title: doc.title,
        sourceType: "TEXT",
        text: doc.text,
      });
      console.log(`  - ${doc.title}: ${d.status} (${d.chunkCount} passages)`);
    }
  }

  await prisma.$disconnect();
  console.log("\nSeed complete.");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
