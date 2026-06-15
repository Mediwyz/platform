import {
  FaUser,
  FaUserMd,
  FaUserNurse,
  FaPills,
  FaFlask,
  FaAmbulance,
  FaShieldAlt,
  FaBaby,
  FaCheck,
  FaFileAlt,
  FaGlobe,
  FaHandshake,
} from 'react-icons/fa'
import { UserType, Document } from './types'

export const userTypes: UserType[] = [
  {
    id: 'patient',
    label: 'Patient',
    icon: FaUser,
    description: 'Book appointments & manage health',
    color: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  {
    id: 'doctor',
    label: 'Doctor',
    icon: FaUserMd,
    description: 'Medical Doctor / Physician',
    color: 'bg-green-100 text-green-700 border-green-300'
  },
  {
    id: 'nurse',
    label: 'Nurse',
    icon: FaUserNurse,
    description: 'Registered Nurse / Midwife',
    color: 'bg-purple-100 text-purple-700 border-purple-300'
  },
  {
    id: 'nanny',
    label: 'Nanny',
    icon: FaBaby,
    description: 'Child Care Worker',
    color: 'bg-pink-100 text-pink-700 border-pink-300'
  },
  {
    id: 'pharmacist',
    label: 'Pharmacist',
    icon: FaPills,
    description: 'PharmD / Licensed Pharmacist',
    color: 'bg-orange-100 text-orange-700 border-orange-300'
  },
  {
    id: 'lab',
    label: 'Lab Technician',
    icon: FaFlask,
    description: 'Laboratory Director / Biologist',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-300'
  },
  {
    id: 'emergency',
    label: 'Emergency Worker',
    icon: FaAmbulance,
    description: 'Paramedic / EMT',
    color: 'bg-red-100 text-red-700 border-red-300'
  },
  {
    id: 'insurance',
    label: 'Insurance Rep',
    icon: FaShieldAlt,
    description: 'Health Insurance Representative',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300'
  },
  // Corporate Admin removed from signup - any user can create a company page from their dashboard
  {
    id: 'referral-partner',
    label: 'Referral Partner',
    icon: FaHandshake,
    description: 'Earn by bringing new users to platform',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300'
  },
  {
    id: 'regional-admin',
    label: 'Regional Administrator',
    icon: FaGlobe,
    description: 'Country/region-level platform management',
    color: 'bg-amber-100 text-amber-700 border-amber-300'
  },
  {
    id: 'caregiver',
    label: 'Caregiver',
    icon: FaUser,
    description: 'Elder care, disability care, home aide',
    color: 'bg-teal-100 text-teal-700 border-teal-300'
  },
  {
    id: 'physiotherapist',
    label: 'Physiotherapist',
    icon: FaUser,
    description: 'Rehabilitation & physical therapy',
    color: 'bg-lime-100 text-lime-700 border-lime-300'
  },
  {
    id: 'dentist',
    label: 'Dentist',
    icon: FaUser,
    description: 'Dental care & oral health',
    color: 'bg-sky-100 text-sky-700 border-sky-300'
  },
  {
    id: 'optometrist',
    label: 'Optometrist',
    icon: FaUser,
    description: 'Eye care & vision testing',
    color: 'bg-violet-100 text-violet-700 border-violet-300'
  },
  {
    id: 'nutritionist',
    label: 'Nutritionist',
    icon: FaUser,
    description: 'Diet planning & nutrition counseling',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300'
  }
]

export const documentRequirements: Record<string, Document[]> = {
  patient: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'insurance-card', name: 'Health Insurance Card', required: false, description: 'If insured', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'proof-address', name: 'Proof of Address', required: true, description: 'Utility bill or rental contract', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'medical-history', name: 'Medical History Document', required: false, description: 'Vaccination card or chronic illness file', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  doctor: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'medical-degree', name: 'Medical Degree', required: true, description: 'MBBS, MD, or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'medical-license', name: 'Professional License', required: true, description: 'License to Practice Medicine', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'registration-cert', name: 'Registration Certificate', required: true, description: 'Order of Physicians or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'work-certificate', name: 'Work Certificate', required: false, description: 'Proof of Employment (if applicable)', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  nurse: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'nursing-degree', name: 'Nursing Degree/Diploma', required: true, description: 'Nursing qualification certificate', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'nursing-license', name: 'Professional License', required: true, description: 'License to Practice Nursing', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'registration-cert', name: 'Registration Certificate', required: true, description: 'Order of Nurses or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'work-certificate', name: 'Work Certificate', required: true, description: 'Hospital Affiliation Proof', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  nanny: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'police-clearance', name: 'Police Clearance Certificate', required: true, description: 'Background check certificate', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'childcare-cert', name: 'Childcare Training Certificate', required: false, description: 'First Aid & Childcare Training', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'employment-refs', name: 'Employment References', required: false, description: 'Previous work references', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  pharmacist: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'pharmacy-degree', name: 'Pharmacy Degree', required: true, description: 'Doctor of Pharmacy or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'pharmacy-license', name: 'Professional License', required: true, description: 'License to Practice Pharmacy', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'registration-cert', name: 'Registration Certificate', required: true, description: 'Order of Pharmacists or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'pharmacy-affiliation', name: 'Pharmacy Affiliation Proof', required: true, description: 'Ownership certificate or work contract', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  lab: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'lab-degree', name: 'Laboratory Science Degree', required: true, description: 'Biology, Biochemistry, Medical Lab Science', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'lab-license', name: 'Professional License', required: true, description: 'Accreditation from health authority', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'lab-accreditation', name: 'Laboratory Accreditation', required: true, description: 'ISO, Ministry of Health approval', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'employment-proof', name: 'Proof of Employment', required: true, description: 'Employment in the laboratory', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  emergency: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'emt-cert', name: 'EMT/Paramedic Certification', required: true, description: 'Emergency Medical Technician certificate', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'professional-license', name: 'Professional License', required: false, description: 'Registration Certificate (if required)', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'first-aid-cert', name: 'First Aid/ALS Certification', required: true, description: 'Advanced Life Support Certification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'employment-proof', name: 'Proof of Employment', required: true, description: 'Employment with ambulance/emergency service', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  insurance: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'employment-proof', name: 'Proof of Employment', required: true, description: 'HR letter, contract, or badge', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'company-registration', name: 'Company Registration Certificate', required: true, description: 'Insurance company registration', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'regulatory-auth', name: 'Regulatory Authorization', required: false, description: 'Authorization from Insurance Regulator', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'professional-accred', name: 'Professional Accreditation', required: false, description: 'Professional certification (if applicable)', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  // NEW DOCUMENT REQUIREMENTS
  corporate: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'company-registration', name: 'Company Registration Certificate', required: true, description: 'Official company registration document', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'business-permit', name: 'Business Operating License', required: true, description: 'License to operate business', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'employment-verification', name: 'Employment Verification Letter', required: true, description: 'HR letter confirming your position and authority', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'authorization-letter', name: 'Company Authorization Letter', required: true, description: 'Letter authorizing you to represent the company', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'corporate-profile', name: 'Corporate Profile/Brochure', required: false, description: 'Company overview and employee count', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  'referral-partner': [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'proof-address', name: 'Proof of Address', required: true, description: 'Utility bill or rental contract', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'business-registration', name: 'Business Registration (if applicable)', required: false, description: 'Business registration certificate', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'marketing-portfolio', name: 'Marketing Portfolio/Experience', required: false, description: 'Previous marketing work or social media analytics', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'bank-details', name: 'Bank Account Details', required: true, description: 'Bank statement or account verification for commission payments', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'tax-certificate', name: 'Tax Registration Certificate', required: false, description: 'Tax registration for income reporting', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  'regional-admin': [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'business-plan', name: 'Business Plan Document', required: true, description: 'Detailed business plan for regional operations', accepted: '.pdf', uploaded: false },
    { id: 'financial-statements', name: 'Financial Statements', required: true, description: 'Recent financial statements or capability proof', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'experience-credentials', name: 'Healthcare/Business Experience', required: true, description: 'CV and credentials in healthcare or business management', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'regional-research', name: 'Market Research Report', required: true, description: 'Market analysis for target region/country', accepted: '.pdf', uploaded: false },
    { id: 'legal-clearance', name: 'Legal Clearance Certificate', required: true, description: 'Police clearance and legal background check', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'reference-letters', name: 'Professional Reference Letters', required: true, description: 'At least 2 professional references', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false }
  ],
  caregiver: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'police-clearance', name: 'Police Clearance Certificate', required: true, description: 'Background check', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'first-aid-cert', name: 'First Aid Certification', required: true, description: 'First aid training certificate', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'caregiver-training', name: 'Caregiver Training Certificate', required: false, description: 'Caregiving skills certificate', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
  ],
  physiotherapist: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'physio-degree', name: 'Physiotherapy Degree', required: true, description: 'BSc/MSc Physiotherapy', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'physio-license', name: 'Professional License', required: true, description: 'License to practice physiotherapy', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'registration-cert', name: 'Registration Certificate', required: true, description: 'Professional body registration', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
  ],
  dentist: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'dental-degree', name: 'Dental Degree (BDS/DDS)', required: true, description: 'Bachelor of Dental Surgery or equivalent', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'dental-license', name: 'Dental License', required: true, description: 'License to practice dentistry', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'dental-registration', name: 'Dental Council Registration', required: true, description: 'Registration with dental regulatory body', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
  ],
  optometrist: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'optometry-degree', name: 'Optometry Degree', required: true, description: 'BSc/OD in Optometry', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'optometry-license', name: 'Professional License', required: true, description: 'License to practice optometry', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
  ],
  nutritionist: [
    { id: 'national-id', name: 'National ID/Passport', required: true, description: 'Valid government-issued identification', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'nutrition-cert', name: 'Nutrition Certification', required: true, description: 'Certified dietitian or nutritionist credential', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
    { id: 'nutrition-degree', name: 'Nutrition/Dietetics Degree', required: false, description: 'BSc in Nutrition, Food Science, or Dietetics', accepted: '.pdf,.jpg,.jpeg,.png', uploaded: false },
  ],
}

export const steps = [
  { number: 1, title: 'Account Type', icon: FaUser },
  { number: 2, title: 'Basic Info', icon: FaFileAlt },
  { number: 3, title: 'Create Account', icon: FaCheck }
]