import { FaTimes, FaExclamationTriangle, FaShieldAlt, FaFileAlt } from 'react-icons/fa'

interface ModalProps {
 isOpen: boolean;
 onClose: () => void;
 onAccept?: () => void;
 children: React.ReactNode;
 title: string;
 icon: React.ComponentType<{ className?: string }>;
 showAcceptButton?: boolean;
}

function Modal({ isOpen, onClose, onAccept, children, title, icon: Icon, showAcceptButton = false }: ModalProps) {
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
 <div className="bg-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
 <div className="flex items-center justify-between p-6 border-b border-line bg-subtle">
 <div className="flex items-center gap-3">
 <Icon className="text-blue-600 text-xl" />
 <h2 className="text-xl font-bold text-fg">{title}</h2>
 </div>
 <button
 onClick={onClose}
 className="text-faint hover:text-soft p-2 rounded-full hover:bg-line"
 >
 <FaTimes />
 </button>
 </div>
 <div className="p-6 overflow-y-auto max-h-[70vh]">
 {children}
 </div>
 <div className="p-4 border-t border-line bg-subtle flex justify-end gap-3">
 {showAcceptButton && onAccept && (
 <button
 onClick={onAccept}
 className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
 >
 Accept
 </button>
 )}
 <button
 onClick={onClose}
 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 );
}

interface LegalModalsProps {
 disclaimerOpen: boolean;
 termsOpen: boolean;
 privacyOpen: boolean;
 onCloseDisclaimer: () => void;
 onCloseTerms: () => void;
 onClosePrivacy: () => void;
 onAcceptDisclaimer?: () => void;
 onAcceptTerms?: () => void;
 onAcceptPrivacy?: () => void;
}

