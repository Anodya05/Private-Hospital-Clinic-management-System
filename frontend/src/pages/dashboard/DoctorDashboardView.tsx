import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Share2,
  Users,
  Video,
  X,
} from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import { doctorApi } from '../../api/doctor';
import { AppointmentTable } from '../../components/doctor/AppointmentTable';
import { DiagnosisForm } from '../../components/doctor/DiagnosisForm';
import { EhrViewer } from '../../components/doctor/EhrViewer';
import { PrescriptionForm } from '../../components/doctor/PrescriptionForm';
import type {
  CreateDiagnosisPayload,
  CreateLabOrderPayload,
  CreatePrescriptionPayload,
  CreateReferralPayload,
  Diagnosis,
  DoctorAppointment,
  DoctorInventoryItem,
  DoctorPrescription,
  LabOrdersAndResultsResponse,
  LabResult,
  PatientEhrData,
  Referral,
  UpdateDiagnosisPayload,
  CreatePatientPayload,
} from '../../types/doctor';
import type { AuthUser } from '../../types/auth';

type SectionKey = 'overview' | 'queue' | 'consultation' | 'ehr' | 'prescriptions' | 'labs' | 'referrals';

const safeParseJson = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const DoctorDashboardView: React.FC = () => {
  const navigate = useNavigate();

  const authUser = useMemo(() => safeParseJson(localStorage.getItem('authUser')) as AuthUser | null, []);
  const doctorName = authUser?.name || 'Doctor';

  const [active, setActive] = useState<SectionKey>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialAppointmentFilters = useMemo(
    () => ({
      date: new Date().toISOString().slice(0, 10),
      status: '',
      patient_name: '',
    }),
    []
  );

  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [appointmentFilters, setAppointmentFilters] = useState(initialAppointmentFilters);

  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const [consultNotes, setConsultNotes] = useState('');
  const [consultationStarting, setConsultationStarting] = useState(false);
  const [consultationEnding, setConsultationEnding] = useState(false);
  const [teleconsultationMeetingUrl, setTeleconsultationMeetingUrl] = useState<string | null>(null);
  const [teleconsultationId, setTeleconsultationId] = useState<number | null>(null);

  const [patientDiagnosesLoading, setPatientDiagnosesLoading] = useState(false);
  const [patientDiagnoses, setPatientDiagnoses] = useState<Diagnosis[]>([]);

  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [diagnosisSaving, setDiagnosisSaving] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState<Diagnosis | null>(null);

  const [ehrPatientId, setEhrPatientId] = useState('');
  const [ehrLoading, setEhrLoading] = useState(false);
  const [ehrData, setEhrData] = useState<PatientEhrData | null>(null);
  const [ehrTab, setEhrTab] = useState<'diagnosis' | 'lab_report'>('diagnosis');

  const [prescriptionsLoaded, setPrescriptionsLoaded] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<DoctorPrescription | null>(null);
  const [prescriptionDetailsLoading, setPrescriptionDetailsLoading] = useState(false);

  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptionSaving, setPrescriptionSaving] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<DoctorPrescription | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventory, setInventory] = useState<DoctorInventoryItem[]>([]);
  const [clinics, setClinics] = useState<{ id: number; name: string }[]>([]);
  const [clinicsLoading, setClinicsLoading] = useState(false);

  const [labsPatientId, setLabsPatientId] = useState('');
  const [labsLoading, setLabsLoading] = useState(false);
  const [labData, setLabData] = useState<LabOrdersAndResultsResponse | null>(null);
  const [labOrderModalOpen, setLabOrderModalOpen] = useState(false);
  const [labOrderSaving, setLabOrderSaving] = useState(false);
  const [labOrderForm, setLabOrderForm] = useState({
    patient_id: '',
    appointment_id: '',
    clinic_id: '',
    test_type: '',
    test_description: '',
    order_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    notes: '',
    instructions: '',
  });

  const initialReferralFilters = useMemo(() => ({ status: '', patient_id: '' }), []);

  const [referralsLoaded, setReferralsLoaded] = useState(false);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [referralSaving, setReferralSaving] = useState(false);
  const [referralFilters, setReferralFilters] = useState(initialReferralFilters);
  const [referralForm, setReferralForm] = useState({
    patient_id: '',
    referred_doctor_id: '',
    specialty: '',
    reason: '',
    clinical_summary: '',
    notes: '',
    referral_date: new Date().toISOString().slice(0, 10),
    appointment_date: '',
  });

  // Queue state
  interface QueuePatient {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
  }
  interface QueueEntry {
    id: number | string;
    patient_id: number;
    patient?: QueuePatient | null;
    appointment_id: number | null;
    appointment?: {
      id: number;
      appointment_date: string;
      appointment_time: string;
      type: string;
      status: string;
    } | null;
    queue_number: number | null;
    status: string;
    priority?: string;
    notes?: string | null;
    checked_in_at?: string;
    called_at?: string | null;
    completed_at?: string | null;
    checked_in?: boolean;
  }
  const [queueLoaded, setQueueLoaded] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [callingNext, setCallingNext] = useState(false);

  // Current patient in consultation (derived from queue)
  const currentPatientInConsultation = useMemo(() => 
    queueEntries.find(e => e.status === 'in_consultation' || e.status === 'in_progress') || null,
    [queueEntries]
  );

  const getPatientName = (entry: QueueEntry): string => {
    if (entry.patient) {
      return `${entry.patient.first_name || ''} ${entry.patient.last_name || ''}`.trim() || 'Unknown';
    }
    return 'Unknown Patient';
  };

  // Patient registration (doctor)
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [patientSaving, setPatientSaving] = useState(false);
  const [patientForm, setPatientForm] = useState<CreatePatientPayload>({
    name: '',
    email: '',
    password: '',
    date_of_birth: '',
    phone: '',
    gender: '',
    blood_type: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
  });
  const [patientError, setPatientError] = useState<string | null>(null);
  const [patientSuccessMsg, setPatientSuccessMsg] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    navigate('/login');
  };

  const refreshAppointments = useCallback(async (filters: { date: string; status: string; patient_name: string }) => {
    setError(null);
    setAppointmentsLoading(true);
    try {
      const resp = await doctorApi.appointments.list({
        date: filters.date || undefined,
        status: filters.status || undefined,
        patient_name: filters.patient_name || undefined,
      });
      setAppointments(Array.isArray(resp.data) ? resp.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load appointments');
    } finally {
      setAppointmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAppointments(initialAppointmentFilters);
  }, [initialAppointmentFilters, refreshAppointments]);

  const openConsultation = async (appt: DoctorAppointment) => {
    setSelectedAppointment(appt);
    setConsultNotes(appt.notes || '');
    setTeleconsultationMeetingUrl(null);
    setTeleconsultationId(null);
    setActive('consultation');
    await loadPatientDiagnoses(appt.patient_id);
  };

  const updateAppointmentStatus = async (appt: DoctorAppointment, status: 'scheduled' | 'completed' | 'cancelled') => {
    if (!window.confirm(`Mark appointment as ${status}?`)) return;
    setError(null);
    try {
      await doctorApi.appointments.updateStatus(appt.id, { status, notes: appt.notes ?? null });
      await refreshAppointments(appointmentFilters);
    } catch (e: any) {
      setError(e?.message || 'Failed to update appointment');
    }
  };

  const startTeleconsultation = async () => {
    if (!selectedAppointment) return;
    setError(null);
    setConsultationStarting(true);
    try {
      const session = await doctorApi.teleconsultations.start({ appointment_id: selectedAppointment.id });
      setTeleconsultationMeetingUrl(session.meeting_url || null);
      setTeleconsultationId(session.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to start teleconsultation');
    } finally {
      setConsultationStarting(false);
    }
  };

  const endTeleconsultation = async () => {
    if (!teleconsultationId) return;
    setError(null);
    setConsultationEnding(true);
    try {
      await doctorApi.teleconsultations.end(teleconsultationId, {
        notes: consultNotes.trim() === '' ? null : consultNotes.trim(),
      });
      await refreshAppointments(appointmentFilters);
    } catch (e: any) {
      setError(e?.message || 'Failed to end teleconsultation');
    } finally {
      setConsultationEnding(false);
    }
  };

  const loadEhr = async (patientId: number) => {
    setError(null);
    setEhrLoading(true);
    try {
      const data = await doctorApi.ehr.getPatientEhr(patientId);
      setEhrData(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load EHR');
    } finally {
      setEhrLoading(false);
    }
  };

  const loadPatientDiagnoses = async (patientId: number) => {
    if (!patientId) return;
    setError(null);
    setPatientDiagnosesLoading(true);
    try {
      const resp = await doctorApi.diagnoses.getPatientDiagnoses(patientId);
      setPatientDiagnoses(Array.isArray(resp.data) ? resp.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load diagnoses');
    } finally {
      setPatientDiagnosesLoading(false);
    }
  };

  const openCreateDiagnosis = () => {
    setEditingDiagnosis(null);
    setDiagnosisModalOpen(true);
  };

  const openPatientRegistration = () => {
    setPatientError(null);
    setPatientSuccessMsg(null);
    setGeneratedPassword(null);
    setPatientForm((p) => ({ ...p, name: '', email: '', password: '', date_of_birth: '', phone: '', gender: '', blood_type: '', address: '', city: '', state: '', postal_code: '' }));
    setPatientModalOpen(true);
  };

  const createPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setPatientError(null);
    setPatientSuccessMsg(null);
    if (!patientForm.name.trim() || !patientForm.email.trim()) {
      setPatientError('Name and email are required');
      return;
    }
    setPatientSaving(true);
    try {
      const resp = await doctorApi.patients.create(patientForm);
      setGeneratedPassword(resp.generated_password || null);
      setPatientSuccessMsg('Patient registered successfully');
      // Optionally clear form or keep for copy
      setPatientForm((p) => ({ ...p, password: '' }));
      // Close modal after a short delay
      setTimeout(() => setPatientModalOpen(false), 1000);
    } catch (err: any) {
      setPatientError(err?.message || 'Failed to register patient');
    } finally {
      setPatientSaving(false);
    }
  };

  const openEditDiagnosis = (d: Diagnosis) => {
    setEditingDiagnosis(d);
    setDiagnosisModalOpen(true);
  };

  const createDiagnosis = async (payload: CreateDiagnosisPayload) => {
    setError(null);
    setDiagnosisSaving(true);
    try {
      await doctorApi.diagnoses.create(payload);
      setDiagnosisModalOpen(false);
      if (payload.patient_id) await loadPatientDiagnoses(payload.patient_id);
    } catch (e: any) {
      setError(e?.message || 'Failed to create diagnosis');
    } finally {
      setDiagnosisSaving(false);
    }
  };

  const updateDiagnosis = async (id: number, payload: UpdateDiagnosisPayload) => {
    setError(null);
    setDiagnosisSaving(true);
    try {
      await doctorApi.diagnoses.update(id, payload);
      setDiagnosisModalOpen(false);
      if (selectedAppointment?.patient_id) await loadPatientDiagnoses(selectedAppointment.patient_id);
    } catch (e: any) {
      setError(e?.message || 'Failed to update diagnosis');
    } finally {
      setDiagnosisSaving(false);
    }
  };

  const loadPrescriptions = useCallback(async () => {
    setError(null);
    setPrescriptionsLoading(true);
    try {
      const resp = await doctorApi.prescriptions.list();
      setPrescriptions(Array.isArray(resp.data) ? resp.data : []);
      setPrescriptionsLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load prescriptions');
    } finally {
      setPrescriptionsLoading(false);
    }
  }, []);

  const openPrescriptionDetails = async (prescription: DoctorPrescription) => {
    setError(null);
    setSelectedPrescription(prescription);
    setPrescriptionDetailsLoading(true);
    try {
      const details = await doctorApi.prescriptions.show(prescription.id);
      setSelectedPrescription(details);
    } catch (e: any) {
      setError(e?.message || 'Failed to load prescription');
    } finally {
      setPrescriptionDetailsLoading(false);
    }
  };

  const loadInventory = async () => {
    if (inventoryLoading) return;
    if (inventory.length > 0) return;

    setError(null);
    setInventoryLoading(true);
    try {
      const resp = await doctorApi.inventory.list();
      setInventory(Array.isArray(resp.data) ? resp.data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load inventory');
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadClinics = async () => {
    if (clinicsLoading) return;
    if (clinics.length > 0) return;

    setClinicsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_ENDPOINTS.CLINICS, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setClinics(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (e: any) {
      console.error('Failed to load clinics', e);
    } finally {
      setClinicsLoading(false);
    }
  };

  const openPrescriptionModal = async () => {
    setPrescriptionModalOpen(true);
    await loadInventory();
    await loadClinics();
  };

  const createPrescription = async (payload: CreatePrescriptionPayload) => {
    setError(null);
    setPrescriptionSaving(true);
    try {
      await doctorApi.prescriptions.create(payload);
      setPrescriptionModalOpen(false);
      await loadPrescriptions();
    } catch (e: any) {
      setError(e?.message || 'Failed to create prescription');
    } finally {
      setPrescriptionSaving(false);
    }
  };

  const editPrescription = async (prescription: DoctorPrescription) => {
    setEditingPrescription(prescription);
    setPrescriptionModalOpen(true);
    await loadInventory();
    await loadClinics();
  };

  const updatePrescription = async (payload: CreatePrescriptionPayload) => {
    if (!editingPrescription) return;
    
    setError(null);
    setPrescriptionSaving(true);
    try {
      await doctorApi.prescriptions.update(editingPrescription.id, payload);
      setPrescriptionModalOpen(false);
      setEditingPrescription(null);
      await loadPrescriptions();
    } catch (e: any) {
      setError(e?.message || 'Failed to update prescription');
    } finally {
      setPrescriptionSaving(false);
    }
  };

  const deletePrescription = async (prescription: DoctorPrescription) => {
    if (!window.confirm(`Are you sure you want to delete prescription ${prescription.prescription_number}?`)) {
      return;
    }

    setError(null);
    try {
      await doctorApi.prescriptions.delete(prescription.id);
      await loadPrescriptions();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete prescription');
    }
  };

  const closePrescriptionModal = () => {
    setPrescriptionModalOpen(false);
    setEditingPrescription(null);
  };

  const loadLabResults = async () => {
    const pid = Number(labsPatientId);
    if (!Number.isFinite(pid) || pid <= 0) return;

    setError(null);
    setLabsLoading(true);
    try {
      const data = await doctorApi.labs.getPatientResults(pid);
      setLabData(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load lab results');
    } finally {
      setLabsLoading(false);
    }
  };

  const createLabOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const patientId = Number(labOrderForm.patient_id);
    if (!Number.isFinite(patientId) || patientId <= 0) return;
    if (labOrderForm.test_type.trim() === '') return;

    const appointmentIdRaw = labOrderForm.appointment_id.trim() === '' ? null : Number(labOrderForm.appointment_id);
    const clinicIdRaw = labOrderForm.clinic_id.trim() === '' ? null : Number(labOrderForm.clinic_id);
    const dueDateValue = labOrderForm.due_date.trim() === '' ? null : labOrderForm.due_date;

    const payload: CreateLabOrderPayload = {
      patient_id: patientId,
      appointment_id: Number.isFinite(appointmentIdRaw as any) ? (appointmentIdRaw as number) : null,
      clinic_id: Number.isFinite(clinicIdRaw as any) ? (clinicIdRaw as number) : null,
      test_type: labOrderForm.test_type.trim(),
      test_description: labOrderForm.test_description.trim() === '' ? null : labOrderForm.test_description.trim(),
      order_date: labOrderForm.order_date,
      due_date: dueDateValue,
      notes: labOrderForm.notes.trim() === '' ? null : labOrderForm.notes.trim(),
      instructions: labOrderForm.instructions.trim() === '' ? null : labOrderForm.instructions.trim(),
    };

    setError(null);
    setLabOrderSaving(true);
    try {
      await doctorApi.labs.createOrder(payload);
      setLabOrderModalOpen(false);
      setLabOrderForm((p) => ({ ...p, test_type: '', test_description: '', clinic_id: '', notes: '', instructions: '' }));
      // Set labsPatientId and reload lab data for this patient
      setLabsPatientId(String(patientId));
      // Force reload lab results
      setLabsLoading(true);
      try {
        const data = await doctorApi.labs.getPatientResults(patientId);
        setLabData(data);
      } catch (loadError: any) {
        console.error('Failed to reload lab results:', loadError);
      } finally {
        setLabsLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to create lab order');
    } finally {
      setLabOrderSaving(false);
    }
  };

  const reviewLabResult = async (result: LabResult) => {
    const notes = window.prompt('Doctor notes', result.doctor_notes || '');
    if (notes === null) return;
    setError(null);
    try {
      await doctorApi.labs.reviewResult(result.id, { doctor_notes: notes.trim() === '' ? null : notes.trim() });
      await loadLabResults();
    } catch (e: any) {
      setError(e?.message || 'Failed to review result');
    }
  };

  const loadReferrals = useCallback(async (filters: { status: string; patient_id: string }) => {
    setError(null);
    setReferralsLoading(true);
    try {
      const resp = await doctorApi.referrals.list({
        status: filters.status || undefined,
        patient_id: filters.patient_id.trim() === '' ? undefined : Number(filters.patient_id),
      });
      setReferrals(Array.isArray(resp.data) ? resp.data : []);
      setReferralsLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load referrals');
    } finally {
      setReferralsLoading(false);
    }
  }, []);

  const submitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientId = Number(referralForm.patient_id);
    if (!Number.isFinite(patientId) || patientId <= 0) return;
    if (referralForm.reason.trim() === '') return;

    const referredDoctorIdRaw = referralForm.referred_doctor_id.trim() === '' ? null : Number(referralForm.referred_doctor_id);

    const payload: CreateReferralPayload = {
      patient_id: patientId,
      referred_doctor_id: Number.isFinite(referredDoctorIdRaw as any) ? (referredDoctorIdRaw as number) : null,
      specialty: referralForm.specialty.trim() === '' ? null : referralForm.specialty.trim(),
      reason: referralForm.reason.trim(),
      clinical_summary: referralForm.clinical_summary.trim() === '' ? null : referralForm.clinical_summary.trim(),
      notes: referralForm.notes.trim() === '' ? null : referralForm.notes.trim(),
      referral_date: referralForm.referral_date,
      appointment_date: referralForm.appointment_date.trim() === '' ? null : referralForm.appointment_date.trim(),
    };

    setError(null);
    setReferralSaving(true);
    try {
      await doctorApi.referrals.create(payload);
      setReferralModalOpen(false);
      setReferralForm((p) => ({ ...p, reason: '', notes: '', clinical_summary: '' }));
      await loadReferrals(referralFilters);
    } catch (e: any) {
      setError(e?.message || 'Failed to create referral');
    } finally {
      setReferralSaving(false);
    }
  };

  // Queue functions
  const loadQueue = useCallback(async () => {
    setError(null);
    setQueueLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_ENDPOINTS.DOCTOR_QUEUE, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to load queue');
      const data = await response.json();
      setQueueEntries(Array.isArray(data.data) ? data.data : []);
      setQueueLoaded(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to load queue');
    } finally {
      setQueueLoading(false);
    }
  }, []);

  const callNextPatient = async () => {
    setCallingNext(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_ENDPOINTS.DOCTOR_QUEUE_CALL_NEXT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to call next patient');
      }
      await loadQueue();
    } catch (e: any) {
      setError(e?.message || 'Failed to call next patient');
    } finally {
      setCallingNext(false);
    }
  };

  const updateQueueStatus = async (id: number, status: string) => {
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(API_ENDPOINTS.DOCTOR_QUEUE_STATUS(String(id)), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      await loadQueue();
    } catch (e: any) {
      setError(e?.message || 'Failed to update status');
    }
  };

  useEffect(() => {
    if (active === 'prescriptions' && !prescriptionsLoaded && !prescriptionsLoading) {
      loadPrescriptions();
    }
    if (active === 'referrals' && !referralsLoaded && !referralsLoading) {
      loadReferrals(initialReferralFilters);
    }
    if (active === 'queue' && !queueLoaded && !queueLoading) {
      loadQueue();
    }
    // Auto-load lab results when switching to labs tab with a current consultation patient
    if (active === 'labs' && currentPatientInConsultation && !labsLoading) {
      const patientId = String(currentPatientInConsultation.patient_id);
      if (labsPatientId !== patientId) {
        setLabsPatientId(patientId);
      }
      // Load lab data for the current patient
      if (labsPatientId.trim() !== '' || patientId) {
        const pid = Number(patientId || labsPatientId);
        if (Number.isFinite(pid) && pid > 0 && !labData) {
          setLabsLoading(true);
          doctorApi.labs.getPatientResults(pid)
            .then(data => setLabData(data))
            .catch(e => setError(e?.message || 'Failed to load lab results'))
            .finally(() => setLabsLoading(false));
        }
      }
    }
  }, [active, initialReferralFilters, loadPrescriptions, loadReferrals, loadQueue, prescriptionsLoaded, prescriptionsLoading, referralsLoaded, referralsLoading, queueLoaded, queueLoading, currentPatientInConsultation, labsPatientId, labsLoading, labData]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const todaysAppointments = useMemo(
    () => appointments.filter((a) => a.appointment_date === today),
    [appointments, today]
  );
  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'scheduled' && a.appointment_date >= today),
    [appointments, today]
  );

  const Sidebar = (
    <div className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-white">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Doctor Portal</div>
            <div className="text-xs text-gray-500">Private Hospital & Clinic</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-1">
        <button
          onClick={() => setActive('overview')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-medium">Overview</span>
        </button>
        <button
          onClick={() => setActive('queue')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'queue' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">Patient Queue</span>
        </button>
        <button
          onClick={() => setActive('consultation')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'consultation' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Video className="w-5 h-5" />
          <span className="text-sm font-medium">Consultation</span>
        </button>
        <button
          onClick={() => setActive('ehr')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'ehr' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-sm font-medium">EHR</span>
        </button>
        <button
          onClick={() => setActive('prescriptions')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'prescriptions' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Pill className="w-5 h-5" />
          <span className="text-sm font-medium">Prescriptions</span>
        </button>
        <button
          onClick={() => setActive('labs')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'labs' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <FlaskConical className="w-5 h-5" />
          <span className="text-sm font-medium">Lab Orders</span>
        </button>
        <button
          onClick={() => setActive('referrals')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === 'referrals' ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">Referrals</span>
        </button>
      </div>
    </div>
  );

  const MobileNav = (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
      <div className="absolute top-0 left-0 h-full w-80 bg-white shadow-xl">
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="font-semibold text-gray-900">Menu</div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 space-y-1">
          {(
            [
              ['overview', 'Overview', LayoutDashboard],
              ['queue', 'Patient Queue', Users],
              ['consultation', 'Consultation', Video],
              ['ehr', 'EHR', FileText],
              ['prescriptions', 'Prescriptions', Pill],
              ['labs', 'Lab Orders', FlaskConical],
              ['referrals', 'Referrals', Share2],
            ] as Array<[SectionKey, string, any]>
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => {
                setActive(key);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${active === key ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}

          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen bg-gray-50 flex">
        {Sidebar}

        <div className="flex-1 min-w-0">
          <div className="md:hidden bg-white border-b">
            <div className="flex items-center justify-between px-4 h-16">
              <button onClick={() => setMobileNavOpen(true)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Open menu">
                <Menu className="w-6 h-6" />
              </button>
              <div className="text-sm font-semibold text-gray-900">Doctor Dashboard</div>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Logout">
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>

          {mobileNavOpen && MobileNav}

          <div className="relative bg-cover bg-center" style={{ backgroundImage: "url('/images/Hero.png')" }}>
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            <div className="relative z-10 px-4 md:px-8 py-12 md:py-16">
              <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2">Welcome back, {doctorName}</h1>
                <p className="text-lg md:text-xl text-gray-200 mb-6">Manage appointments, consultations and patient care</p>
                <div className="hidden md:flex items-center gap-3">
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 rounded-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-800 transition duration-300 font-bold"
                  >
                    Home
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 rounded-full bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition duration-300 font-bold"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="p-4 md:p-8">
            {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

            {active === 'overview' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                    <p className="text-gray-600 text-sm">Today's snapshot and quick actions</p>
                  </div>
                  <button
                    onClick={() => refreshAppointments(appointmentFilters)}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                  >
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Users className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Patient Queue</h2>
                      <p className="text-gray-600">View and manage waiting patients</p>
                    </div>
                    <button
                      onClick={() => setActive('queue')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      View
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <FileText className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">EHR</h2>
                      <p className="text-gray-600">Access patient medical records</p>
                    </div>
                    <button
                      onClick={() => setActive('ehr')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      Open
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <ClipboardList className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Register Patient</h2>
                      <p className="text-gray-600">Create a new patient account</p>
                    </div>
                    <button
                      onClick={openPatientRegistration}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      Register Patient
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Pill className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Prescriptions</h2>
                      <p className="text-gray-600">Create and track prescriptions</p>
                    </div>
                    <button
                      onClick={() => setActive('prescriptions')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      Manage
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Video className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Consultation</h2>
                      <p className="text-gray-600">Start and manage consultations</p>
                    </div>
                    <button
                      onClick={() => setActive('consultation')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      Start
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <FlaskConical className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Lab Orders</h2>
                      <p className="text-gray-600">Order and review lab tests</p>
                    </div>
                    <button
                      onClick={() => setActive('labs')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      Order
                    </button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 p-8"
                  >
                    <div className="mb-6">
                      <Share2 className="w-12 h-12 text-teal-500 mb-4" />
                      <h2 className="text-xl font-bold text-gray-800 mb-3">Referrals</h2>
                      <p className="text-gray-600">Refer patients to specialists</p>
                    </div>
                    <button
                      onClick={() => setActive('referrals')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300 w-full"
                    >
                      Refer
                    </button>
                  </motion.div>
                </div>

                <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-teal-500">{todaysAppointments.length}</h3>
                    <p className="text-gray-600">Today's Appointments</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-teal-500">{upcomingAppointments.length}</h3>
                    <p className="text-gray-600">Upcoming</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-teal-500">{appointments.filter((a) => a.status === 'completed').length}</h3>
                    <p className="text-gray-600">Completed</p>
                  </div>
                  <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                    <h3 className="text-2xl font-bold text-teal-500">{appointments.filter((a) => a.status === 'cancelled').length}</h3>
                    <p className="text-gray-600">Cancelled</p>
                  </div>
                </div>
              </div>
            )}

            {active === 'consultation' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Consultation</h2>
                    <p className="text-gray-600 text-sm">Start teleconsultations, record notes, add diagnosis & prescription</p>
                  </div>
                </div>

                {!selectedAppointment ? (
                  <div className="bg-white rounded-lg shadow-lg p-6 text-gray-600">
                    Select an appointment from the Appointments tab to begin.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Appointment</div>
                          <div className="font-semibold text-gray-900">#{selectedAppointment.id}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Date & Time</div>
                          <div className="font-semibold text-gray-900">
                            {selectedAppointment.appointment_date} {(selectedAppointment.appointment_time || '').slice(0, 5)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Type</div>
                          <div className="font-semibold text-gray-900">
                            {selectedAppointment.type === 'telemedicine' ? 'Telemedicine' : 'In Person'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 flex-wrap">
                        <button
                          onClick={() => {
                            setActive('ehr');
                            setEhrPatientId(String(selectedAppointment.patient_id));
                            loadEhr(selectedAppointment.patient_id);
                          }}
                          className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          Open EHR
                        </button>
                        <button
                          onClick={async () => {
                            setLabOrderForm((p) => ({
                              ...p,
                              patient_id: String(selectedAppointment.patient_id),
                              appointment_id: String(selectedAppointment.id),
                            }));
                            setLabOrderModalOpen(true);
                            await loadClinics();
                          }}
                          className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          Order Lab Test
                        </button>
                        <button
                          onClick={() => {
                            setReferralForm((p) => ({ ...p, patient_id: String(selectedAppointment.patient_id) }));
                            setReferralModalOpen(true);
                          }}
                          className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          Refer
                        </button>
                        <button
                          onClick={openPrescriptionModal}
                          className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          Create Prescription
                        </button>
                        <button
                          onClick={openCreateDiagnosis}
                          className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          Add Diagnosis
                        </button>
                      </div>

                      {selectedAppointment.type === 'telemedicine' && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                              <div className="text-sm font-medium text-gray-700">Teleconsultation</div>
                              <div className="text-sm text-gray-600">Start a secure video/audio session</div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={startTeleconsultation}
                                disabled={consultationStarting}
                                className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                              >
                                {consultationStarting ? 'Starting...' : 'Start'}
                              </button>
                              <button
                                onClick={endTeleconsultation}
                                disabled={!teleconsultationId || consultationEnding}
                                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-60 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                              >
                                {consultationEnding ? 'Ending...' : 'End'}
                              </button>
                            </div>
                          </div>

                          {teleconsultationMeetingUrl && (
                            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="text-sm text-gray-600">Meeting URL</div>
                              <a className="text-teal-700 hover:text-teal-800 break-all" href={teleconsultationMeetingUrl} target="_blank" rel="noreferrer">
                                {teleconsultationMeetingUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Notes</label>
                        <textarea
                          rows={5}
                          value={consultNotes}
                          onChange={(e) => setConsultNotes(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="Record symptoms, vitals summary, assessments, plan..."
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Diagnoses</h3>
                          <p className="text-sm text-gray-600">Patient diagnosis history for this consultation</p>
                        </div>
                        <button
                          onClick={openCreateDiagnosis}
                          className="bg-teal-500 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                        >
                          Add
                        </button>
                      </div>

                      {patientDiagnosesLoading ? (
                        <div className="text-center py-8 text-gray-600">Loading...</div>
                      ) : patientDiagnoses.length === 0 ? (
                        <div className="text-gray-600 py-6">No diagnoses found.</div>
                      ) : (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {patientDiagnoses.map((d) => (
                                <tr key={d.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 text-sm text-gray-600">{d.diagnosis_date}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">{d.diagnosis_name}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{d.status}</td>
                                  <td className="px-6 py-4">
                                    <button
                                      onClick={() => openEditDiagnosis(d)}
                                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                    >
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === 'ehr' && (
              <EhrViewer
                patientId={ehrPatientId}
                onPatientIdChange={setEhrPatientId}
                onLoad={() => {
                  const pid = Number(ehrPatientId);
                  if (!Number.isFinite(pid) || pid <= 0) return;
                  loadEhr(pid);
                }}
                loading={ehrLoading}
                data={ehrData}
                tab={ehrTab}
                onTabChange={setEhrTab}
              />
            )}

            {active === 'prescriptions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Prescriptions</h2>
                    <p className="text-gray-600 text-sm">Create and review patient prescriptions</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={openPrescriptionModal}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => loadPrescriptions()}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {prescriptionsLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {prescriptions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                                No prescriptions found.
                              </td>
                            </tr>
                          ) : (
                            prescriptions.map((p) => {
                              const patientName = p.patient
                                ? `${p.patient.first_name || ''} ${p.patient.last_name || ''}`.trim() || p.patient.email || `#${p.patient.id}`
                                : `#${p.patient_id}`;
                              return (
                                <tr key={p.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 text-sm text-gray-900">{p.prescription_number || p.id}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{patientName}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{p.prescription_date}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{p.status}</td>
                                  <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => openPrescriptionDetails(p)}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-3 py-1 rounded text-xs transition duration-300"
                                      >
                                        View
                                      </button>
                                      {p.status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => editPrescription(p)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-xs transition duration-300"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => deletePrescription(p)}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-xs transition duration-300"
                                          >
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedPrescription && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Prescription Details</h2>
                        <button
                          type="button"
                          onClick={() => !prescriptionDetailsLoading && setSelectedPrescription(null)}
                          disabled={prescriptionDetailsLoading}
                          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-60"
                          aria-label="Close"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {prescriptionDetailsLoading ? (
                        <div className="text-center py-12">Loading...</div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Number</div>
                              <div className="font-semibold text-gray-900">{selectedPrescription.prescription_number}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Date</div>
                              <div className="font-semibold text-gray-900">{selectedPrescription.prescription_date}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Status</div>
                              <div className="font-semibold text-gray-900">{selectedPrescription.status}</div>
                            </div>
                          </div>

                          {selectedPrescription.items && selectedPrescription.items.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meal Timing</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {selectedPrescription.items.map((it) => (
                                    <tr key={it.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 text-sm text-gray-900">{it.inventory_item?.name || `#${it.inventory_item_id}`}</td>
                                      <td className="px-6 py-4 text-sm text-gray-600">{it.quantity}</td>
                                      <td className="px-6 py-4 text-sm text-gray-600">{it.dosage || '-'}</td>
                                      <td className="px-6 py-4 text-sm text-gray-600">{it.frequency || '-'}</td>
                                      <td className="px-6 py-4 text-sm text-gray-600">{it.meal_timing || '-'}</td>
                                      <td className="px-6 py-4 text-sm text-gray-600">{it.duration_days || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === 'labs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Lab Orders & Results</h2>
                    <p className="text-gray-600 text-sm">Create orders and review patient results</p>
                  </div>
                  <button
                    onClick={async () => {
                      setLabOrderForm((p) => ({
                        ...p,
                        patient_id: labsPatientId,
                      }));
                      setLabOrderModalOpen(true);
                      await loadClinics();
                    }}
                    className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                  >
                    New Order
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex gap-2 items-end flex-wrap">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                      <input
                        type="number"
                        value={labsPatientId}
                        onChange={(e) => setLabsPatientId(e.target.value)}
                        className="w-40 px-3 py-2 border rounded-lg"
                        placeholder="e.g. 1"
                      />
                    </div>
                    <button
                      onClick={loadLabResults}
                      disabled={labsLoading || labsPatientId.trim() === ''}
                      className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                    >
                      {labsLoading ? 'Loading...' : 'Load'}
                    </button>
                  </div>
                </div>

                {labData && (
                  <div className="space-y-6">
                    {/* Lab Orders Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Orders</h3>
                      {labData.orders.length === 0 ? (
                        <div className="text-gray-600">No lab orders found.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {labData.orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_number}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">{order.test_type}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{order.test_description || '-'}</td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{order.order_date}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{order.due_date || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Lab Results Section */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Results</h3>
                      {labData.results.length === 0 ? (
                        <div className="text-gray-600">No results found.</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviewed</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {labData.results.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 text-sm text-gray-900">{r.test_name}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{r.result_value || '-'}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{r.status}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{r.doctor_reviewed ? 'yes' : 'no'}</td>
                                  <td className="px-6 py-4">
                                    <button
                                      onClick={() => reviewLabResult(r)}
                                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-full text-xs transition duration-300"
                                    >
                                      Review
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === 'queue' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Patient Queue</h2>
                    <p className="text-gray-600 text-sm">View and manage patients waiting to be seen</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={callNextPatient}
                      disabled={callingNext || queueEntries.filter(e => e.status === 'waiting').length === 0}
                      className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                    >
                      {callingNext ? 'Calling...' : 'Call Next Patient'}
                    </button>
                    <button
                      onClick={() => loadQueue()}
                      disabled={queueLoading}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Current Patient Card */}
                {(() => {
                  const currentPatient = queueEntries.find(e => e.status === 'in_consultation' || e.status === 'in_progress');
                  const nextPatient = queueEntries.find(e => e.status === 'waiting');
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Patient */}
                      <div className={`p-6 rounded-lg shadow-lg ${currentPatient ? 'bg-teal-50 border-2 border-teal-500' : 'bg-gray-50'}`}>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Patient</h3>
                        {currentPatient ? (
                          <div>
                            <p className="text-2xl font-bold text-teal-700">{getPatientName(currentPatient)}</p>
                            <p className="text-sm text-gray-600 mt-1">Queue #{currentPatient.queue_number} | Patient ID: {currentPatient.patient_id}</p>
                            {currentPatient.appointment && (
                              <p className="text-sm text-gray-500">Appointment: {currentPatient.appointment.appointment_time}</p>
                            )}
                            
                            {/* Action Buttons for Current Patient */}
                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                onClick={async () => {
                                  setLabOrderForm((p) => ({
                                    ...p,
                                    patient_id: String(currentPatient.patient_id),
                                    appointment_id: currentPatient.appointment_id ? String(currentPatient.appointment_id) : '',
                                  }));
                                  setLabOrderModalOpen(true);
                                  await loadClinics();
                                }}
                                className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition text-sm border border-slate-500"
                              >
                                Lab Test
                              </button>
                              <button
                                onClick={async () => {
                                  // Set patient context for prescription
                                  setSelectedAppointment({
                                    id: currentPatient.appointment_id || 0,
                                    patient_id: currentPatient.patient_id,
                                    patient: currentPatient.patient,
                                  } as any);
                                  await openPrescriptionModal();
                                }}
                                className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition text-sm border border-slate-500"
                              >
                                Prescription
                              </button>
                              <button
                                onClick={async () => {
                                  setReferralForm((p) => ({ ...p, patient_id: String(currentPatient.patient_id) }));
                                  setReferralModalOpen(true);
                                }}
                                className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition text-sm border border-slate-500"
                              >
                                Refer to Clinic
                              </button>
                              <button
                                onClick={() => {
                                  setEhrPatientId(String(currentPatient.patient_id));
                                  loadEhr(currentPatient.patient_id);
                                  setActive('ehr');
                                }}
                                className="bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition text-sm border border-slate-500"
                              >
                                View EHR
                              </button>
                            </div>

                            <button
                              onClick={() => updateQueueStatus(currentPatient.id as number, 'completed')}
                              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition w-full"
                            >
                              Mark Complete
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-500">No patient in consultation</p>
                        )}
                      </div>

                      {/* Next Patient */}
                      <div className={`p-6 rounded-lg shadow-lg ${nextPatient ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-50'}`}>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Next Patient</h3>
                        {nextPatient ? (
                          <div>
                            <p className="text-2xl font-bold text-yellow-700">{getPatientName(nextPatient)}</p>
                            <p className="text-sm text-gray-600 mt-1">Queue #{nextPatient.queue_number}</p>
                            {nextPatient.appointment && (
                              <p className="text-sm text-gray-500">Appointment: {nextPatient.appointment.appointment_time}</p>
                            )}
                            <button
                              onClick={() => updateQueueStatus(nextPatient.id as number, 'in_consultation')}
                              className="mt-4 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg transition"
                            >
                              Start Consultation
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-500">No patients waiting</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Queue Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-3xl font-bold text-yellow-600">{queueEntries.filter(e => e.status === 'waiting').length}</p>
                    <p className="text-sm text-gray-600">Waiting</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-3xl font-bold text-teal-600">{queueEntries.filter(e => e.status === 'in_consultation' || e.status === 'in_progress').length}</p>
                    <p className="text-sm text-gray-600">In Consultation</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow text-center">
                    <p className="text-3xl font-bold text-green-600">{queueEntries.filter(e => e.status === 'completed').length}</p>
                    <p className="text-sm text-gray-600">Completed Today</p>
                  </div>
                </div>

                {queueLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                      <h3 className="font-semibold text-gray-700">Waiting Queue</h3>
                      <span className="text-sm text-gray-500">{queueEntries.filter(e => e.status === 'waiting' || e.status === 'in_consultation' || e.status === 'in_progress').length} patients</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appointment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {queueEntries.filter(e => e.status !== 'completed' && e.status !== 'no_show' && e.status !== 'cancelled').length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-gray-600">
                                No patients in queue.
                              </td>
                            </tr>
                          ) : (
                            queueEntries.filter(e => e.status !== 'completed' && e.status !== 'no_show' && e.status !== 'cancelled').map((entry, index) => (
                              <tr key={entry.id} className={`hover:bg-gray-50 ${entry.status === 'in_consultation' || entry.status === 'in_progress' ? 'bg-teal-50' : index === 0 && entry.status === 'waiting' ? 'bg-yellow-50' : ''}`}>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  {entry.queue_number ?? '-'}
                                  {index === 0 && entry.status === 'waiting' && (
                                    <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">NEXT</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{getPatientName(entry)}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {entry.appointment ? (
                                    <span>{entry.appointment.appointment_time} - {entry.appointment.type}</span>
                                  ) : '-'}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    entry.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                    entry.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                    (entry.status === 'in_consultation' || entry.status === 'in_progress') ? 'bg-teal-100 text-teal-800' :
                                    entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {entry.status.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                  {entry.checked_in_at ? new Date(entry.checked_in_at).toLocaleTimeString() : 
                                   entry.appointment?.appointment_time || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  <div className="flex flex-wrap gap-1">
                                    {(entry.status === 'waiting' || entry.status === 'scheduled') && typeof entry.id === 'number' && (
                                      <button
                                        onClick={() => updateQueueStatus(entry.id as number, 'in_consultation')}
                                        className="text-slate-700 hover:text-slate-900 font-medium text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300"
                                      >
                                        Start
                                      </button>
                                    )}
                                    {(entry.status === 'in_consultation' || entry.status === 'in_progress') && typeof entry.id === 'number' && (
                                      <>
                                        <button
                                          onClick={async () => {
                                            setLabOrderForm((p) => ({
                                              ...p,
                                              patient_id: String(entry.patient_id),
                                              appointment_id: entry.appointment_id ? String(entry.appointment_id) : '',
                                            }));
                                            setLabOrderModalOpen(true);
                                            await loadClinics();
                                          }}
                                          className="text-slate-700 hover:text-slate-900 font-medium text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300"
                                          title="Order Lab Test"
                                        >
                                          Lab
                                        </button>
                                        <button
                                          onClick={async () => {
                                            setSelectedAppointment({
                                              id: entry.appointment_id || 0,
                                              patient_id: entry.patient_id,
                                              patient: entry.patient,
                                            } as any);
                                            await openPrescriptionModal();
                                          }}
                                          className="text-slate-700 hover:text-slate-900 font-medium text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300"
                                          title="Create Prescription"
                                        >
                                          Rx
                                        </button>
                                        <button
                                          onClick={() => {
                                            setReferralForm((p) => ({ ...p, patient_id: String(entry.patient_id) }));
                                            setReferralModalOpen(true);
                                          }}
                                          className="text-slate-700 hover:text-slate-900 font-medium text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-300"
                                          title="Refer to Clinic"
                                        >
                                          Refer
                                        </button>
                                        <button
                                          onClick={() => updateQueueStatus(entry.id as number, 'completed')}
                                          className="text-teal-700 hover:text-teal-900 font-medium text-xs bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded border border-teal-300"
                                        >
                                          Done
                                        </button>
                                      </>
                                    )}
                                    {(entry.status === 'waiting' || entry.status === 'in_consultation' || entry.status === 'in_progress') && typeof entry.id === 'number' && (
                                      <button
                                        onClick={() => updateQueueStatus(entry.id as number, 'no_show')}
                                        className="text-gray-600 hover:text-gray-800 font-medium text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border border-gray-300"
                                      >
                                        No Show
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === 'referrals' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Referrals</h2>
                    <p className="text-gray-600 text-sm">Refer patients to specialists and track status</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReferralModalOpen(true)}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => loadReferrals(referralFilters)}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={referralFilters.status}
                        onChange={(e) => setReferralFilters((p) => ({ ...p, status: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="">All</option>
                        <option value="pending">pending</option>
                        <option value="accepted">accepted</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                      <input
                        type="number"
                        value={referralFilters.patient_id}
                        onChange={(e) => setReferralFilters((p) => ({ ...p, patient_id: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => loadReferrals(referralFilters)}
                        disabled={referralsLoading}
                        className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {referralsLoading ? (
                  <div className="text-center py-12">Loading...</div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {referrals.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-600">
                                No referrals found.
                              </td>
                            </tr>
                          ) : (
                            referrals.map((r) => (
                              <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">{r.referral_number || r.id}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{r.patient_id}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{r.specialty || '-'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{r.status}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{r.referral_date}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DiagnosisForm
          open={diagnosisModalOpen}
          saving={diagnosisSaving}
          diagnosis={editingDiagnosis}
          initialPatientId={selectedAppointment?.patient_id ?? null}
          initialAppointmentId={selectedAppointment?.id ?? null}
          onClose={() => {
            if (diagnosisSaving) return;
            setDiagnosisModalOpen(false);
            setEditingDiagnosis(null);
          }}
          onCreate={createDiagnosis}
          onUpdate={updateDiagnosis}
        />

        <PrescriptionForm
          open={prescriptionModalOpen}
          saving={prescriptionSaving || inventoryLoading || clinicsLoading}
          inventory={inventory}
          clinics={clinics}
          initialPatientId={selectedAppointment?.patient_id ?? null}
          initialAppointmentId={selectedAppointment?.id ?? null}
          initialPrescription={editingPrescription}
          onClose={closePrescriptionModal}
          onSubmit={editingPrescription ? updatePrescription : createPrescription}
        />

        {labOrderModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">New Lab Order</h2>
                <button
                  type="button"
                  onClick={() => !labOrderSaving && setLabOrderModalOpen(false)}
                  disabled={labOrderSaving}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-60"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={createLabOrder} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
                    <input
                      type="number"
                      required
                      value={labOrderForm.patient_id}
                      onChange={(e) => setLabOrderForm((p) => ({ ...p, patient_id: e.target.value }))}
                      readOnly={labOrderForm.patient_id !== ''}
                      className={`w-full px-3 py-2 border rounded-lg ${labOrderForm.patient_id !== '' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Appointment ID</label>
                    <input
                      type="number"
                      value={labOrderForm.appointment_id}
                      onChange={(e) => setLabOrderForm((p) => ({ ...p, appointment_id: e.target.value }))}
                      readOnly={labOrderForm.appointment_id !== ''}
                      className={`w-full px-3 py-2 border rounded-lg ${labOrderForm.appointment_id !== '' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Type *</label>
                    <input
                      type="text"
                      required
                      value={labOrderForm.test_type}
                      onChange={(e) => setLabOrderForm((p) => ({ ...p, test_type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g. CBC"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
                    <input
                      type="date"
                      required
                      value={labOrderForm.order_date}
                      onChange={(e) => setLabOrderForm((p) => ({ ...p, order_date: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Clinic</label>
                    <select
                      value={labOrderForm.clinic_id}
                      onChange={(e) => setLabOrderForm((p) => ({ ...p, clinic_id: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">-- No Clinic --</option>
                      {clinics.map((clinic) => (
                        <option key={clinic.id} value={String(clinic.id)}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Description</label>
                    <input
                      type="text"
                      value={labOrderForm.test_description}
                      onChange={(e) => setLabOrderForm((p) => ({ ...p, test_description: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={labOrderForm.due_date}
                      onChange={(e) => setLabOrderForm((p) => ({ ...p, due_date: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input
                      type="text"
                      value={labOrderForm.notes}
                      onChange={(e) => setLabOrderForm((p) => ({ ...p, notes: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea
                      rows={3}
                      value={labOrderForm.instructions}
                      onChange={(e) => setLabOrderForm((p) => ({ ...p, instructions: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={labOrderSaving}
                  className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  {labOrderSaving ? 'Saving...' : 'Create Order'}
                </button>
              </form>
            </div>
          </div>
        )}

        {patientModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Register Patient</h2>
                <button
                  type="button"
                  onClick={() => !patientSaving && setPatientModalOpen(false)}
                  disabled={patientSaving}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-60"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {patientError && <div className="mb-4 text-sm text-red-700">{patientError}</div>}
              {patientSuccessMsg && (
                <div className="mb-4 text-sm text-green-700">
                  {patientSuccessMsg}{generatedPassword ? <div className="mt-2 text-xs text-gray-700">Generated password: <code className="bg-gray-100 px-2 py-1 rounded">{generatedPassword}</code></div> : null}
                </div>
              )}

              <form onSubmit={createPatient} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      required
                      value={patientForm.name}
                      onChange={(e) => setPatientForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      required
                      type="email"
                      value={patientForm.email}
                      onChange={(e) => setPatientForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password (optional)</label>
                    <input
                      type="password"
                      value={patientForm.password || ''}
                      onChange={(e) => setPatientForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Leave blank to auto-generate"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={patientForm.date_of_birth || ''}
                      onChange={(e) => setPatientForm((p) => ({ ...p, date_of_birth: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      value={patientForm.phone || ''}
                      onChange={(e) => setPatientForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={patientForm.gender || ''}
                      onChange={(e) => setPatientForm((p) => ({ ...p, gender: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
                    <input
                      value={patientForm.blood_type || ''}
                      onChange={(e) => setPatientForm((p) => ({ ...p, blood_type: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g. A+"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      value={patientForm.address || ''}
                      onChange={(e) => setPatientForm((p) => ({ ...p, address: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPatientModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                    disabled={patientSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold"
                    disabled={patientSaving}
                  >
                    {patientSaving ? 'Registering...' : 'Register Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {referralModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">New Referral</h2>
                <button
                  type="button"
                  onClick={() => !referralSaving && setReferralModalOpen(false)}
                  disabled={referralSaving}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-60"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitReferral} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID *</label>
                    <input
                      type="number"
                      required
                      value={referralForm.patient_id}
                      onChange={(e) => setReferralForm((p) => ({ ...p, patient_id: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referred Doctor ID (optional)</label>
                    <input
                      type="number"
                      value={referralForm.referred_doctor_id}
                      onChange={(e) => setReferralForm((p) => ({ ...p, referred_doctor_id: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                    <input
                      type="text"
                      value={referralForm.specialty}
                      onChange={(e) => setReferralForm((p) => ({ ...p, specialty: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referral Date *</label>
                    <input
                      type="date"
                      required
                      value={referralForm.referral_date}
                      onChange={(e) => setReferralForm((p) => ({ ...p, referral_date: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                    <input
                      type="text"
                      required
                      value={referralForm.reason}
                      onChange={(e) => setReferralForm((p) => ({ ...p, reason: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Summary</label>
                    <textarea
                      rows={3}
                      value={referralForm.clinical_summary}
                      onChange={(e) => setReferralForm((p) => ({ ...p, clinical_summary: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={3}
                      value={referralForm.notes}
                      onChange={(e) => setReferralForm((p) => ({ ...p, notes: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                    <input
                      type="date"
                      value={referralForm.appointment_date}
                      onChange={(e) => setReferralForm((p) => ({ ...p, appointment_date: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={referralSaving}
                  className="bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-full transition duration-300"
                >
                  {referralSaving ? 'Saving...' : 'Create Referral'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboardView;
