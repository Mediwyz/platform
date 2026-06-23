import { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Privacy Policy - MediWyz',
 description: 'MediWyz Privacy Policy',
}

export default function PrivacyPage() {
 return (
 <div className="container mx-auto px-4 py-12">
 <h1 className="text-4xl font-bold mb-8">MediWyz – Privacy Policy</h1>
 
 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
 <p>MediWyz is committed to safeguarding your privacy and protecting your personal data. This Privacy Policy explains how we collect, use, store, and share your information in compliance with the Mauritius Data Protection Act 2017 and any other applicable healthcare data regulations.</p>
 <p>By using our platform, you consent to the practices described in this policy.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">2. What Data We Collect</h2>
 <p>We may collect the following types of data:</p>
 <ul className="list-disc pl-6">
 <li>Personal Identification Data: Name, contact information (phone number, email), date of birth, address.</li>
 <li>Health and Medical Information: Symptoms, health history, prescriptions, test results, and other health-related information shared with your provider.</li>
 <li>Payment Data: Billing address, payment method, transaction history (processed securely by third-party payment providers).</li>
 <li>Technical Data: Device information, IP address, browser type, cookies, and usage analytics to improve platform functionality.</li>
 </ul>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
 <p>We process your personal and health data for the following purposes:</p>
 <ul className="list-disc pl-6">
 <li>To connect you with licensed healthcare providers and facilitate consultations.</li>
 <li>To arrange lab tests, home visits, and medication delivery services.</li>
 <li>To process payments and manage your account.</li>
 <li>To improve and personalize your experience on the platform.</li>
 <li>To comply with legal obligations under Mauritius law, including medical record-keeping and reporting requirements.</li>
 </ul>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing (Mauritius DPA 2017)</h2>
 <p>MediWyz processes your data only when:</p>
 <ul className="list-disc pl-6">
 <li>You have given explicit consent (especially for health-related data).</li>
 <li>It is necessary to perform the services you requested.</li>
 <li>It is required to comply with applicable laws and healthcare regulations.</li>
 <li>It is required to protect your vital interests (e.g., in case of a medical emergency).</li>
 </ul>
 <p>You have the right to withdraw consent at any time (see Section 9).</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Third Parties</h2>
 <p>Your information may be shared with licensed healthcare professionals, diagnostic labs, and pharmacies to fulfill the services you request.</p>
 <p>We may share limited, anonymized analytics with technology providers for improving platform performance.</p>
 <p>We do not sell or rent your personal or health data to any third parties.</p>
 <p>All partners are bound by legal agreements requiring them to maintain confidentiality and comply with Mauritian healthcare and data protection regulations.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">6. Data Storage and Security</h2>
 <p>All personal and health data are stored securely using encryption and access controls.</p>
 <p>Only authorized staff and providers have access to your data on a need-to-know basis.</p>
 <p>We implement organizational, technical, and administrative measures to prevent unauthorized access, misuse, or loss of data.</p>
 <p>Data is stored in compliance with Mauritius DPA 2017 and healthcare data retention laws.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">7. Data of Children</h2>
 <p>Users under 18 years of age must have a parent or legal consent of guardian to use MediWyz services.</p>
 <p>The guardian assumes responsibility for providing accurate information and overseeing the child’s use of the platform.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">8. Cookies and Analytics</h2>
 <p>MediWyz uses cookies and analytics tools to enhance user experience and understand platform usage.</p>
 <p>You can disable cookies in your browser, but some features may not work properly.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">9. Your Rights Under Mauritius DPA 2017</h2>
 <p>You have the right to:</p>
 <ul className="list-disc pl-6">
 <li>Access and obtain a copy of your personal data.</li>
 <li>Request corrections of inaccurate or incomplete data.</li>
 <li>Request deletion of your personal data (subject to legal/medical retention requirements).</li>
 <li>Withdraw consent for data processing.</li>
 <li>Lodge a complaint with the Mauritius Data Protection Office if you believe your rights are violated.</li>
 </ul>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
 <p>We retain personal and health data only for as long as necessary to provide services and comply with legal obligations. Medical records may be retained as per Mauritius healthcare laws.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">11. Third-Party Links</h2>
 <p>Our platform may contain links to external websites. MediWyz is not responsible for the privacy practices or content of these third parties.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">12. Updates to This Policy</h2>
 <p>We may revise this Privacy Policy from time to time. Significant changes will be notified through our platform or email.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
 <p>If you have any questions about this Privacy Policy or want to exercise your rights, contact us at:</p>
 <p>Email: [Insert Email]</p>
 <p>Address: [Insert Office Address]</p>
 <p>Phone: [Insert Phone Number]</p>
 </section>
 </div>
 )
}