export default function LegalModals({
 disclaimerOpen,
 termsOpen,
 privacyOpen,
 onCloseDisclaimer,
 onCloseTerms,
 onClosePrivacy,
 onAcceptDisclaimer,
 onAcceptTerms,
 onAcceptPrivacy
}: LegalModalsProps) {
 return (
 <>
 {/* Disclaimer Modal */}
 <Modal
 isOpen={disclaimerOpen}
 onClose={onCloseDisclaimer}
 onAccept={onAcceptDisclaimer}
 title="MediWyz Medical Disclaimer"
 icon={FaExclamationTriangle}
 showAcceptButton={!!onAcceptDisclaimer}
 >
 <div className="space-y-6 text-soft">
 <div className="bg-red-50 border border-red-200 rounded-lg p-4">
 <h3 className="font-bold text-red-800 mb-3">Medical Disclaimer</h3>
 <p className="text-red-700">
 MediWyz is a technology platform that connects users with licensed healthcare professionals, diagnostic service providers, and pharmacies. <strong>MediWyz itself does not provide medical care, diagnoses, prescriptions, or treatment.</strong> All medical advice, consultations, tests, and prescriptions are the sole responsibility of the independent licensed healthcare professionals and service providers engaged by you through our platform.
 </p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">No Provider-Patient Relationship with MediWyz</h3>
 <p>
 Any consultation or advice you receive via MediWyz is delivered by independent, licensed practitioners. <strong>MediWyz does not control or interfere with their professional judgment.</strong> Your healthcare provider is solely responsible for the medical advice, quality of care, and services they provide.
 </p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">Tests, Medications, and Third-Party Services</h3>
 <p>
 Diagnostic tests, lab results, and medication dispensing are provided by independent laboratories and licensed pharmacies. <strong>MediWyz does not warrant the accuracy, completeness, or safety of any diagnostic tests or medications.</strong> Any issues or disputes related to these services should be addressed directly with the relevant service provider.
 </p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">No Emergency or Substitute for In-Person Care</h3>
 <p>
 MediWyz is not designed for emergency medical situations. If you are experiencing a medical emergency, please contact your local emergency number or go to the nearest hospital. MediWyz should not be used as a substitute for in-person examination and treatment when required.
 </p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">Limitation of Liability</h3>
 <p>
 To the fullest extent permitted by law, <strong>MediWyz is not liable for any injury, loss, or damages resulting from consultations, tests, prescriptions, medication errors, or any services provided by independent healthcare professionals or third-party providers.</strong> Users agree that MediWyz role is limited to facilitating communication and logistics between users and providers.
 </p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">Data Privacy</h3>
 <p>
 MediWyz complies with applicable data protection laws and takes reasonable measures to safeguard personal health information. Please refer to our Privacy Policy for details.
 </p>
 </div>

 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
 <h3 className="font-bold text-yellow-800 mb-3">Consent</h3>
 <p className="text-yellow-700">
 By using MediWyz, you acknowledge and agree to this disclaimer and the applicable Terms of Service.
 </p>
 </div>
 </div>
 </Modal>

 {/* Terms of Service Modal */}
 <Modal
 isOpen={termsOpen}
 onClose={onCloseTerms}
 onAccept={onAcceptTerms}
 title="MediWyz Terms of Service"
 icon={FaFileAlt}
 showAcceptButton={!!onAcceptTerms}
 >
 <div className="space-y-6 text-soft">
 <div>
 <h3 className="font-bold text-fg mb-3">1. Introduction</h3>
 <p>
 Welcome to <strong>MediWyz</strong>. We provide a digital platform connecting users with licensed healthcare providers, diagnostic laboratories, and pharmacies. By using our website, mobile app, or any related services, you agree to abide by these Terms of Service and our Privacy Policy.
 </p>
 <p className="mt-2 font-medium text-red-600">
 If you do not agree with these terms, you must not use MediWyz.
 </p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">2. Nature of Services</h3>
 <ul className="space-y-2 list-disc pl-6">
 <li>MediWyz is <strong>not a medical provider</strong>. It facilitates connections between users and independent licensed healthcare professionals and service providers.</li>
 <li>MediWyz does <strong>not control, direct, or interfere</strong> with the professional judgment of providers.</li>
 <li>All medical advice, tests, prescriptions, and product recommendations are the sole responsibility of the healthcare professional or service provider.</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">3. No Liability Clause</h3>
 <p className="mb-2">MediWyz <strong>disclaims all liability</strong> for:</p>
 <ul className="space-y-2 list-disc pl-6">
 <li>The accuracy or completeness of any consultation, medical advice, test result, or product recommendation.</li>
 <li>Any harm, injury, or damages arising from consultations, tests, prescriptions, medications, or services obtained through the platform.</li>
 </ul>
 <p className="mt-3">
 All healthcare professionals and service providers are required to maintain their own professional indemnity insurance.
 </p>
 <p className="mt-2">
 Products purchased via MediWyz Marketplace are sold and fulfilled by third-party vendors. MediWyz assumes <strong>no warranty or liability</strong> for product safety, quality, or efficacy.
 </p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">4. Eligibility and Use by Children</h3>
 <ul className="space-y-2 list-disc pl-6">
 <li>Users must be <strong>18 years or older</strong> to register and use MediWyz independently.</li>
 <li>Minors may only use MediWyz under the <strong>supervision and consent of a parent or legal guardian</strong>, who assumes full responsibility for the minor use of the platform.</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">5. Data Protection & Privacy (Mauritius DPA 2017)</h3>
 <ul className="space-y-2 list-disc pl-6">
 <li>MediWyz complies with the <strong>Mauritius Data Protection Act 2017</strong>.</li>
 <li>We collect and process personal and health information solely for providing services and as required by law.</li>
 <li>We implement appropriate <strong>technical and organizational measures</strong> to protect your data from unauthorized access or misuse.</li>
 </ul>
 <p className="mt-3">Users have the right to:</p>
 <ul className="space-y-1 list-disc pl-6 mt-2">
 <li>Access, correct, and delete their personal data.</li>
 <li>Withdraw consent for processing (subject to legal/contractual restrictions).</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">6. Emergency Use Disclaimer</h3>
 <ul className="space-y-2 list-disc pl-6">
 <li>MediWyz is <strong>not for emergency medical care</strong>.</li>
 <li>In case of an emergency, you must call your local emergency services or go to the nearest hospital.</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">7. Prohibited Uses</h3>
 <p>Users agree <strong>not to misuse</strong> the platform, including:</p>
 <ul className="space-y-1 list-disc pl-6 mt-2">
 <li>Providing false information.</li>
 <li>Using the service for unlawful purposes.</li>
 <li>Attempting unauthorized access to the system or other users data.</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">8. Termination of Use</h3>
 <p>MediWyz may suspend or terminate access if you violate these terms or engage in abusive or unlawful conduct.</p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">9. Amendments</h3>
 <p>MediWyz may update these Terms from time to time. Users will be notified of significant changes.</p>
 </div>
 </div>
 </Modal>

 {/* Privacy Policy Modal */}
 <Modal
 isOpen={privacyOpen}
 onClose={onClosePrivacy}
 onAccept={onAcceptPrivacy}
 title="MediWyz Privacy Policy"
 icon={FaShieldAlt}
 showAcceptButton={!!onAcceptPrivacy}
 >
 <div className="space-y-6 text-soft">
 <div>
 <h3 className="font-bold text-fg mb-3">1. Introduction</h3>
 <p>
 MediWyz is committed to safeguarding your privacy and protecting your personal data. This Privacy Policy explains how we collect, use, store, and share your information in compliance with the Mauritius Data Protection Act 2017 and any other applicable healthcare data regulations.
 </p>
 <p className="mt-2 font-medium">
 By using our platform, you consent to the practices described in this policy.
 </p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">2. What Data We Collect</h3>
 <p>We may collect the following types of data:</p>
 <ul className="space-y-2 list-disc pl-6 mt-2">
 <li><strong>Personal Identification Data:</strong> Name, contact information (phone number, email), date of birth, address.</li>
 <li><strong>Health and Medical Information:</strong> Symptoms, health history, prescriptions, test results, and other health-related information shared with your provider.</li>
 <li><strong>Payment Data:</strong> Billing address, payment method, transaction history (processed securely by third-party payment providers).</li>
 <li><strong>Technical Data:</strong> Device information, IP address, browser type, cookies, and usage analytics to improve platform functionality.</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">3. How We Use Your Data</h3>
 <p>We process your personal and health data for the following purposes:</p>
 <ul className="space-y-1 list-disc pl-6 mt-2">
 <li>To connect you with licensed healthcare providers and facilitate consultations.</li>
 <li>To arrange lab tests, home visits, and medication delivery services.</li>
 <li>To process payments and manage your account.</li>
 <li>To improve and personalize your experience on the platform.</li>
 <li>To comply with legal obligations under Mauritius law, including medical record-keeping and reporting requirements.</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">4. Legal Basis for Processing (Mauritius DPA 2017)</h3>
 <p>MediWyz processes your data only when:</p>
 <ul className="space-y-1 list-disc pl-6 mt-2">
 <li>You have given explicit consent (especially for health-related data).</li>
 <li>It is necessary to perform the services you requested.</li>
 <li>It is required to comply with applicable laws and healthcare regulations.</li>
 <li>It is required to protect your vital interests (e.g., in case of a medical emergency).</li>
 </ul>
 <p className="mt-2 font-medium">You have the right to withdraw consent at any time.</p>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">5. Data Sharing and Third Parties</h3>
 <ul className="space-y-2 list-disc pl-6">
 <li>Your information may be shared with licensed healthcare professionals, diagnostic labs, and pharmacies to fulfill the services you request.</li>
 <li>We may share limited, anonymized analytics with technology providers for improving platform performance.</li>
 <li><strong>We do not sell or rent your personal or health data to any third parties.</strong></li>
 <li>All partners are bound by legal agreements requiring them to maintain confidentiality and comply with Mauritian healthcare and data protection regulations.</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">6. Data Storage and Security</h3>
 <ul className="space-y-1 list-disc pl-6">
 <li>All personal and health data are stored securely using encryption and access controls.</li>
 <li>Only authorized staff and providers have access to your data on a need-to-know basis.</li>
 <li>We implement organizational, technical, and administrative measures to prevent unauthorized access, misuse, or loss of data.</li>
 <li>Data is stored in compliance with Mauritius DPA 2017 and healthcare data retention laws.</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">7. Your Rights Under Mauritius DPA 2017</h3>
 <p>You have the right to:</p>
 <ul className="space-y-1 list-disc pl-6 mt-2">
 <li>Access and obtain a copy of your personal data.</li>
 <li>Request corrections of inaccurate or incomplete data.</li>
 <li>Request deletion of your personal data (subject to legal/medical retention requirements).</li>
 <li>Withdraw consent for data processing.</li>
 <li>Lodge a complaint with the Mauritius Data Protection Office if you believe your rights are violated.</li>
 </ul>
 </div>

 <div>
 <h3 className="font-bold text-fg mb-3">8. Contact Us</h3>
 <p>If you have any questions about this Privacy Policy or want to exercise your rights, contact us at:</p>
 <div className="mt-2 bg-subtle p-4 rounded-lg">
 <p><strong>Email:</strong> privacy@mediwyz.com</p>
 <p><strong>Address:</strong> MediWyz Office, Mauritius</p>
 <p><strong>Phone:</strong> +230 400 4000</p>
 </div>
 </div>
 </div>
 </Modal>
 </>
 )
}