<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clinic;
use App\Models\User;
use Illuminate\Http\Request;

class ClinicController extends Controller
{
    public function index()
    {
        $clinics = Clinic::query()->orderBy('name')->get();

        return response()->json(['data' => $clinics]);
    }

    public function doctors(Request $request, int $id)
    {
        $clinic = Clinic::findOrFail($id);

        // Return users in this clinic who have the doctor role
        $doctors = User::query()
            ->where('clinic_id', $clinic->id)
            ->whereHas('roles', function ($q) {
                $q->where('name', 'doctor');
            })
            ->select(['id', 'first_name', 'last_name', 'email'])
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? '')),
                    'email' => $u->email,
                ];
            });

        return response()->json(['data' => $doctors]);
    }
}
