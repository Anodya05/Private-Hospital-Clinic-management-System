<?php

namespace Database\Seeders;

use App\Models\Clinic;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ClinicSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $clinics = [
            'General Medicine Clinic',
            'Cardiology Clinic',
            'Orthopedic Clinic',
            'Obstetrics & Gynecology (OB-GYN) Clinic',
            'Pediatrics Clinic',
            'General Surgery Clinic',
            'Dermatology Clinic',
            'ENT (Ear, Nose & Throat) Clinic',
            'Ophthalmology (Eye) Clinic',
            'Neurology Clinic',
        ];

        foreach ($clinics as $name) {
            Clinic::updateOrCreate(
                ['name' => $name],
                ['name' => $name]
            );
        }
    }
}
