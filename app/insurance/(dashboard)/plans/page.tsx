'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaShieldAlt } from 'react-icons/fa';

interface InsurancePlan {
 id: string;
 planName: string;
 planType: string;
 description: string;
 monthlyPremium: number;
 annualPremium: number | null;
 coverageAmount: number;
 deductible: number | null;
 coverageDetails: string[];
 eligibility: string | null;
}

type PlanFormData = Omit<InsurancePlan, 'id'>;

const PLAN_TYPES = ['Health', 'Dental', 'Vision', 'Life', 'Family', 'Other'];

const emptyForm: PlanFormData = {
 planName: '',
 planType: 'Health',
 description: '',
 monthlyPremium: 0,
 annualPremium: null,
 coverageAmount: 0,
 deductible: null,
 coverageDetails: [],
 eligibility: null,
};

const planTypeBadgeColor: Record<string, string> = {
 Health: 'bg-blue-100 text-blue-700',
 Dental: 'bg-teal-100 text-teal-700',
 Vision: 'bg-indigo-100 text-indigo-700',
 Life: 'bg-purple-100 text-purple-700',
 Family: 'bg-pink-100 text-pink-700',
 Other: 'bg-subtle text-soft',
};

export default function InsurancePlansPage() {
 const [plans, setPlans] = useState<InsurancePlan[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [searchTerm, setSearchTerm] = useState('');
 const [filterType, setFilterType] = useState('');
 const [modalOpen, setModalOpen] = useState(false);
 const [editingPlan, setEditingPlan] = useState<InsurancePlan | null>(null);
 const [formData, setFormData] = useState<PlanFormData>(emptyForm);
 const [coverageDetailsInput, setCoverageDetailsInput] = useState('');
 const [submitting, setSubmitting] = useState(false);

 const fetchPlans = useCallback(async () => {
 try {
 setLoading(true);
 setError(null);
 const res = await fetch('/api/insurance/plans');
 if (!res.ok) throw new Error('Failed to fetch plans');
 const json = await res.json();
 // Backend returns { success: true, data: [...] }
 const plansList = json.data ?? json.plans ?? [];
 setPlans(Array.isArray(plansList) ? plansList : []);
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred');
 } finally {
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 fetchPlans();
 }, [fetchPlans]);

 const openCreateModal = () => {
 setEditingPlan(null);
 setFormData(emptyForm);
 setCoverageDetailsInput('');
 setModalOpen(true);
 };

 const openEditModal = (plan: InsurancePlan) => {
 setEditingPlan(plan);
 setFormData({
 planName: plan.planName,
 planType: plan.planType,
 description: plan.description,
 monthlyPremium: plan.monthlyPremium,
 annualPremium: plan.annualPremium,
 coverageAmount: plan.coverageAmount,
 deductible: plan.deductible,
 coverageDetails: plan.coverageDetails,
 eligibility: plan.eligibility,
 });
 setCoverageDetailsInput(
 Array.isArray(plan.coverageDetails) ? plan.coverageDetails.join(', ') : ''
 );
 setModalOpen(true);
 };

 const closeModal = () => {
 setModalOpen(false);
 setEditingPlan(null);
 setFormData(emptyForm);
 setCoverageDetailsInput('');
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setSubmitting(true);

 const payload = {
 ...formData,
 coverageDetails: coverageDetailsInput
 .split(',')
 .map((s) => s.trim())
 .filter(Boolean),
 };

 try {
 if (editingPlan) {
 const res = await fetch(`/api/insurance/plans/${editingPlan.id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 credentials: 'include',
 });
 if (!res.ok) throw new Error('Failed to update plan');
 } else {
 const res = await fetch('/api/insurance/plans', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 credentials: 'include',
 });
 if (!res.ok) throw new Error('Failed to create plan');
 }
 closeModal();
 fetchPlans();
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred');
 } finally {
 setSubmitting(false);
 }
 };

 const handleDelete = async (id: string) => {
 if (!confirm('Are you sure you want to delete this plan?')) return;
 try {
 const res = await fetch(`/api/insurance/plans/${id}`, { method: 'DELETE', credentials: 'include' });
 if (!res.ok) throw new Error('Failed to delete plan');
 fetchPlans();
 } catch (err) {
 setError(err instanceof Error ? err.message : 'An error occurred');
 }
 };

 const filteredPlans = plans.filter((plan) => {
 const matchesSearch =
 plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 plan.planType.toLowerCase().includes(searchTerm.toLowerCase());
 const matchesType = filterType ? plan.planType === filterType : true;
 return matchesSearch && matchesType;
 });

 const formatCurrency = (amount: number | null | undefined) => {
 if (amount == null) return ' - ';
 return `MUR ${amount.toLocaleString()}`;
 };

 return (
 <div className="p-6 max-w-7xl mx-auto">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
 <div className="flex items-center gap-3 mb-4 sm:mb-0">
 <FaShieldAlt className="text-3xl text-blue-600" />
 <div>
 <h1 className="text-2xl font-bold text-fg">Insurance Plans</h1>
 <p className="text-sm text-soft">Manage your insurance plan offerings</p>
 </div>
 </div>
 <button
 onClick={openCreateModal}
 className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
 >
 <FaPlus className="text-sm" />
 Add Plan
 </button>
 </div>

 {/* Search and Filter */}
 <div className="flex flex-col sm:flex-row gap-3 mb-6">
 <div className="relative flex-1">
 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
 <input
 type="text"
 placeholder="Search by name or type..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
 />
 </div>
 <select
 value={filterType}
 onChange={(e) => setFilterType(e.target.value)}
 className="px-4 py-2.5 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-surface"
 >
 <option value="">All Types</option>
 {PLAN_TYPES.map((type) => (
 <option key={type} value={type}>
 {type}
 </option>
 ))}
 </select>
 </div>

 {/* Error */}
 {error && (
 <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
 <span>{error}</span>
 <button onClick={() => setError(null)}>
 <FaTimes className="text-red-500 hover:text-red-700" />
 </button>
 </div>
 )}

 {/* Loading */}
 {loading && (
 <div className="flex items-center justify-center py-20">
 <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
 </div>
 )}

 {/* Empty State */}
 {!loading && filteredPlans.length === 0 && (
 <div className="text-center py-20 bg-subtle rounded-xl border border-dashed border-line">
 <FaShieldAlt className="mx-auto text-4xl text-faint mb-4" />
 <h3 className="text-lg font-medium text-soft mb-1">No plans found</h3>
 <p className="text-sm text-faint">
 {searchTerm || filterType
 ? 'Try adjusting your search or filter.'
 : 'Get started by adding your first insurance plan.'}
 </p>
 </div>
 )}

 {/* Plans Table */}
 {!loading && filteredPlans.length > 0 && (
 <div className="bg-surface rounded-xl border border-line shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-subtle border-b border-line">
 <th className="text-left px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
 Plan Name
 </th>
 <th className="text-left px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
 Type
 </th>
 <th className="text-right px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
 Monthly Premium (MUR)
 </th>
 <th className="text-right px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
 Annual Premium
 </th>
 <th className="text-right px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
 Coverage Amount
 </th>
 <th className="text-center px-6 py-3.5 text-xs font-semibold text-soft uppercase tracking-wider">
 Actions
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-line">
 {filteredPlans.map((plan) => (
 <tr key={plan.id} className="hover:bg-subtle transition-colors">
 <td className="px-6 py-4">
 <div>
 <p className="font-medium text-fg">{plan.planName}</p>
 {plan.description && (
 <p className="text-xs text-soft mt-0.5 line-clamp-1 max-w-xs">
 {plan.description}
 </p>
 )}
 </div>
 </td>
 <td className="px-6 py-4">
 <span
 className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
 planTypeBadgeColor[plan.planType] || planTypeBadgeColor.Other
 }`}
 >
 {plan.planType}
 </span>
 </td>
 <td className="px-6 py-4 text-right font-medium text-fg">
 {formatCurrency(plan.monthlyPremium)}
 </td>
 <td className="px-6 py-4 text-right text-soft">
 {formatCurrency(plan.annualPremium)}
 </td>
 <td className="px-6 py-4 text-right text-soft">
 {formatCurrency(plan.coverageAmount)}
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-center gap-1">
 <button
 onClick={() => openEditModal(plan)}
 className="p-2 text-faint hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
 title="Edit"
 >
 <FaEdit />
 </button>
 <button
 onClick={() => handleDelete(plan.id)}
 className="p-2 text-faint hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
 title="Delete"
 >
 <FaTrash />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Modal */}
 {modalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div
 className="absolute inset-0 bg-black/50"
 role="button"
 tabIndex={0}
 aria-label="Close modal"
 onClick={closeModal}
 onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') closeModal() }}
 ></div>
 <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
 <div className="sticky top-0 bg-surface border-b border-line px-6 py-4 rounded-t-2xl flex items-center justify-between">
 <h2 className="text-lg font-semibold text-fg">
 {editingPlan ? 'Edit Plan' : 'Add New Plan'}
 </h2>
 <button
 onClick={closeModal}
 className="p-2 text-faint hover:text-soft hover:bg-subtle rounded-lg transition-colors"
 >
 <FaTimes />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Plan Name <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 required
 value={formData.planName}
 onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
 className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 placeholder="e.g., Premium Health Plan"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Plan Type <span className="text-red-500">*</span>
 </label>
 <select
 required
 value={formData.planType}
 onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
 className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-surface"
 >
 {PLAN_TYPES.map((type) => (
 <option key={type} value={type}>
 {type}
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">Description</label>
 <textarea
 rows={3}
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
 placeholder="Describe the plan coverage..."
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Monthly Premium (MUR) <span className="text-red-500">*</span>
 </label>
 <input
 type="number"
 required
 min="0"
 step="any"
 value={formData.monthlyPremium}
 onChange={(e) =>
 setFormData({ ...formData, monthlyPremium: Number(e.target.value) })
 }
 className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 placeholder="0"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Annual Premium (MUR)
 </label>
 <input
 type="number"
 min="0"
 step="any"
 value={formData.annualPremium ?? ''}
 onChange={(e) =>
 setFormData({
 ...formData,
 annualPremium: e.target.value ? Number(e.target.value) : null,
 })
 }
 className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 placeholder="Optional"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Coverage Amount (MUR) <span className="text-red-500">*</span>
 </label>
 <input
 type="number"
 required
 min="0"
 step="any"
 value={formData.coverageAmount}
 onChange={(e) =>
 setFormData({ ...formData, coverageAmount: Number(e.target.value) })
 }
 className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 placeholder="0"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Deductible (MUR)
 </label>
 <input
 type="number"
 min="0"
 step="any"
 value={formData.deductible ?? ''}
 onChange={(e) =>
 setFormData({
 ...formData,
 deductible: e.target.value ? Number(e.target.value) : null,
 })
 }
 className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 placeholder="Optional"
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">
 Coverage Details
 </label>
 <input
 type="text"
 value={coverageDetailsInput}
 onChange={(e) => setCoverageDetailsInput(e.target.value)}
 className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 placeholder="e.g., Hospitalization, Surgery, Medication (comma-separated)"
 />
 <p className="mt-1 text-xs text-faint">Separate multiple items with commas</p>
 </div>

 <div>
 <label className="block text-sm font-medium text-soft mb-1">Eligibility</label>
 <input
 type="text"
 value={formData.eligibility ?? ''}
 onChange={(e) =>
 setFormData({
 ...formData,
 eligibility: e.target.value || null,
 })
 }
 className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
 placeholder="e.g., Ages 18-65, Mauritius residents"
 />
 </div>

 <div className="flex justify-end gap-3 pt-4 border-t border-line">
 <button
 type="button"
 onClick={closeModal}
 className="px-4 py-2 text-sm font-medium text-soft bg-surface border border-line rounded-lg hover:bg-subtle transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {submitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
