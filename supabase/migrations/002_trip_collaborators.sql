-- ─── Trip Collaborators ───────────────────────────────────────────────────────
-- Allows trip owners to invite others by email.
-- The invitee visits /trips/[id]/join?token=xxx after signing up/logging in.

CREATE TABLE IF NOT EXISTS trip_collaborators (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role          TEXT NOT NULL DEFAULT 'editor',   -- 'editor' | 'viewer'
  join_token    TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'active'
  invited_by    UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trip_id, invited_email)
);

ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;

-- Trip owner can manage all collaborators on their trips
CREATE POLICY "owner_manage_collaborators" ON trip_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips WHERE trips.id = trip_id AND trips.user_id = auth.uid()
    )
  );

-- Collaborator can see their own invite row (to accept it)
CREATE POLICY "self_view_invite" ON trip_collaborators
  FOR SELECT USING (
    user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Collaborator can update their own row (to set status = 'active')
CREATE POLICY "self_accept_invite" ON trip_collaborators
  FOR UPDATE USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ─── Allow collaborators to read the trip ─────────────────────────────────────
-- NOTE: Add this policy to your trips table if it has RLS.
-- If you don't have RLS on trips yet, skip this block.

-- Allow collaborator to read a trip they've accepted
CREATE POLICY "collaborator_read_trip" ON trips
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM trip_collaborators
      WHERE trip_collaborators.trip_id = trips.id
        AND trip_collaborators.user_id = auth.uid()
        AND trip_collaborators.status = 'active'
    )
  );

-- Allow collaborator to read itinerary_days
CREATE POLICY "collaborator_read_days" ON itinerary_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = itinerary_days.trip_id
        AND (
          trips.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_collaborators.trip_id = trips.id
              AND trip_collaborators.user_id = auth.uid()
              AND trip_collaborators.status = 'active'
          )
        )
    )
  );

-- Allow collaborator to read activities
CREATE POLICY "collaborator_read_activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM itinerary_days
      JOIN trips ON trips.id = itinerary_days.trip_id
      WHERE itinerary_days.id = activities.day_id
        AND (
          trips.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_collaborators.trip_id = trips.id
              AND trip_collaborators.user_id = auth.uid()
              AND trip_collaborators.status = 'active'
          )
        )
    )
  );

-- Allow collaborator (editor role) to edit activities
CREATE POLICY "collaborator_edit_activities" ON activities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM itinerary_days
      JOIN trips ON trips.id = itinerary_days.trip_id
      LEFT JOIN trip_collaborators tc ON tc.trip_id = trips.id AND tc.user_id = auth.uid()
      WHERE itinerary_days.id = activities.day_id
        AND (trips.user_id = auth.uid() OR (tc.status = 'active' AND tc.role = 'editor'))
    )
  );
