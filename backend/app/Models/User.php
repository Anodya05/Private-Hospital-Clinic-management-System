<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Models\Role;
use App\Models\PatientProfile;
use App\Models\Clinic;
use App\Models\Prescription;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        // 'name', // Removed because your DB likely doesn't have this column
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'role_id',
        'is_active',
        'clinic_id',
        'department_id', // Added this so you can assign departments
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the role associated with the user (via role_id).
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the patient profile associated with the user.
     */
    public function patientProfile(): HasOne
    {
        return $this->hasOne(PatientProfile::class, 'user_id');
    }

    /**
     * Get the clinic associated with the user.
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }

    /**
     * Get prescriptions where the user is the patient.
     */
    public function prescriptionsAsPatient(): HasMany
    {
        return $this->hasMany(Prescription::class, 'patient_id');
    }

    /**
     * Virtual Attribute: 'name'
     * Allows you to call $user->name even though the column doesn't exist.
     */
    public function getNameAttribute(): string
    {
        // If the database actually HAS a name column, use it.
        if (isset($this->attributes['name']) && $this->attributes['name'] !== null) {
            return (string) $this->attributes['name'];
        }

        // Otherwise, combine first and last name
        $full = trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
        
        // If both are empty, fall back to username
        return $full === '' ? ($this->username ?? 'User') : $full;
    }
}