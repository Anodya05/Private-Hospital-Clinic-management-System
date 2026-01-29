<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\QueueEntry;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DoctorQueueController extends Controller
{
    /**
     * Get queue entries for the authenticated doctor.
     */
    public function index(Request $request)
    {
        $doctor = $request->user();
        $date = $request->get('date') ?: now()->toDateString();

        $query = QueueEntry::query()
            ->where(function ($q) use ($doctor) {
                $q->where('doctor_id', $doctor->id)
                  ->orWhereHas('appointment', function ($aq) use ($doctor) {
                      $aq->where('doctor_id', $doctor->id);
                  });
            })
            ->whereDate('queue_date', $date)
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'patient.patientProfile',
                'appointment',
            ])
            ->orderBy('queue_number');

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        $entries = $query->get();

        // Also get scheduled appointments not yet checked-in
        $appointmentIdsInQueue = $entries->pluck('appointment_id')->filter()->unique()->toArray();

        $appointmentsQuery = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $date)
            ->with([
                'patient:id,first_name,last_name,email,username,is_active',
                'patient.patientProfile',
            ])
            ->orderBy('appointment_time');

        if (!empty($appointmentIdsInQueue)) {
            $appointmentsQuery->whereNotIn('id', $appointmentIdsInQueue);
        }

        $appointments = $appointmentsQuery->get();

        // Transform appointments into queue-like items (not yet checked in)
        $appointmentItems = $appointments->map(function ($a) {
            return (object) [
                'id' => 'appt_' . $a->id,
                'queue_number' => null,
                'queue_date' => $a->appointment_date,
                'patient' => $a->patient ?? null,
                'doctor' => null,
                'status' => $a->status ?? 'scheduled',
                'appointment' => $a,
                'checked_in' => false,
            ];
        });

        // Merge checked-in entries first, then scheduled appointments
        $combined = $entries->map(function ($e) {
            $e->checked_in = true;
            return $e;
        })->merge($appointmentItems);

        return response()->json([
            'data' => $combined->values()->all(),
        ]);
    }

    /**
     * Update the status of a queue entry (e.g., start consultation, complete).
     */
    public function updateStatus(Request $request, int $id)
    {
        $doctor = $request->user();

        $entry = QueueEntry::query()
            ->where(function ($q) use ($doctor) {
                $q->where('doctor_id', $doctor->id)
                  ->orWhereHas('appointment', function ($aq) use ($doctor) {
                      $aq->where('doctor_id', $doctor->id);
                  });
            })
            ->findOrFail($id);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['waiting', 'in_progress', 'in_consultation', 'completed', 'cancelled', 'no_show'])],
        ]);

        $entry->status = $validated['status'];

        if (in_array($validated['status'], ['in_consultation', 'in_progress'])) {
            $entry->consultation_started_at = now();
            $entry->called_at = now();
        }

        if ($validated['status'] === 'completed') {
            $entry->checked_out_at = now();
            $entry->completed_at = now();
        }

        $entry->save();

        return response()->json($entry->fresh()->load(['patient', 'appointment']));
    }

    /**
     * Get the next patient in queue for this doctor.
     */
    public function next(Request $request)
    {
        $doctor = $request->user();
        $date = $request->get('date') ?: now()->toDateString();

        $entry = QueueEntry::query()
            ->where(function ($q) use ($doctor) {
                $q->where('doctor_id', $doctor->id)
                  ->orWhereHas('appointment', function ($aq) use ($doctor) {
                      $aq->where('doctor_id', $doctor->id);
                  });
            })
            ->whereDate('queue_date', $date)
            ->where('status', 'waiting')
            ->orderBy('queue_number')
            ->with(['patient', 'patient.patientProfile', 'appointment'])
            ->first();

        if (!$entry) {
            return response()->json(['message' => 'No patients waiting in queue.'], 404);
        }

        return response()->json($entry);
    }

    /**
     * Call the next patient (set status to in_consultation).
     */
    public function callNext(Request $request)
    {
        $doctor = $request->user();
        $date = $request->get('date') ?: now()->toDateString();

        $entry = QueueEntry::query()
            ->where(function ($q) use ($doctor) {
                $q->where('doctor_id', $doctor->id)
                  ->orWhereHas('appointment', function ($aq) use ($doctor) {
                      $aq->where('doctor_id', $doctor->id);
                  });
            })
            ->whereDate('queue_date', $date)
            ->where('status', 'waiting')
            ->orderBy('queue_number')
            ->first();

        if (!$entry) {
            return response()->json(['message' => 'No patients waiting in queue.'], 404);
        }

        $entry->status = 'in_consultation';
        $entry->consultation_started_at = now();
        $entry->called_at = now();
        $entry->save();

        return response()->json($entry->fresh()->load(['patient', 'patient.patientProfile', 'appointment']));
    }
}
