import { Metadata } from 'next'

export const metadata: Metadata = {
 title: 'Medical Disclaimer - MediWyz',
 description: 'MediWyz Medical Disclaimer',
}

export default function DisclaimerPage() {
 return (
 <div className="container mx-auto px-4 py-12">
 <h1 className="text-4xl font-bold mb-8">MediWyz Disclaimer</h1>
 
 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">Medical Disclaimer:</h2>
 <p>MediWyz is a technology platform that connects users with licensed healthcare professionals, diagnostic service providers, and pharmacies. MediWyz itself does not provide medical care, diagnoses, prescriptions, or treatment. All medical advice, consultations, tests, and prescriptions are the sole responsibility of the independent licensed healthcare professionals and service providers engaged by you through our platform.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">No Provider-Patient Relationship with MediWyz:</h2>
 <p>Any consultation or advice you receive via MediWyz is delivered by independent, licensed practitioners. MediWyz does not control or interfere with their professional judgment. Your healthcare provider is solely responsible for the medical advice, quality of care, and services they provide.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">Tests, Medications, and Third-Party Services:</h2>
 <p>Diagnostic tests, lab results, and medication dispensing are provided by independent laboratories and licensed pharmacies. MediWyz does not warrant the accuracy, completeness, or safety of any diagnostic tests or medications. Any issues or disputes related to these services should be addressed directly with the relevant service provider.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">No Emergency or Substitute for In-Person Care:</h2>
 <p>MediWyz is not designed for emergency medical situations. If you are experiencing a medical emergency, please contact your local emergency number or go to the nearest hospital. MediWyz should not be used as a substitute for in-person examination and treatment when required.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">Limitation of Liability:</h2>
 <p>To the fullest extent permitted by law, MediWyz is not liable for any injury, loss, or damages resulting from consultations, tests, prescriptions, medication errors, or any services provided by independent healthcare professionals or third-party providers. Users agree that MediWyz’s role is limited to facilitating communication and logistics between users and providers.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">Data Privacy:</h2>
 <p>MediWyz complies with applicable data protection laws and takes reasonable measures to safeguard personal health information. Please refer to our Privacy Policy for details.</p>
 </section>

 <section className="mb-6">
 <h2 className="text-2xl font-semibold mb-4">Consent:</h2>
 <p>By using MediWyz, you acknowledge and agree to this disclaimer and the applicable Terms of Service.</p>
 </section>
 </div>
 )
}