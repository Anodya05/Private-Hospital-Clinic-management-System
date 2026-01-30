import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Hospital, User, Calendar, AlertTriangle, FileText, Clock } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import http from '../../api/http';
import type { Clinic, CreateClinicReferralPayload } from '../../types/doctor';
import toast from 'react-hot-toast';

interface ClinicReferralFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateClinicReferralPayload) => void;
  saving: boolean;
  initialPatientId?: number | null;
}

const ClinicReferralForm: React.FC<ClinicReferralFormProps> = ({
  open,
  onClose,
  onSubmit,
  saving,
  initialPatientId,
}) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: initialPatientId || 0,
    clinic_id: 0,
    reason: '',
    clinical_summary: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    preferred_appointment_date: '',
  });

  useEffect(() => {
    if (open) {
      loadClinics();
    }
  }, [open]);

  useEffect(() => {
    if (initialPatientId) {
      setFormData(prev => ({ ...prev, patient_id: initialPatientId }));
    }
  }, [initialPatientId]);

  const loadClinics = async () => {
    setClinicsLoading(true);
    try {
      const response = await http.get(API_ENDPOINTS.CLINICS);
      setClinics((response.data as any).data || []);
    } catch (error: any) {
      console.error('Failed to load clinics:', error);
      toast.error('Failed to load clinics');
    } finally {
      setClinicsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.clinic_id || !formData.reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSubmit({
      patient_id: formData.patient_id,
      clinic_id: formData.clinic_id,
      reason: formData.reason.trim(),
      clinical_summary: formData.clinical_summary.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      priority: formData.priority,
      preferred_appointment_date: formData.preferred_appointment_date || undefined,
    });
  };

  const handleClose = () => {
    if (saving) return;
    setFormData({
      patient_id: 0,
      clinic_id: 0,
      reason: '',
      clinical_summary: '',
      notes: '',
      priority: 'medium',
      preferred_appointment_date: '',
    });
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'urgent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Hospital className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-900">Refer Patient to Clinic</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Patient ID *
            </label>
            <input
              type="number"
              value={formData.patient_id || ''}
              onChange={(e) => setFormData({ ...formData, patient_id: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
              disabled={!!initialPatientId}
            />
          </div>

          {/* Clinic Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hospital className="w-4 h-4 inline mr-1" />
              Select Clinic *
            </label>
            {clinicsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
                <span className="ml-2 text-gray-600">Loading clinics...</span>
              </div>
            ) : (
              <select
                value={formData.clinic_id}
                onChange={(e) => setFormData({ ...formData, clinic_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              >
                <option value="">Choose a clinic...</option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name} {clinic.location && `- ${clinic.location}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Priority Level *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority })}
                  className={`p-2 rounded-lg text-center text-sm font-medium transition ${
                    formData.priority === priority
                      ? getPriorityColor(priority) + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Reason for Referral */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Reason for Referral *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={3}
              placeholder="Describe the reason for referring this patient to the selected clinic..."
              required
            />
          </div>

          {/* Clinical Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Clinical Summary
            </label>
            <textarea
              value={formData.clinical_summary}
              onChange={(e) => setFormData({ ...formData, clinical_summary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={4}
              placeholder="Provide a detailed clinical summary including symptoms, examination findings, and relevant history..."
            />
          </div>

          {/* Preferred Appointment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Preferred Appointment Date
            </label>
            <input
              type="datetime-local"
              value={formData.preferred_appointment_date}
              onChange={(e) => setFormData({ ...formData, preferred_appointment_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={3}
              placeholder="Any additional notes or special instructions for the receiving clinic..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.patient_id || !formData.clinic_id || !formData.reason.trim()}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Hospital className="w-4 h-4" />
                  <span>Submit Referral</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ClinicReferralForm;