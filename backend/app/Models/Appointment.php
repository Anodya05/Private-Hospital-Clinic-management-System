<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'department_id', // Added this so the Admin Panel can track departments
        'clinic_id',     // Kept this for your clinic logic
        'appointment_number',
        'appointment_date',
        'appointment_time',
        'type',
        'status',
        'confirmed_at',
        'is_walk_in',
        'reason',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'confirmed_at' => 'datetime',
        'is_walk_in' => 'boolean',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    // --- NEW: Added Department Relationship ---
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    // Kept your existing Clinic relationship
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }
}