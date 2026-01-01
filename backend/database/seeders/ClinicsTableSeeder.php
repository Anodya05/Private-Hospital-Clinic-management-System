<?php

namespace Database\Seeders;

use App\Models\Clinic;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClinicsTableSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clinics = [
            'OPD',
            'Pediatrics',
            'Obstetrics & Gynecology',
            'Dental Clinic',
            'Cardiology',
            'Orthopedics',
            'Dermatology',
            'Ophthalmology',
        ];

        foreach ($clinics as $name) {
            Clinic::updateOrCreate(
                ['name' => $name],
                ['department_type' => strtolower(preg_replace('/[^a-z0-9]+/i', '_', $name)), 'location' => null]
            );
        }
    }
}
