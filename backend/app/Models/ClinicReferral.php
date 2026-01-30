<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClinicReferral extends Model
{
    use HasFactory;

    protected $table = 'clinic_referrals';

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'clinic_id',
        'reason',
        'priority',
        'status',
        'preferred_appointment_date',
        'notes',
    ];

    protected $casts = [
        'preferred_appointment_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the patient that owns the clinic referral.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the doctor that created the clinic referral.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    /**
     * Get the clinic that the patient is referred to.
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }
}