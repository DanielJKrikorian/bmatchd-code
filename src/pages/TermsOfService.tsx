import React from 'react';

const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <p className="text-sm text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <p>
            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using 
            the BMATCHD website (the "Service") operated by Events Hub Inc. ("us", "we", "our", or "Company").
          </p>

          <p className="mt-4">
            Your access to and use of the Service is conditioned on your acceptance of and compliance with 
            these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
          </p>

          <p className="mt-4">
            By accessing or using the Service you agree to be bound by these Terms. If you disagree 
            with any part of the terms then you may not access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Vendor Liability Disclaimer</h2>
          <p>
            BMATCHD is a platform that facilitates connections between couples and wedding vendors. We do not:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Endorse or guarantee the work quality of any vendor listed on our platform</li>
            <li>Take responsibility for any vendor's actions, services, or products</li>
            <li>Guarantee the accuracy of vendor information, reviews, or ratings</li>
            <li>Act as an agent, representative, or partner of any vendor</li>
          </ul>

          <p className="mt-4">
            Our matching system and vendor recommendations are based on the information provided by both vendors 
            and couples. While we strive to provide accurate matches, we make no guarantees about the suitability 
            of any vendor for your specific needs.
          </p>

          <p className="mt-4">
            Users are solely responsible for:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Verifying vendor credentials and licenses</li>
            <li>Conducting due diligence before hiring any vendor</li>
            <li>Negotiating and agreeing to terms directly with vendors</li>
            <li>Any contracts or agreements made with vendors</li>
            <li>Any disputes that may arise with vendors</li>
          </ul>

          <p className="mt-4 font-medium">
            BMATCHD SHALL NOT BE LIABLE FOR ANY CLAIMS, DAMAGES, LOSSES, OR EXPENSES ARISING FROM OR RELATED TO 
            ANY VENDOR'S SERVICES, PRODUCTS, ACTIONS, OR CONDUCT. ALL DEALINGS WITH VENDORS ARE SOLELY BETWEEN 
            THE USER AND THE VENDOR.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Company Information</h2>
          <p>
            Events Hub Inc.<br />
            276 Turnpike Rd. Suite 211<br />
            Westborough, MA 01581<br />
            Email: info@bmatchd.com
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate, complete, and current 
            information. Failure to do so constitutes a breach of the Terms, which may result in 
            immediate termination of your account on our Service.
          </p>

          <p className="mt-4">
            You are responsible for safeguarding the password that you use to access the Service and 
            for any activities or actions under your password, whether your password is with our 
            Service or a third-party service.
          </p>

          <p className="mt-4">
            You agree not to disclose your password to any third party. You must notify us immediately 
            upon becoming aware of any breach of security or unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Subscription Terms</h2>
          <p>
            Some parts of the Service are billed on a subscription basis. You will be billed in 
            advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set 
            on a monthly or annual basis, depending on the type of subscription plan you select.
          </p>

          <p className="mt-4">
            At the end of each Billing Cycle, your subscription will automatically renew under the 
            exact same conditions unless you cancel it or we cancel it. You may cancel your 
            subscription renewal through your online account management page.
          </p>

          <p className="mt-4">
            A valid payment method, including credit card, is required to process the payment for your 
            subscription. You shall provide us with accurate and complete billing information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Fee Changes</h2>
          <p>
            We, in our sole discretion and at any time, may modify the Subscription fees. Any 
            Subscription fee change will become effective at the end of the then-current Billing Cycle.
          </p>

          <p className="mt-4">
            We will provide you with reasonable prior notice of any change in Subscription fees to 
            give you an opportunity to terminate your Subscription before such change becomes effective.
          </p>

          <p className="mt-4">
            Your continued use of the Service after the Subscription fee change comes into effect 
            constitutes your agreement to pay the modified Subscription fee amount.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Refunds</h2>
          <p>
            Except when required by law, paid Subscription fees are non-refundable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make available certain 
            information, text, graphics, videos, or other material ("Content"). You are responsible 
            for the Content that you post to the Service, including its legality, reliability, 
            and appropriateness.
          </p>

          <p className="mt-4">
            By posting Content to the Service, you grant us the right and license to use, modify, 
            perform, display, reproduce, and distribute such Content on and through the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Prohibited Uses</h2>
          <p>You agree not to use the Service:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>In any way that violates any applicable law or regulation</li>
            <li>To harass, abuse, or harm another person</li>
            <li>To impersonate or attempt to impersonate the Company, another user, or any other person</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use of the Service</li>
            <li>To attempt to gain unauthorized access to any portion of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Intellectual Property</h2>
          <p>
            The Service and its original content (excluding Content provided by users), features, and 
            functionality are and will remain the exclusive property of Events Hub Inc. and its 
            licensors. The Service is protected by copyright, trademark, and other laws.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, 
            for any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <p className="mt-4">
            Upon termination, your right to use the Service will immediately cease. If you wish to 
            terminate your account, you may simply discontinue using the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Limitation of Liability</h2>
          <p>
            In no event shall Events Hub Inc., nor its directors, employees, partners, agents, 
            suppliers, or affiliates, be liable for any indirect, incidental, special, consequential 
            or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
            or other intangible losses, resulting from your access to or use of or inability to 
            access or use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Disclaimer</h2>
          <p>
            Your use of the Service is at your sole risk. The Service is provided on an "AS IS" 
            and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, 
            whether express or implied.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of Massachusetts, 
            United States, without regard to its conflict of law provisions.
          </p>

          <p className="mt-4">
            Our failure to enforce any right or provision of these Terms will not be considered a 
            waiver of those rights. If any provision of these Terms is held to be invalid or 
            unenforceable by a court, the remaining provisions of these Terms will remain in effect.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any 
            time. If a revision is material we will try to provide at least 30 days' notice prior 
            to any new terms taking effect.
          </p>

          <p className="mt-4">
            By continuing to access or use our Service after those revisions become effective, 
            you agree to be bound by the revised terms. If you do not agree to the new terms, 
            please stop using the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p className="mt-4">
            Events Hub Inc.<br />
            276 Turnpike Rd. Suite 211<br />
            Westborough, MA 01581<br />
            Email: info@bmatchd.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;