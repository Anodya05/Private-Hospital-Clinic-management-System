<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles; // Spatie Role trait
use App\Models\Role;
use App\Models\PatientProfile;
use App\Models\Clinic;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * Mass assignable attributes
     */
    protected $fillable = [
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
     * Boot method to handle auto-filling name and assigning Spatie role
     */
    protected static function booted(): void
    {
        // Auto-generate name if missing
        static::creating(function (User $user) {
            if (empty($user->name)) {
                $fallback = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
                $user->name = $fallback !== '' ? $fallback : ($user->username ?? 'User');
            }
        });

        static::updating(function (User $user) {
            if (array_key_exists('name', $user->getDirty()) && $user->name === null) {
                $fallback = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
                $user->name = $fallback !== '' ? $fallback : ($user->username ?? 'User');
            }
        });

        // Assign Spatie role automatically if role_id is set
        static::created(function (User $user) {
            if ($user->role_id && $user->roles->isEmpty()) {
                try {
                    $role = \Spatie\Permission\Models\Role::findById($user->role_id);
                    if ($role) {
                        $user->assignRole($role->name);
                        $user->refresh();
                    }
                } catch (\Exception $e) {
                    // Fail silently or log error
                    \Log::warning("Role assignment failed for user {$user->id}: " . $e->getMessage());
                }
            }
        });
    }

    /**
     * Role relationship (users.role_id → roles.id)
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
     * Combines first_name + last_name or falls back to username
     */
    public function getNameAttribute(): string
    {
        if (isset($this->attributes['name']) && $this->attributes['name'] !== null) {
            return (string)$this->attributes['name'];
        }

        $fullName = trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
        return $fullName !== '' ? $fullName : ($this->username ?? 'User');
    }
}
