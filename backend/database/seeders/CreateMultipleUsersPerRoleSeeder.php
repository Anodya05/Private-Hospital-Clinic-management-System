<?php

namespace Database\Seeders;

use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role as SpatieRole;

class CreateMultipleUsersPerRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'doctor', 'receptionist', 'pharmacist', 'patient'];

        // ensure roles exist for both guards
        foreach ($roles as $r) {
            SpatieRole::findOrCreate($r, 'web');
            SpatieRole::findOrCreate($r, 'sanctum');
        }

        foreach ($roles as $role) {
            for ($i = 1; $i <= 5; $i++) {
                $user = User::factory()->create();

                // ensure unique and indicative username/email
                $user->username = Str::slug($role . $user->id . Str::random(3), '_');
                $user->email = $role . '.' . $user->username . '@mediclinic.local';
                $user->password = Hash::make('password');

                // attach role_id if roles table is used
                $roleModel = SpatieRole::where('name', $role)->first();
                if ($roleModel) {
                    $user->role_id = $roleModel->id;
                }

                $user->save();

                $user->assignRole($role);

                // If patient, create a patient profile
                if ($role === 'patient') {
                    // Patient ID sequence: next available
                    $last = PatientProfile::query()->whereNotNull('patient_id')
                        ->orderByRaw("patient_id::int DESC")
                        ->first();
                    $next = 1;
                    if ($last && $last->patient_id) {
                        $next = ((int) $last->patient_id) + 1;
                    }
                    $patientId = str_pad($next, 3, '0', STR_PAD_LEFT);

                    PatientProfile::create([
                        'user_id' => $user->id,
                        'patient_id' => $patientId,
                        'phone' => '07' . rand(10000000, 99999999),
                        'age' => rand(18, 75),
                    ]);
                }
            }
        }

        $this->command->info('Created 5 users for each role.');
    }
}
