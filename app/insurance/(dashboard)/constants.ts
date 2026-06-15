// UI display constants for insurance dashboard components.
// These are intentionally static - they represent display options and status labels,
// not data entities. Policy/claim data is fetched from API endpoints.

import { InsuranceDashboardData } from './types'

export const emptyInsuranceData: InsuranceDashboardData = {
  name: '',
  location: '',
  companyName: '',
  avatar: '',
  stats: {
    activePolicies: 0,
    pendingClaims: 0,
    monthlyCommission: 0,
    policyHolders: 0,
    expiringPolicies: 0,
    claimApprovalRate: 0,
  },
  recentClaims: [],
  policyHolders: [],
  earnings: {
    totalCommission: 0,
    platformFee: 0,
    netPayout: 0,
  },
}

export const policyTypes = [
  'Health Insurance',
  'Motor Insurance',
  'Life Insurance',
  'Property Insurance',
  'Travel Insurance',
  'Business Insurance',
  'Marine Insurance',
]

export const claimStatuses = [
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
]

export const policyStatuses = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-yellow-100 text-yellow-800' },
]