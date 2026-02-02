<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PatientProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role as SpatieRole;

class DoctorPatientController extends Controller
{
    public function store(Request $request)
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8'],
            'date_of_birth' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:50'],
            'gender' => ['nullable', 'string', 'max:50'],
            'blood_type' => ['nullable', 'string', 'max:5'],
            'address' => ['nullable', 'string', 'max:1000'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:50'],
        ]);

        // Build name / first/last mapping similar to other registration flows
        $fullName = trim($validated['name']);
        $parts = preg_split('/\s+/', $fullName) ?: [];
        $firstName = $parts[0] ?? $fullName;
        $lastName = count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : '';

        $usernameBase = Str::slug($firstName . ' ' . $lastName, '');
        if ($usernameBase === '') {
            $usernameBase = explode('@', $validated['email'])[0] ?? 'user';
        }
        $username = $usernameBase;
        $suffix = 1;
        while (User::where('username', $username)->exists()) {
            $username = $usernameBase . $suffix;
            $suffix++;
        }

        $password = $validated['password'] ?? Str::random(12);

        $userData = [
            'email' => $validated['email'],
            'password' => Hash::make($password),
        ];

        if (Schema::hasColumn('users', 'name')) {
            $userData['name'] = $fullName;
        } else {
            $userData['first_name'] = $firstName;
            $userData['last_name'] = $lastName ?: 'Patient';
            $userData['username'] = $username;
        }

        $createdUser = null;

        DB::transaction(function () use (&$createdUser, $userData, $validated, $password) {
            $createdUser = User::create($userData);

            SpatieRole::findOrCreate('patient', 'web');
            $createdUser->assignRole('patient');

            $driver = DB::connection()->getDriverName();
            $lastPatientQuery = PatientProfile::query()->whereNotNull('patient_id');

            if ($driver === 'pgsql') {
                $lastPatientQuery
                    ->whereRaw("patient_id ~ '^[0-9]+$")
                    ->orderByRaw('patient_id::int DESC');
            } else {
                $lastPatientQuery->orderByRaw('CAST(patient_id AS UNSIGNED) DESC');
            }

            $lastPatient = $lastPatientQuery->lockForUpdate()->first();
            $nextPatientId = $lastPatient && $lastPatient->patient_id
                ? ((int) $lastPatient->patient_id) + 1
                : 1;

            $patientId = str_pad((string) $nextPatientId, 3, '0', STR_PAD_LEFT);

            $profileData = array_filter([
                'patient_id' => $patientId,
                'phone' => $validated['phone'] ?? null,
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'address' => $validated['address'] ?? null,
                'blood_type' => $validated['blood_type'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
            ], static fn ($value) => $value !== null);

            PatientProfile::updateOrCreate(
                ['user_id' => $createdUser->id],
                $profileData
            );
        });

        $createdUser = $createdUser?->fresh(['patientProfile']);
        if ($createdUser) {
            $createdUser->makeHidden(['password']);
        }

        return response()->json([
            'user' => $createdUser,
            'generated_password' => $password,
        ], 201);
    }
}
