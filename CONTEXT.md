# SATI Sports Hall

A booking platform for the Sports Hall at Samrat Ashok Technological Institute (SATI), Vidisha. Students and faculty reserve hourly slots for Badminton Court, Table Tennis Table, and Cricket Net.

## Language

### People

**Student**:
A current student of SATI identified by a unique Scholar Number.
_Avoid_: user, member (when role-specific)

**Faculty**:
A staff member of SATI identified by a unique Employee/Faculty ID. Book and play the same facilities as students.
_Avoid_: staff member

**Hall Coordinator (Admin)**:
Staff who manage the hall: view every booking, filter, and cancel on behalf of others. Not visible to students or faculty.
_Avoid_: superuser, manager

**Member**:
A user who can book (Student or Faculty); the general term when the role doesn't matter.

### Facilities

**Facility**:
One of the three bookable resources: Badminton Court, Table Tennis Table, Cricket Net.
_Avoid_: sport, venue, resource

**Sport** / **sport_id**:
Used loosely as a synonym for Facility in the code; records reference a Sport.

### Time

**Slot**:
A one-hour, non-overlapping booking window aligned to the hour, within the hall's open times (07:00–10:00 and 15:00–20:00 IST).
_Avoid_: appointment, session

**Booking Window**:
The span of wall-clock time a member may book ahead. Slots in the past or outside the open hours can never be booked.

**Wall-clock (IST)**:
Dates and times are stored without timezone; they only ever mean Asia/Kolkata local time. This avoids timezone calculation bugs on request boundaries.

### Booking lifecycle

**Booking**:
A member's reservation of one facility for one hour on one date. Has status confirmed → cancelled or completed.
_Avoid_: reservation, entry

**confirmed**: A live booking that is on the calendar and holds the slot.
**cancelled**: A booking the member (or admin) cancelled; the slot is immediately released and bookable again.
**completed**: A booking whose start time has passed; it no longer holds the slot and no longer counts as upcoming.

**Double-booking**:
Two confirmed bookings for the same facility on the same date at the same starting hour. Prevented at the database level, never only in the UI.

**Overlap**:
Two confirmed bookings for the same member whose time ranges intersect (any facility). Also prevented at the database level.

## Domain rules (non-negotiable)

1. Slots are exactly 1 hour, aligned to the hour.
2. Valid slots: 07:00, 08:00, 09:00, 15:00, 16:00, 17:00, 18:00, 19:00 IST.
3. Only future slots within the Booking Window (next 24 hours from now IST) are bookable.
4. A facility/time cannot be double-booked.
5. A member cannot have overlapping bookings.
6. Cancelling a confirmed booking releases its slot immediately.