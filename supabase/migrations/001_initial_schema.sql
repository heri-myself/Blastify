-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- sender_phones
CREATE TABLE sender_phones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  display_name text,
  status text NOT NULL DEFAULT 'warmup' CHECK (status IN ('active','soft_banned','recovering','warmup','disabled')),
  consecutive_failures int NOT NULL DEFAULT 0,
  banned_at timestamptz,
  recover_at timestamptz,
  warmup_day int NOT NULL DEFAULT 0,
  daily_sent int NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  session_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- contacts
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  phone text NOT NULL,
  name text,
  tags text[] NOT NULL DEFAULT '{}',
  extra_data jsonb,
  opt_in_at timestamptz,
  opt_out_at timestamptz,
  last_received_at timestamptz,
  is_blocked bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone)
);

-- media_files
CREATE TABLE media_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image','document','video')),
  file_size int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- campaigns
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','done','failed')),
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  target_filter jsonb,
  sender_rotation jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- campaign_messages
CREATE TABLE campaign_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns ON DELETE CASCADE NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('text','image','document','button')),
  content text,
  media_url text,
  buttons jsonb
);

-- campaign_contacts
CREATE TABLE campaign_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts ON DELETE CASCADE NOT NULL,
  sender_phone_id uuid REFERENCES sender_phones,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','delivered','failed','skipped')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  error_code text,
  retry_count int NOT NULL DEFAULT 0 CHECK (retry_count <= 2)
);

-- delivery_logs
CREATE TABLE delivery_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_contact_id uuid REFERENCES campaign_contacts ON DELETE CASCADE NOT NULL,
  event text NOT NULL CHECK (event IN ('sent','delivered','failed','blocked','retry')),
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index untuk performa
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_campaigns_user_id_status ON campaigns(user_id, status);
CREATE INDEX idx_campaign_contacts_campaign_status ON campaign_contacts(campaign_id, status);
CREATE INDEX idx_delivery_logs_created_at ON delivery_logs(created_at);

-- Row Level Security
ALTER TABLE sender_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users can manage own sender_phones"
  ON sender_phones FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own contacts"
  ON contacts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own media_files"
  ON media_files FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own campaigns"
  ON campaigns FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own campaign_messages"
  ON campaign_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND user_id = auth.uid()));

CREATE POLICY "users can manage own campaign_contacts"
  ON campaign_contacts FOR ALL
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND user_id = auth.uid()));

CREATE POLICY "users can view own delivery_logs"
  ON delivery_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM campaign_contacts cc
    JOIN campaigns c ON c.id = cc.campaign_id
    WHERE cc.id = campaign_contact_id AND c.user_id = auth.uid()
  ));
