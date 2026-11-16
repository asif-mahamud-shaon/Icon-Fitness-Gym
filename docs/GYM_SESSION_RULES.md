# 16. Gender-Based Gym Session Rules & Ladies-Only Policy

> Strict `Asia/Dhaka` (`UTC+06:00`) timetable rules, Male vs. Female Session eligibility, and mandatory Female Trainer presence verification.

---

## 16.1 Official Ashkona Timetable (`Asia/Dhaka`)

Resolved via `backend/src/modules/access-control/timezone.util.ts` and seeded across all `7` days of the week:

| Session Window                  | Days      | Time (`Asia/Dhaka`)            | `GymSessionType` | Eligibility Policy                                          |
| :------------------------------ | :-------- | :----------------------------- | :--------------- | :---------------------------------------------------------- |
| **Morning & Midday General**    | Sat – Thu | `07:00 AM – 01:00 PM` (`07:00–13:00`) | `MALE_SESSION`   | Active Male & Female Members                                |
| **Dedicated Ladies-Only Slot**  | Sat – Thu | `01:00 PM – 03:30 PM` (`13:00–15:30`) | `FEMALE_SESSION` | **Female Members only** + checked-in Female Trainer req.    |
| **Afternoon & Evening General** | Sat – Thu | `03:30 PM – 11:00 PM` (`15:30–23:00`) | `MALE_SESSION`   | Active Male & Female Members                                |
| **Friday Evening Session**      | Friday    | `05:00 PM – 11:00 PM` (`17:00–23:00`) | `MALE_SESSION`   | Active Male & Female Members                                |

---

## 16.2 Session Enforcement Rules

### Dedicated Ladies-Only Session (`FEMALE_SESSION` — `01:00 PM – 03:30 PM`)
- **Female Members (`gender: FEMALE`):** Permitted to enter when holding an active, `VERIFIED_PAID` membership.
- **Male Members (`gender: MALE`):** **Strictly denied (`FEMALE_SESSION_RESTRICTED`)** at all times during Ladies-Only hours regardless of membership or facial match.
- **Mandatory Physical Female Trainer Check-In:**
  - Male trainers cannot be assigned to `FEMALE_SESSION`.
  - Schedule assignment (`SessionTrainerAssignment`) alone **never** unlocks Ladies-Only entry.
  - The assigned Female Trainer (or female replacement) must hold a live `TrainerAttendance` record for today's Dhaka date with `status` in `['PRESENT', 'LATE']`, `checkedInAt !== null`, and `checkedOutAt === null`.
  - Otherwise, entry is denied (`FEMALE_TRAINER_UNAVAILABLE`) and a critical operational alert appears in `/admin/access-control`.

### General Sessions (`MALE_SESSION`)
- Both **Male** and **Female** members (`allowFemaleInMaleSession: true`) with active verified-paid memberships may enter.

---

## 16.3 Overlap Prevention & Holiday Overrides
- Same-day session windows are validated via `doTimeWindowsOverlap` unless an Admin explicitly passes `allowOverlap: true`.
- Eid holidays, maintenance closures, and modified hours are configured via `GymSessionException` (`isGymClosed: true` returns `OUTSIDE_OPERATING_SESSION`).

---

← [15. Face Recognition Integration](./FACE_RECOGNITION_INTEGRATION.md) · Next: [17. Hardware Setup Guide →](./HARDWARE_SETUP_GUIDE.md)
