import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <p className="text-sm text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <p>
            This Privacy Policy describes how Events Hub Inc. ("we," "us," or "our") collects, uses, 
            and discloses your information when you use our website BMATCHD (the "Site") and our services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Information</h2>
          <p>
            Events Hub Inc.<br />
            276 Turnpike Rd. Suite 211<br />
            Westborough, MA 01581<br />
            Email: info@bmatchd.com
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
          <p>We collect several types of information from and about users of our Site, including:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>
              <strong>Personal Information:</strong> Name, email address, phone number, and postal address.
            </li>
            <li>
              <strong>Business Information:</strong> Company name, business type, and business contact information.
            </li>
            <li>
              <strong>Payment Information:</strong> Credit card numbers and billing information (processed securely through our payment processor).
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you use our Site and services.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Provide and maintain our services</li>
            <li>Process your transactions and manage your account</li>
            <li>Send you important information about our services</li>
            <li>Improve and optimize our Site and services</li>
            <li>Detect, prevent, and address technical issues</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Information Sharing and Disclosure</h2>
          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Service providers who assist in operating our Site and services</li>
            <li>Law enforcement or other governmental agencies, as required by law</li>
            <li>Other users of the Site, as necessary to provide our services</li>
            <li>Business partners, with your consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your 
            personal information. However, no method of transmission over the Internet or electronic 
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate personal information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to the processing of your personal information</li>
            <li>Request restrictions on the processing of your personal information</li>
            <li>Request the transfer of your personal information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our Site and store 
            certain information. You can instruct your browser to refuse all cookies or to indicate 
            when a cookie is being sent.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Children's Privacy</h2>
          <p>
            Our Site is not intended for children under 13 years of age. We do not knowingly collect 
            personal information from children under 13. If you are a parent or guardian and believe 
            your child has provided us with personal information, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by 
            posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;