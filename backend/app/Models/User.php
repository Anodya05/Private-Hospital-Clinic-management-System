<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles; // Important: Spatie Role trait
use App\Models\Role;
use App\Models\PatientProfile;
use App\Models\Clinic;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * Auto-generate name if not provided
     */
    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->name)) {
                $fallback = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
                if ($fallback === '') {
                    $fallback = $user->username ?? 'user';
                }
                $user->name = $fallback;
            }
        });

        static::updating(function (User $user) {
            if (array_key_exists('name', $user->getDirty()) && $user->name === null) {
                $fallback = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
                if ($fallback === '') {
                    $fallback = $user->username ?? 'user';
                }
                $user->name = $fallback;
            }
        });

        // Ensure role assignment on creation if role_id exists
        static::created(function (User $user) {
            if ($user->role_id && $user->roles->isEmpty()) {
                $role = \Spatie\Permission\Models\Role::findById($user->role_id);
                if ($role) {
                    $user->assignRole($role->name);
                    $user->refresh();
                }
            }
        });
    }

    /**
     * Mass assignable attributes
     */
    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'role_id',
        'is_active',
        'clinic_id',
        'department_id',
    ];

    /**
     * Hidden attributes
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Attribute casting
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    /**
     * Role relationship (users.role_id → roles.id)
     * Note: This is your custom role relation; Spatie uses roles() plural.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Patient profile relationship
     */
    public function patientProfile(): HasOne
    {
        return $this->hasOne(PatientProfile::class, 'user_id');
    }

    /**
     * Clinic relationship
     */
    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class, 'clinic_id');
    }

    /**
     * Safe name accessor
     */
    public function getNameAttribute(): string
    {
        if (!empty($this->attributes['name'])) {
            return (string) $this->attributes['name'];
        }

        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
    }
}
