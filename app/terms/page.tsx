import { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Terms of Service - MediWyz',
 description: 'MediWyz Terms of Service',
}

export default function TermsPage() {
 return (
 <div className="container mx-auto px-4 py-12">
 <h1 className="text-4xl font-bold mb-8">MediWyz – Terms of Service (TOS)</h1>
 
 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
 <p>Welcome to MediWyz. We provide a digital platform connecting users with licensed healthcare providers, diagnostic laboratories, and pharmacies.</p>
 <p>By using our website, mobile app, or any related services, you agree to abide by these Terms of Service and our Privacy Policy.</p>
 <p>If you do not agree with these terms, you must not use MediWyz.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">2. Nature of Services</h2>
 <p>MediWyz is not a medical provider. It facilitates connections between users and independent licensed healthcare professionals and service providers.</p>
 <p>MediWyz does not control, direct, or interfere with the professional judgment of providers.</p>
 <p>All medical advice, tests, prescriptions, and product recommendations are the sole responsibility of the healthcare professional or service provider.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">3. No Liability Clause</h2>
 <p>MediWyz disclaims all liability for:</p>
 <ul className="list-disc pl-6">
 <li>The accuracy or completeness of any consultation, medical advice, test result, or product recommendation.</li>
 <li>Any harm, injury, or damages arising from consultations, tests, prescriptions, medications, or services obtained through the platform.</li>
 </ul>
 <p>All healthcare professionals and service providers are required to maintain their own professional indemnity insurance.</p>
 <p>Products purchased via MediWyz Marketplace are sold and fulfilled by third-party vendors. MediWyz assumes no warranty or liability for product safety, quality, or efficacy.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">4. Eligibility and Use by Children</h2>
 <p>Users must be 18 years or older to register and use MediWyz independently.</p>
 <p>Minors may only use MediWyz under the supervision and consent of a parent or legal guardian, who assumes full responsibility for the minor’s use of the platform.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">5. Data Protection & Privacy (Mauritius DPA 2017)</h2>
 <p>MediWyz complies with the Mauritius Data Protection Act 2017.</p>
 <p>We collect and process personal and health information solely for providing services and as required by law.</p>
 <p>We implement appropriate technical and organizational measures to protect your data from unauthorized access or misuse.</p>
 <p>Users have the right to:</p>
 <ul className="list-disc pl-6">
 <li>Access, correct, and delete their personal data.</li>
 <li>Withdraw consent for processing (subject to legal/contractual restrictions).</li>
 </ul>
 <p>For more information, please refer to our full Privacy Policy (provided separately).</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">6. Appointment Scheduling, Rescheduling & Cancellations</h2>
 <p>Booking: Appointments are subject to provider availability.</p>
 <p>Cancellations/Rescheduling:</p>
 <ul className="list-disc pl-6">
 <li>Users can cancel or reschedule at least [e.g., 12 hours] before the scheduled time without penalty.</li>
 <li>Late cancellations or no-shows may incur a fee as stated at the time of booking.</li>
 </ul>
 <p>Provider Delays: MediWyz is not liable for delays caused by providers. If a provider fails to attend, you will be entitled to a rescheduled session or refund (as applicable).</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">7. Emergency Use Disclaimer</h2>
 <p>MediWyz is not for emergency medical care.</p>
 <p>In case of an emergency, you must call your local emergency services or go to the nearest hospital.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">8. Prohibited Uses</h2>
 <p>Users agree not to misuse the platform, including:</p>
 <ul className="list-disc pl-6">
 <li>Providing false information.</li>
 <li>Using the service for unlawful purposes.</li>
 <li>Attempting unauthorized access to the system or other users’ data.</li>
 </ul>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">9. Termination of Use</h2>
 <p>MediWyz may suspend or terminate access if you violate these terms or engage in abusive or unlawful conduct.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">10. Amendments</h2>
 <p>MediWyz may update these Terms from time to time. Users will be notified of significant changes.</p>
 </section>
 </div>
 )
}