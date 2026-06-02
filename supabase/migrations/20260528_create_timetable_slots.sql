-- Create timetable_slots table
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT,
  teacher TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on timetable_slots table
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own timetable slots" ON timetable_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own timetable slots" ON timetable_slots FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create their own timetable slots" ON timetable_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own timetable slots" ON timetable_slots FOR DELETE USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_timetable_slots_user_id ON timetable_slots(user_id);