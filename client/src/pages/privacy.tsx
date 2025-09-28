
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RouteDefinition } from "@shared/route-metadata";

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy - BotTailor";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'BotTailor Privacy Policy - Learn how we collect, use, and protect your personal information when using our AI chatbot platform.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Privacy Policy
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
            Your Privacy Matters
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            This Privacy Policy explains how BotTailor collects, uses, and protects your information when you use our services.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <p className="text-muted-foreground">
                  When you create an account, we collect information such as your name, email address, and profile information provided through your authentication provider (Google, GitHub, etc.).
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage Data</h3>
                <p className="text-muted-foreground">
                  We collect information about how you use our service, including chatbot interactions, conversation logs, and usage patterns to improve our service quality.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Technical Data</h3>
                <p className="text-muted-foreground">
                  We automatically collect certain technical information, including your IP address, browser type, device information, and usage analytics.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-muted-foreground">
                <li>• Provide and maintain our chatbot services</li>
                <li>• Process your transactions and manage your subscription</li>
                <li>• Improve our AI models and service quality</li>
                <li>• Send you important updates about our service</li>
                <li>• Provide customer support and respond to your inquiries</li>
                <li>• Detect and prevent fraud or abuse</li>
                <li>• Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• With service providers who help us operate our platform (hosting, analytics, payment processing)</li>
                <li>• When required by law or to respond to legal process</li>
                <li>• To protect our rights, privacy, safety, or property</li>
                <li>• In connection with a business transfer or acquisition</li>
                <li>• With your explicit consent</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational security measures to protect your information against unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Encryption of data in transit and at rest</li>
                <li>• Regular security audits and monitoring</li>
                <li>• Access controls and authentication mechanisms</li>
                <li>• Secure hosting infrastructure</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Specifically:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Account information: Until you delete your account or request deletion</li>
                <li>• Usage analytics: Aggregated data may be retained indefinitely</li>
                <li>• Legal compliance: As required by applicable laws</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You have the following rights regarding your personal information:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Access: Request a copy of your personal data</li>
                <li>• Rectification: Correct inaccurate or incomplete information</li>
                <li>• Erasure: Request deletion of your personal data</li>
                <li>• Portability: Receive your data in a structured, machine-readable format</li>
                <li>• Objection: Object to processing based on legitimate interests</li>
                <li>• Restriction: Request limitation of processing in certain circumstances</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, please contact us at privacy@bottailor.com
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to enhance your experience on our platform. These include:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Essential cookies for authentication and security</li>
                <li>• Analytics cookies to understand usage patterns</li>
                <li>• Preference cookies to remember your settings</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                You can control cookies through your browser settings, though this may affect functionality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our service integrates with third-party providers, including:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• OpenAI for AI model services</li>
                <li>• Authentication providers (Google, GitHub)</li>
                <li>• Payment processors (Stripe)</li>
                <li>• Hosting and infrastructure providers</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                These services have their own privacy policies, and we encourage you to review them.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during international transfers, including standard contractual clauses and adequacy decisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p>Email: support@bottailor.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const route: RouteDefinition = {
  path: "/privacy",
  metadata: {
    title: "Privacy Policy - BotTailor | Your Data Protection",
    description:
      "Learn how BotTailor protects your privacy and handles your data. Transparent privacy practices for AI chatbot services.",
    keywords: "privacy policy, data protection, BotTailor privacy, chatbot privacy",
    ogTitle: "Privacy Policy - BotTailor",
    ogDescription:
      "Learn how BotTailor protects your privacy and handles your data.",
    ogImage: "https://bottailor.com/og-privacy.jpg",
    canonical: "https://bottailor.com/privacy",
  },
};
