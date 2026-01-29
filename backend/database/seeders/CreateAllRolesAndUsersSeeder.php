<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateAllRolesAndUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = [
            ['name' => 'admin', 'guard_name' => 'web'],
            ['name' => 'doctor', 'guard_name' => 'web'],
            ['name' => 'receptionist', 'guard_name' => 'web'],
            ['name' => 'pharmacist', 'guard_name' => 'web'],
            ['name' => 'patient', 'guard_name' => 'web'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role['name']],
                $role + ['created_at' => now(), 'updated_at' => now()]
            );
        }

        // Create users for each role
        $users = [
            [
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'username' => 'admin',
                'email' => 'admin@mediclinic.com',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ],
            [
                'first_name' => 'Dr. John',
                'last_name' => 'Smith',
                'username' => 'doctor',
                'email' => 'doctor@mediclinic.com',
                'password' => Hash::make('doctor123'),
                'role' => 'doctor',
            ],
            [
                'first_name' => 'Emily',
                'last_name' => 'Brown',
                'username' => 'receptionist',
                'email' => 'receptionist@mediclinic.com',
                'password' => Hash::make('receptionist123'),
                'role' => 'receptionist',
            ],
            [
                'first_name' => 'Mike',
                'last_name' => 'Wilson',
                'username' => 'pharmacist',
                'email' => 'pharmacist@mediclinic.com',
                'password' => Hash::make('pharmacist123'),
                'role' => 'pharmacist',
            ],
            [
                'first_name' => 'John',
                'last_name' => 'Wilson',
                'username' => 'patient',
                'email' => 'patient@mediclinic.com',
                'password' => Hash::make('patient123'),
                'role' => 'patient',
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']); // Remove role from user data array
            
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
            $user->assignRole($role);
            
            $this->command->info("Created {$role} user: {$userData['email']}");
        }

        $this->command->info('All roles and users created successfully!');
    }
}
