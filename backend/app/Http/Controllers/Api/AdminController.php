<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Drug;
use App\Models\Department; // <--- Added this import
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class AdminController extends Controller
{
    // ==========================================
    // 1. USER MANAGEMENT
    // ==========================================

    public function getUsers()
    {
        $users = User::with('roles')->latest()->get()->map(function ($user) {
            $name = $user->name ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            
            return [
                'id' => $user->id,
                'name' => $name ?: 'User ' . $user->id,
                'email' => $user->email,
                'role' => $user->roles->first()->name ?? 'patient',
                'is_active' => $user->is_active,
                'created_at' => $user->created_at->format('Y-m-d'),
            ];
        });

        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8',
            'role' => 'required|exists:roles,name',
            'department_id' => 'nullable|integer',
        ]);

        $parts = explode(' ', trim($validated['name']), 2);
        $firstName = $parts[0];
        $lastName = $parts[1] ?? '';
        $username = strtolower($firstName . ($lastName ? '.' . $lastName : '')) . rand(10, 99);

        $userData = [
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'username' => $username,
            'is_active' => true,
            'department_id' => $validated['department_id'] ?? null,
        ];

        if (Schema::hasColumn('users', 'first_name')) {
            $userData['first_name'] = $firstName;
            $userData['last_name'] = $lastName;
        } else {
            $userData['name'] = $validated['name'];
        }

        $user = User::create($userData);
        $user->assignRole($validated['role']);

        return response()->json(['message' => 'User created successfully', 'user' => $user]);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'string',
            'email' => 'email|unique:users,email,' . $id,
            'role' => 'exists:roles,name',
        ]);

        if ($request->has('name')) {
            if (Schema::hasColumn('users', 'first_name')) {
                $parts = explode(' ', trim($validated['name']), 2);
                $user->first_name = $parts[0];
                $user->last_name = $parts[1] ?? '';
            } else {
                $user->name = $validated['name'];
            }
        }

        if ($request->has('email')) {
            $user->email = $validated['email'];
        }

        $user->save();

        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json(['message' => 'User updated successfully']);
    }

    public function toggleUserStatus($id)
    {
        $user = User::findOrFail($id);
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $status = $user->is_active ? 'activated' : 'deactivated';
        return response()->json(['message' => "User account $status."]);
    }

    // ==========================================
    // 2. REPORTING & ANALYTICS
    // ==========================================

    public function getDashboardStats()
    {
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $count = Appointment::whereDate('appointment_date', $date->format('Y-m-d'))->count();

            $chartData[] = [
                'name' => $date->format('D'),
                'patients' => $count
            ];
        }

        $totalUsers = User::count();
        $totalPatients = User::role('patient')->count();
        $totalDoctors = User::role('doctor')->count();
        $totalStaff = User::role(['pharmacist', 'receptionist'])->count();
        $totalDepartments = Department::count(); 

        return response()->json([
            'counts' => [
                'total_users' => $totalUsers,
                'total_doctors' => $totalDoctors,
                'total_patients' => $totalPatients,
                'total_staff' => $totalStaff,
                'total_departments' => $totalDepartments,
            ],
            'chart_data' => $chartData
        ]);
    }

    public function getDoctorPerformance()
    {
        $performance = Appointment::where('status', 'completed')
            ->select('doctor_id', DB::raw('count(*) as total_appointments'))
            ->with('doctor')
            ->groupBy('doctor_id')
            ->orderByDesc('total_appointments')
            ->take(5)
            ->get()
            ->map(function ($item) {
                return [
                    'doctor_name' => $item->doctor ? $item->doctor->name : 'Unknown Doctor',
                    'total_appointments' => $item->total_appointments
                ];
            });

        return response()->json($performance);
    }

    // ==========================================
    // 3. INVENTORY MANAGEMENT
    // ==========================================

    public function getInventory()
    {
        $inventory = Drug::select('id', 'name', 'stock_quantity', 'expiry_date')
            ->orderBy('stock_quantity', 'asc')
            ->get()
            ->map(function($drug) {
                return [
                    'id' => $drug->id,
                    'name' => $drug->name,
                    'stock' => $drug->stock_quantity,
                    'status' => $drug->stock_quantity < 10 ? 'Low Stock' : 'In Stock',
                    'expiry' => $drug->expiry_date
                ];
            });

        return response()->json($inventory);
    }

    public function addDrug(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'stock_quantity' => 'required|integer|min:0',
            'expiry_date' => 'required|date',
        ]);

        $drug = Drug::create([
            'name' => $validated['name'],
            'stock_quantity' => $validated['stock_quantity'],
            'expiry_date' => $validated['expiry_date']
        ]);

        return response()->json(['message' => 'Medicine added successfully', 'drug' => $drug]);
    }

    public function updateDrug(Request $request, $id)
    {
        $drug = Drug::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string',
            'stock_quantity' => 'required|integer|min:0',
            'expiry_date' => 'required|date',
        ]);

        $drug->update([
            'name' => $validated['name'],
            'stock_quantity' => $validated['stock_quantity'],
            'expiry_date' => $validated['expiry_date'],
            'status' => $validated['stock_quantity'] < 10 ? 'Low Stock' : 'In Stock'
        ]);

        return response()->json(['message' => 'Medicine updated successfully', 'drug' => $drug]);
    }

    public function deleteDrug($id)
    {
        $drug = Drug::findOrFail($id);
        $drug->delete();
        return response()->json(['message' => 'Medicine deleted successfully']);
    }

    // ==========================================
    // 4. DEPARTMENT MANAGEMENT
    // ==========================================

    public function getDepartments()
    {
        $departments = Department::with('doctors')->get()->map(function($dept) {
            return [
                'id' => $dept->id,
                'name' => $dept->name,
                'description' => $dept->description,
                'status' => $dept->status,
                'doctor_count' => $dept->doctors->count(),
                'doctors' => $dept->doctors->map(function($doc) {
                    return [
                        'id' => $doc->id,
                        'name' => $doc->name ?? $doc->first_name . ' ' . $doc->last_name,
                    ];
                })
            ];
        });

        return response()->json($departments);
    }

    public function addDepartment(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:departments',
            'description' => 'nullable|string',
        ]);

        $dept = Department::create($validated);
        return response()->json(['message' => 'Department created', 'department' => $dept]);
    }

    // ==========================================
    // 5. APPOINTMENT MANAGEMENT
    // ==========================================

    public function getAppointments()
    {
        $appointments = Appointment::with(['patient', 'doctor', 'department'])
            ->orderBy('appointment_date', 'desc')
            ->get()
            ->map(function ($appt) {
                return [
                    'id' => $appt->id,
                    'patient_name' => $appt->patient->name ?? 'Unknown',
                    'doctor_name' => $appt->doctor->name ?? 'Unknown',
                    'department' => $appt->department->name ?? 'General',
                    'date' => $appt->appointment_date,
                    'status' => $appt->status,
                    'reason' => $appt->reason,
                ];
            });

        return response()->json($appointments);
    }

    public function deleteAppointment($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();
        return response()->json(['message' => 'Appointment deleted successfully']);
    }
}