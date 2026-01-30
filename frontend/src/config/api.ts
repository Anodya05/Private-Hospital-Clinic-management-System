// API Configuration
declare const process: {



























































































































































































}    }        ]);            'message' => 'Patient record retrieved successfully'            'data' => $patientRecord,        return response()->json([        ];            })->toArray(),                ];                    'created_at' => $referral->created_at->toISOString(),                    'preferred_appointment_date' => $referral->preferred_appointment_date,                    'status' => $referral->status ?? 'pending',                    'priority' => $referral->priority,                    'reason' => $referral->reason,                    'clinic_location' => $referral->clinic ? $referral->clinic->location : null,                    'clinic_name' => $referral->clinic ? $referral->clinic->name : 'Unknown Clinic',                    'id' => $referral->id,                return [            'clinic_referrals' => $user->clinicReferrals->map(function ($referral) {            })->toArray(),                ];                        : 'Unknown Doctor'                        ? $prescription->doctor->first_name . ' ' . $prescription->doctor->last_name                     'doctor_name' => $prescription->doctor                     'prescribed_date' => $prescription->created_at->toDateString(),                    'status' => $prescription->status ?? 'active',                    'instructions' => $prescription->instructions,                    'duration' => $prescription->duration,                    'frequency' => $prescription->frequency,                    'dosage' => $prescription->dosage,                    'medication_name' => $prescription->medication_name,                    'id' => $prescription->id,                return [            'prescriptions' => $user->prescriptions->map(function ($prescription) {            ] : null,                'medical_conditions' => $user->patientProfile->medical_conditions,                'allergies' => $user->patientProfile->allergies,                'emergency_contact' => $user->patientProfile->emergency_contact,                'guardian_phone' => $user->patientProfile->guardian_phone,                'guardian_name' => $user->patientProfile->guardian_name,                'state' => $user->patientProfile->state,                'city' => $user->patientProfile->city,                'blood_type' => $user->patientProfile->blood_type,                'address' => $user->patientProfile->address,                'gender' => $user->patientProfile->gender,                'date_of_birth' => $user->patientProfile->date_of_birth,                'phone' => $user->patientProfile->phone,            'patient_profile' => $user->patientProfile ? [            'email' => $user->email,            'last_name' => $user->last_name,            'first_name' => $user->first_name,            'id' => $user->id,        $patientRecord = [        // Transform the data for the frontend (same as searchByPhone)        }            ], 404);                'message' => 'Patient not found'                'data' => null,            return response()->json([        if (!$user || !$user->hasRole('patient')) {        ])->find($id);            }                    ->orderBy('created_at', 'desc');                $query->with('clinic:id,name,location')            'clinicReferrals' => function ($query) {            },                    ->orderBy('created_at', 'desc');                $query->with('doctor:id,first_name,last_name')            'prescriptions' => function ($query) {            'patientProfile',        $user = User::with([    {    public function show(Request $request, $id): JsonResponse     */     * Get patient details by ID    /**    }        ]);            'message' => 'Patient record found successfully'            'data' => $patientRecord,        return response()->json([        ];            })->toArray(),                ];                    'created_at' => $referral->created_at->toISOString(),                    'preferred_appointment_date' => $referral->preferred_appointment_date,                    'status' => $referral->status ?? 'pending',                    'priority' => $referral->priority,                    'reason' => $referral->reason,                    'clinic_location' => $referral->clinic ? $referral->clinic->location : null,                    'clinic_name' => $referral->clinic ? $referral->clinic->name : 'Unknown Clinic',                    'id' => $referral->id,                return [            'clinic_referrals' => $user->clinicReferrals->map(function ($referral) {            })->toArray(),                ];                        : 'Unknown Doctor'                        ? $prescription->doctor->first_name . ' ' . $prescription->doctor->last_name                     'doctor_name' => $prescription->doctor                     'prescribed_date' => $prescription->created_at->toDateString(),                    'status' => $prescription->status ?? 'active',                    'instructions' => $prescription->instructions,                    'duration' => $prescription->duration,                    'frequency' => $prescription->frequency,                    'dosage' => $prescription->dosage,                    'medication_name' => $prescription->medication_name,                    'id' => $prescription->id,                return [            'prescriptions' => $user->prescriptions->map(function ($prescription) {            ] : null,                'medical_conditions' => $user->patientProfile->medical_conditions,                'allergies' => $user->patientProfile->allergies,                'emergency_contact' => $user->patientProfile->emergency_contact,                'guardian_phone' => $user->patientProfile->guardian_phone,                'guardian_name' => $user->patientProfile->guardian_name,                'state' => $user->patientProfile->state,                'city' => $user->patientProfile->city,                'blood_type' => $user->patientProfile->blood_type,                'address' => $user->patientProfile->address,                'gender' => $user->patientProfile->gender,                'date_of_birth' => $user->patientProfile->date_of_birth,                'phone' => $user->patientProfile->phone,            'patient_profile' => $user->patientProfile ? [            'email' => $user->email,            'last_name' => $user->last_name,            'first_name' => $user->first_name,            'id' => $user->id,        $patientRecord = [        // Transform the data for the frontend        }            ], 404);                'message' => 'Patient record not found'                'data' => null,            return response()->json([        if (!$user) {        ])->find($patientProfile->user_id);            }                    ->orderBy('created_at', 'desc');                $query->with('clinic:id,name,location')            'clinicReferrals' => function ($query) {            },                    ->orderBy('created_at', 'desc');                $query->with('doctor:id,first_name,last_name')            'prescriptions' => function ($query) {            'patientProfile',        $user = User::with([        // Get the user associated with this patient profile        }            ], 404);                'message' => 'No patient found with this phone number'                'data' => null,            return response()->json([        if (!$patientProfile) {            ->first();            ->orWhere('guardian_phone', $phone)        $patientProfile = PatientProfile::where('phone', $phone)        // Find patient by phone number in patient profiles        $phone = $request->input('phone');        ]);            'phone' => 'required|string|max:20'        $request->validate([    {    public function searchByPhone(Request $request): JsonResponse     */     * Search patient by phone number    /**{class PatientController extends Controlleruse Illuminate\Http\JsonResponse;use Illuminate\Http\Request;use App\Models\PatientProfile;use App\Models\User;use App\Http\Controllers\Controller;namespace App\Http\Controllers\Api;  env: {
    REACT_APP_API_URL?: string;
  };
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Public
  SERVICES: `${API_BASE_URL}/api/services`,
  TESTIMONIALS: `${API_BASE_URL}/api/testimonials`,
  DOCTORS: `${API_BASE_URL}/api/doctors`,
  APPOINTMENTS: `${API_BASE_URL}/api/appointments`,

  // Auth
  AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
  AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  AUTH_ME: `${API_BASE_URL}/api/auth/me`,

  // Patient Portal
  PATIENT_PROFILE: `${API_BASE_URL}/api/patient/profile`,
  PATIENT_APPOINTMENTS: `${API_BASE_URL}/api/patient/appointments`,
  PATIENT_TELECONSULTATIONS: `${API_BASE_URL}/api/patient/teleconsultations`,
  PATIENT_EHR: `${API_BASE_URL}/api/patient/ehr`,
  PATIENT_INVOICES: `${API_BASE_URL}/api/patient/invoices`,
  PATIENT_PAYMENTS: `${API_BASE_URL}/api/patient/payments`,
  PATIENT_FEEDBACK: `${API_BASE_URL}/api/patient/feedback`,
  PATIENT_NOTIFICATIONS: `${API_BASE_URL}/api/patient/notifications`,
  PATIENT_PRESCRIPTIONS: `${API_BASE_URL}/api/patient/prescriptions`,

  RECEPTIONIST_DASHBOARD_STATS: `${API_BASE_URL}/api/receptionist/dashboard/stats`,
  RECEPTIONIST_PATIENTS: `${API_BASE_URL}/api/receptionist/patients`,
  RECEPTIONIST_APPOINTMENTS: `${API_BASE_URL}/api/receptionist/appointments`,
  RECEPTIONIST_QUEUE: `${API_BASE_URL}/api/receptionist/queue`,
  RECEPTIONIST_QUEUE_CHECK_IN: `${API_BASE_URL}/api/receptionist/queue/check-in`,
  RECEPTIONIST_QUEUE_STATUS: (id: number | string) => `${API_BASE_URL}/api/receptionist/queue/${id}/status`,
  RECEPTIONIST_INVOICES: `${API_BASE_URL}/api/receptionist/invoices`,
  RECEPTIONIST_PAYMENTS: `${API_BASE_URL}/api/receptionist/payments`,
  RECEPTIONIST_DOCTORS: `${API_BASE_URL}/api/receptionist/doctors`,
  RECEPTIONIST_DOCTOR_SCHEDULES: `${API_BASE_URL}/api/receptionist/doctor-schedules`,
  RECEPTIONIST_REFERRALS: `${API_BASE_URL}/api/receptionist/referrals`,

  // Prescriptions
  PRESCRIPTIONS: `${API_BASE_URL}/api/prescriptions`,
  PRESCRIPTION_PROCESS: (id: string) => `${API_BASE_URL}/api/prescriptions/${id}/process`,

  // Pharmacist specific endpoints
  PHARMACIST_PRESCRIPTIONS: `${API_BASE_URL}/api/pharmacist/prescriptions`,
  PHARMACIST_PRESCRIPTION_SHOW: (id: string) => `${API_BASE_URL}/api/pharmacist/prescriptions/${id}`,
  PHARMACIST_PRESCRIPTION_INTERACTION_CHECK: (id: string) => `${API_BASE_URL}/api/pharmacist/prescriptions/${id}/interaction-check`,
  PHARMACIST_PRESCRIPTION_DISPENSE: (id: string) => `${API_BASE_URL}/api/pharmacist/prescriptions/${id}/dispense`,
  PHARMACIST_INVENTORY: `${API_BASE_URL}/api/pharmacist/inventory`,
  PHARMACIST_INVENTORY_UPDATE: `${API_BASE_URL}/api/pharmacist/inventory/update`,
  PHARMACIST_INVENTORY_LOW_STOCK: `${API_BASE_URL}/api/pharmacist/inventory/low-stock`,
  PHARMACIST_INVENTORY_EXPIRING_SOON: `${API_BASE_URL}/api/pharmacist/inventory/expiring-soon`,
  PHARMACIST_INVENTORY_STATS: `${API_BASE_URL}/api/pharmacist/inventory/stats`,
  PHARMACIST_PURCHASE_REQUEST: `${API_BASE_URL}/api/pharmacist/purchase-request`,
  PHARMACIST_CONTROLLED_DRUGS: `${API_BASE_URL}/api/pharmacist/controlled-drugs`,
  PHARMACIST_CONTROLLED_DRUGS_LOG: `${API_BASE_URL}/api/pharmacist/controlled-drugs/log`,
  PHARMACIST_LABELS_GENERATE: `${API_BASE_URL}/api/pharmacist/labels/generate`,
  PHARMACIST_LABELS_PRINT: `${API_BASE_URL}/api/pharmacist/labels/print`,
  PHARMACIST_RETURNS: `${API_BASE_URL}/api/pharmacist/returns`,
  PHARMACIST_REPORTS_INVENTORY: `${API_BASE_URL}/api/pharmacist/reports/inventory`,
  PHARMACIST_REPORTS_STORAGE: `${API_BASE_URL}/api/pharmacist/reports/storage`,
  PHARMACIST_AUDIT_LOGS: `${API_BASE_URL}/api/pharmacist/audit-logs`,

  // Suppliers
  SUPPLIERS: `${API_BASE_URL}/api/suppliers`,

  // Drug Purchases
  DRUG_PURCHASES: `${API_BASE_URL}/api/drug-purchases`,
  DRUG_PURCHASE_RECEIVE: (id: string) => `${API_BASE_URL}/api/drug-purchases/${id}/receive`,

  // Doctor Portal
  DOCTOR_APPOINTMENTS: `${API_BASE_URL}/api/doctor/appointments`,
  DOCTOR_APPOINTMENT_STATUS: (id: string) => `${API_BASE_URL}/api/doctor/appointments/${id}/status`,
  DOCTOR_TELECONSULTATION_START: `${API_BASE_URL}/api/doctor/teleconsultations/start`,
  DOCTOR_TELECONSULTATION_END: (id: string) => `${API_BASE_URL}/api/doctor/teleconsultations/${id}/end`,
  DOCTOR_PATIENT_EHR: (patientId: string) => `${API_BASE_URL}/api/doctor/patients/${patientId}/ehr`,
  DOCTOR_PATIENTS: `${API_BASE_URL}/api/doctor/patients`,
  DOCTOR_VITALS: `${API_BASE_URL}/api/doctor/vitals`,
  DOCTOR_VITAL_UPDATE: (id: string) => `${API_BASE_URL}/api/doctor/vitals/${id}`,
  DOCTOR_DIAGNOSES: `${API_BASE_URL}/api/doctor/diagnoses`,
  DOCTOR_DIAGNOSIS_UPDATE: (id: string) => `${API_BASE_URL}/api/doctor/diagnoses/${id}`,
  DOCTOR_PATIENT_DIAGNOSES: (patientId: string) => `${API_BASE_URL}/api/doctor/diagnoses/patient/${patientId}`,
  DOCTOR_PRESCRIPTIONS: `${API_BASE_URL}/api/doctor/prescriptions`,
  DOCTOR_PRESCRIPTION_SHOW: (id: string) => `${API_BASE_URL}/api/doctor/prescriptions/${id}`,
  DOCTOR_INVENTORY: `${API_BASE_URL}/api/doctor/inventory`,
  DOCTOR_LAB_ORDERS: `${API_BASE_URL}/api/doctor/labs/orders`,
  DOCTOR_LAB_RESULTS: (patientId: string) => `${API_BASE_URL}/api/doctor/labs/results/${patientId}`,
  DOCTOR_LAB_RESULT_REVIEW: (id: string) => `${API_BASE_URL}/api/doctor/labs/results/${id}/review`,
  DOCTOR_REFERRALS: `${API_BASE_URL}/api/doctor/referrals`,

  // Doctor Queue
  DOCTOR_QUEUE: `${API_BASE_URL}/api/doctor/queue`,
  DOCTOR_QUEUE_NEXT: `${API_BASE_URL}/api/doctor/queue/next`,
  DOCTOR_QUEUE_CALL_NEXT: `${API_BASE_URL}/api/doctor/queue/call-next`,
  DOCTOR_QUEUE_STATUS: (id: string) => `${API_BASE_URL}/api/doctor/queue/${id}/status`,

  // Clinics
  CLINICS: `${API_BASE_URL}/api/clinics`,
  CLINIC_REFERRAL: `${API_BASE_URL}/api/doctor/clinic-referrals`,

  // Patients
  PATIENTS: `${API_BASE_URL}/api/patients`,

  // AI / GPT-5.2-Codex Integration
  AI_CHAT: `${API_BASE_URL}/api/ai/chat`,
  AI_MEDICAL_ANALYSIS: `${API_BASE_URL}/api/ai/medical/analysis`,
  AI_DRUG_INTERACTIONS: `${API_BASE_URL}/api/ai/medical/drug-interactions`,
  AI_DIAGNOSTICS: `${API_BASE_URL}/api/ai/medical/diagnostics`,
  AI_PRESCRIPTION_REVIEW: `${API_BASE_URL}/api/ai/medical/prescription-review`,
  AI_PATIENT_INSIGHTS: `${API_BASE_URL}/api/ai/patient/insights`,
  AI_DOCUMENT_GENERATION: `${API_BASE_URL}/api/ai/documents/generate`,
  AI_MODEL_STATUS: `${API_BASE_URL}/api/ai/status`,
  AI_FEATURES: `${API_BASE_URL}/api/ai/features`,
};

export default API_BASE_URL;
