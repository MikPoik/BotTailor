
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Service - BotTailor";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'BotTailor Terms of Service - Review the terms and conditions for using our AI chatbot platform and services.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Terms of Service
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please read these Terms of Service carefully before using BotTailor's services.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                By accessing or using BotTailor's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                BotTailor provides AI-powered chatbot creation and hosting services. Our platform allows users to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Create and customize AI chatbots</li>
                <li>• Embed chatbots on websites and applications</li>
                <li>• Access conversation analytics and history</li>
                <li>• Configure chatbot behavior and appearance</li>
                <li>• Integrate with third-party services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To use our services, you must create an account. You agree to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Provide accurate and complete information</li>
                <li>• Maintain the security of your account credentials</li>
                <li>• Notify us immediately of any unauthorized access</li>
                <li>• Be responsible for all activities under your account</li>
                <li>• Use the service only for lawful purposes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Acceptable Use Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You agree not to use our services to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Create chatbots that spread misinformation or harmful content</li>
                <li>• Impersonate others or misrepresent your identity</li>
                <li>• Violate any applicable laws or regulations</li>
                <li>• Infringe on intellectual property rights</li>
                <li>• Attempt to gain unauthorized access to our systems</li>
                <li>• Distribute malware or engage in malicious activities</li>
                <li>• Spam or harass other users</li>
                <li>• Create content that is defamatory, obscene, or offensive</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Subscription Plans and Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Payment Terms</h3>
                <p className="text-muted-foreground">
                  Subscription fees are charged in advance on a monthly basis. All fees are non-refundable except as required by law.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Plan Limits</h3>
                <p className="text-muted-foreground">
                  Each subscription plan has specific limits on the number of chatbots, messages, and features. Exceeding these limits may result in service restrictions or automatic upgrades.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cancellation</h3>
                <p className="text-muted-foreground">
                  You may cancel your subscription at any time. Cancellation will take effect at the end of the current billing period.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Intellectual Property Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Our IP</h3>
                <p className="text-muted-foreground">
                  BotTailor retains all rights, title, and interest in our platform, technology, and services. You are granted a limited, non-exclusive license to use our services.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Your Content</h3>
                <p className="text-muted-foreground">
                  You retain ownership of the content you create using our services. By using our platform, you grant us a limited license to host, store, and process your content to provide our services.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using our services, you consent to our privacy practices as described in our Privacy Policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Service Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We strive to maintain high service availability but cannot guarantee uninterrupted service. We may:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Perform scheduled maintenance with advance notice</li>
                <li>• Temporarily suspend service for security or technical reasons</li>
                <li>• Modify or discontinue features with reasonable notice</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BOTTAILOR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OUR SERVICES.
              </p>
              <p className="text-muted-foreground">
                Our total liability to you for any claims shall not exceed the amount you paid us in the twelve months preceding the claim.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless BotTailor from any claims, damages, or expenses arising from your use of our services, violation of these terms, or infringement of any rights of another party.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>11. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to our services immediately, without prior notice, for any violation of these Terms of Service or for any other reason we deem necessary.
              </p>
              <p className="text-muted-foreground">
                Upon termination, your right to use our services will cease immediately, and we may delete your account and associated data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>12. Governing Law</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                These Terms of Service are governed by and construed in accordance with the laws of [Your Jurisdiction]. Any disputes arising from these terms shall be resolved in the courts of [Your Jurisdiction].
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>13. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We reserve the right to modify these Terms of Service at any time. Material changes will be communicated via email or through our platform. Continued use of our services after changes constitutes acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>14. Severability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If any provision of these Terms of Service is found to be unenforceable or invalid, the remaining provisions will continue in full force and effect.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>15. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p>Email: legal@bottailor.com</p>
                <p>Address: [Your Company Address]</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
