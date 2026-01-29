<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role as SpatieRole;
use Spatie\Permission\PermissionRegistrar;

class AuthController extends Controller
{
    /**
     * Patient-only registration
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'date_of_birth' => ['nullable', 'date'],
            'phone' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'blood_type' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'guardian_name' => ['nullable', 'string', 'max:255'],
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'guardian_phone' => ['nullable', 'string', 'max:20'],
            'guardian_relationship' => ['nullable', 'string', 'max:100'],
        ]);

        $roleName = 'patient';

        // Split full name into first and last
        $fullName = trim($data['name']);
        $parts = preg_split('/\s+/', $fullName) ?: [];
        $firstName = $parts[0] ?? $fullName;
        $lastName = count($parts) > 1 ? trim(implode(' ', array_slice($parts, 1))) : 'Patient';

        // Generate unique username
        $usernameBase = Str::slug($firstName . ' ' . $lastName, '');
        if ($usernameBase === '') {
            $usernameBase = 'user';
        }
        $username = $usernameBase;
        $suffix = 1;
        while (User::where('username', $username)->exists()) {
            $username = $usernameBase . $suffix;
            $suffix++;
        }

        // Build user data
        $userData = [
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'username' => $username,
        ];

        if (Schema::hasColumn('users', 'name')) {
            $userData['name'] = $data['name'];
        } else {
            $userData['first_name'] = $firstName;
            $userData['last_name'] = $lastName;
        }

        $user = User::create($userData);

        // Create patient profile
        PatientProfile::create([
            'user_id' => $user->id,
            'phone' => $data['phone'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'address' => $data['address'] ?? null,
            'blood_type' => $data['blood_type'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'guardian_name' => $data['guardian_name'] ?? null,
            'guardian_email' => $data['guardian_email'] ?? null,
            'guardian_phone' => $data['guardian_phone'] ?? null,
            'guardian_relationship' => $data['guardian_relationship'] ?? null,
        ]);

        // Assign role and clear Spatie cache
        SpatieRole::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        $user->assignRole($roleName);

        $token = $user->createToken('auth_token')->plainTextToken;

        Log::info('Registration successful', ['id' => $user->id, 'email' => $user->email]);

        return response()->json([
            'message' => 'Registration successful',
            'token' => $token,
            'user' => $this->formatUserData($user),
        ], 201);
    }

    /**
     * Login with self-healing
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['login'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Invalid credentials'],
            ]);
        }

        // Auto-assign role if missing
        if ($user->getRoleNames()->isEmpty()) {
            Log::warning("User {$user->email} has no roles. Auto-assigning 'patient'.");
            app()[PermissionRegistrar::class]->forgetCachedPermissions();
            SpatieRole::firstOrCreate(['name' => 'patient', 'guard_name' => 'web']);
            $user->assignRole('patient');
            $user = $user->fresh();
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $this->formatUserData($user),
        ]);
    }

    /**
     * Return logged-in user data
     */
    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => $this->formatUserData($user),
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()?->tokens()->delete();

        return response()->json([
            'message' => 'Logged out',
        ]);
    }

    /**
     * Format user data consistently
     */
    private function formatUserData($user)
    {
        $user->load('role');

        $roleName = 'patient';
        if ($user->role) {
            $roleName = $user->role->name;
        } elseif ($user->roles && $user->roles->first()) {
            $roleName = $user->roles->first()->name;
        }

        return [
            'id' => $user->id,
            'first_name' => $user->first_name ?? $user->name,
            'last_name' => $user->last_name ?? '',
            'name' => $user->name ?? ($user->first_name . ' ' . $user->last_name),
            'username' => $user->username,
            'email' => $user->email,
            'role' => $roleName,
        ];
    }
}
