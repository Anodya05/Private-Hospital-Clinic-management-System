<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Auth Controller ---
use App\Http\Controllers\AuthController;

// --- Admin Controller ---
use App\Http\Controllers\Api\AdminController;

// --- Other API Controllers ---
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\DrugPurchaseController;
use App\Http\Controllers\Api\PatientAppointmentController;
use App\Http\Controllers\Api\PatientBillingController;
use App\Http\Controllers\Api\PatientEhrController;
use App\Http\Controllers\Api\PatientFeedbackController;
use App\Http\Controllers\Api\PatientNotificationController;
use App\Http\Controllers\Api\PatientProfileController;
use App\Http\Controllers\Api\PatientPrescriptionController;
use App\Http\Controllers\Api\PatientTeleconsultationController;
use App\Http\Controllers\Api\ReceptionistAppointmentController;
use App\Http\Controllers\Api\ReceptionistDashboardController;
use App\Http\Controllers\Api\ReceptionistDoctorController;
use App\Http\Controllers\Api\ReceptionistDoctorScheduleController;
use App\Http\Controllers\Api\ReceptionistInvoiceController;
use App\Http\Controllers\Api\ReceptionistPatientController;
use App\Http\Controllers\Api\ReceptionistPaymentController;
use App\Http\Controllers\Api\ReceptionistQueueController;
use App\Http\Controllers\Api\ReceptionistReferralController;
use App\Http\Controllers\Api\DoctorAppointmentController;
use App\Http\Controllers\Api\DoctorTeleconsultationController;
use App\Http\Controllers\Api\DoctorEhrController;
use App\Http\Controllers\Api\DoctorVitalSignController;
use App\Http\Controllers\Api\DoctorDiagnosisController;
use App\Http\Controllers\Api\DoctorPrescriptionController;
use App\Http\Controllers\Api\DoctorLabController;
use App\Http\Controllers\Api\DoctorReferralController;
use App\Http\Controllers\Api\DoctorPatientController;
use App\Http\Controllers\Api\ClinicController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ============================
// AUTH ROUTES
// ============================
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// ============================
// ADMIN ROUTES
// ============================
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::patch('/users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);

    Route::get('/stats', [AdminController::class, 'getDashboardStats']);
    Route::get('/doctor-performance', [AdminController::class, 'getDoctorPerformance']);

    Route::get('/inventory', [AdminController::class, 'getInventory']);
    Route::post('/inventory', [AdminController::class, 'addDrug']);
    Route::put('/inventory/{id}', [AdminController::class, 'updateDrug']);
    Route::delete('/inventory/{id}', [AdminController::class, 'deleteDrug']);
});

// ============================
// PHARMACIST ROUTES
// ============================
Route::middleware(['auth:sanctum', 'role:pharmacist'])->prefix('pharmacist')->group(function () {
    // Prescriptions
    Route::get('prescriptions', [PrescriptionController::class, 'index']);
    Route::get('prescriptions/{id}', [PrescriptionController::class, 'show']);
    Route::post('prescriptions/{id}/interaction-check', [PrescriptionController::class, 'checkInteractions']);
    Route::post('prescriptions/{id}/dispense', [PrescriptionController::class, 'dispense']);
    
    // Inventory
    Route::get('inventory', [InventoryController::class, 'index']);
    Route::post('inventory', [InventoryController::class, 'store']);
    Route::get('inventory/{id}', [InventoryController::class, 'show']);
    Route::put('inventory/{id}', [InventoryController::class, 'update']);
    Route::delete('inventory/{id}', [InventoryController::class, 'destroy']);
    Route::get('inventory/low-stock', [InventoryController::class, 'lowStock']);
    Route::get('inventory/expiring-soon', [InventoryController::class, 'expiringSoon']);
    Route::get('inventory/stats', [InventoryController::class, 'stats']);
    Route::post('purchase-request', [InventoryController::class, 'createPurchaseRequest']);

    // Controlled Substances
    Route::get('controlled-drugs', [InventoryController::class, 'controlledDrugs']);
    Route::post('controlled-drugs/log', [InventoryController::class, 'logControlledDrug']);

    // Labels
    Route::post('labels/generate', [PrescriptionController::class, 'generateLabel']);
    Route::post('labels/print', [PrescriptionController::class, 'printLabel']);
});

// ============================
// PATIENT ROUTES
// ============================
Route::middleware(['auth:sanctum', 'role:patient'])->prefix('patient')->group(function () {
    Route::get('profile', [PatientProfileController::class, 'show']);
    Route::put('profile', [PatientProfileController::class, 'update']);
    Route::get('appointments', [PatientAppointmentController::class, 'index']);
    Route::post('appointments', [PatientAppointmentController::class, 'store']);
    Route::get('appointments/{id}', [PatientAppointmentController::class, 'show']);
    Route::put('appointments/{id}', [PatientAppointmentController::class, 'update']);
    Route::delete('appointments/{id}', [PatientAppointmentController::class, 'destroy']);
    Route::get('teleconsultations', [PatientTeleconsultationController::class, 'index']);
    Route::get('ehr', [PatientEhrController::class, 'index']);
    Route::get('invoices', [PatientBillingController::class, 'invoices']);
    Route::post('payments', [PatientBillingController::class, 'pay']);
    Route::get('feedback', [PatientFeedbackController::class, 'index']);
    Route::post('feedback', [PatientFeedbackController::class, 'store']);
    Route::get('notifications', [PatientNotificationController::class, 'index']);
    Route::get('prescriptions', [PatientPrescriptionController::class, 'index']);
    Route::get('prescriptions/{id}', [PatientPrescriptionController::class, 'show']);
});

// ============================
// RECEPTIONIST ROUTES
// ============================
Route::middleware(['auth:sanctum', 'role:receptionist'])->prefix('receptionist')->group(function () {
    Route::get('dashboard/stats', [ReceptionistDashboardController::class, 'stats']);
    Route::get('patients', [ReceptionistPatientController::class, 'index']);
    Route::post('patients', [ReceptionistPatientController::class, 'store']);
    Route::post('patients/generate-random', [ReceptionistPatientController::class, 'generateRandom']);
    Route::get('patients/{id}', [ReceptionistPatientController::class, 'show']);
    Route::put('patients/{id}', [ReceptionistPatientController::class, 'update']);
    Route::delete('patients/{id}', [ReceptionistPatientController::class, 'destroy']);
});

// ============================
// DOCTOR ROUTES
// ============================
Route::middleware(['auth:sanctum', 'role:doctor'])->prefix('doctor')->group(function () {
    Route::get('appointments', [DoctorAppointmentController::class, 'index']);
    Route::get('appointments/{id}', [DoctorAppointmentController::class, 'show']);
    Route::put('appointments/{id}/status', [DoctorAppointmentController::class, 'updateStatus']);
    Route::post('teleconsultations/start', [DoctorTeleconsultationController::class, 'start']);
    Route::post('teleconsultations/{id}/end', [DoctorTeleconsultationController::class, 'end']);
});
