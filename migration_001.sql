-- ============================================================
-- CareMatch360 Migration 001 -- Run once in Supabase SQL Editor
-- ============================================================
CREATE TYPE credential_type AS ENUM ('RN','LPN','CNA','PT','OT','ST');
CREATE TYPE urgency_level   AS ENUM ('routine','urgent','emergency');
CREATE TYPE case_status     AS ENUM ('open','matching','matched','assigned','completed','cancelled');
CREATE TYPE provider_status AS ENUM ('active','inactive','suspended');
CREATE TYPE match_status    AS ENUM ('pending','notified','accepted','declined');

CREATE TABLE providers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  phone                TEXT, email TEXT, address TEXT, city TEXT,
  state                TEXT DEFAULT 'MD', zip TEXT,
  lat                  NUMERIC(10,7), lng NUMERIC(10,7),
  credential_type      credential_type NOT NULL,
  license_number       TEXT,
  skills               TEXT[] NOT NULL DEFAULT '{}',
  preferred_days       TEXT[] NOT NULL DEFAULT '{}',
  service_radius_miles INTEGER NOT NULL DEFAULT 15,
  available            BOOLEAN NOT NULL DEFAULT TRUE,
  status               provider_status NOT NULL DEFAULT 'active',
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_providers_credential ON providers(credential_type);
CREATE INDEX idx_providers_status     ON providers(status);
CREATE INDEX idx_providers_available  ON providers(available);

CREATE TABLE clients (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  address             TEXT, city TEXT, state TEXT DEFAULT 'MD', zip TEXT,
  lat                 NUMERIC(10,7), lng NUMERIC(10,7),
  contact_name        TEXT, contact_phone TEXT, contact_email TEXT,
  required_credential credential_type,
  required_skills     TEXT[] NOT NULL DEFAULT '{}',
  visit_frequency     TEXT,
  urgency_level       urgency_level NOT NULL DEFAULT 'routine',
  payer_type          TEXT,
  status              TEXT NOT NULL DEFAULT 'active',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_clients_status    ON clients(status);
CREATE INDEX idx_clients_urgency   ON clients(urgency_level);
CREATE INDEX idx_clients_credential ON clients(required_credential);

CREATE TABLE cases (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  client_id            UUID REFERENCES clients(id) ON DELETE SET NULL,
  required_credential  credential_type NOT NULL,
  required_skills      TEXT[] NOT NULL DEFAULT '{}',
  urgency              urgency_level NOT NULL DEFAULT 'routine',
  visit_date           DATE, visit_time TIME,
  duration_hours       NUMERIC(4,1) NOT NULL DEFAULT 1,
  special_instructions TEXT,
  status               case_status NOT NULL DEFAULT 'open',
  assigned_provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cases_status     ON cases(status);
CREATE INDEX idx_cases_urgency    ON cases(urgency);
CREATE INDEX idx_cases_client     ON cases(client_id);
CREATE INDEX idx_cases_credential ON cases(required_credential);
CREATE INDEX idx_cases_assigned   ON cases(assigned_provider_id);

CREATE TABLE case_matches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  provider_id       UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  match_score       INTEGER NOT NULL DEFAULT 0,
  credential_match  BOOLEAN NOT NULL DEFAULT TRUE,
  skill_match_count INTEGER NOT NULL DEFAULT 0,
  skill_match_pct   NUMERIC(5,4) NOT NULL DEFAULT 0,
  distance_miles    NUMERIC(8,2),
  within_radius     BOOLEAN NOT NULL DEFAULT TRUE,
  is_available      BOOLEAN NOT NULL DEFAULT TRUE,
  match_notes       TEXT,
  status            match_status NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(case_id, provider_id)
);
CREATE INDEX idx_matches_case     ON case_matches(case_id);
CREATE INDEX idx_matches_provider ON case_matches(provider_id);
CREATE INDEX idx_matches_score    ON case_matches(match_score DESC);
CREATE INDEX idx_matches_status   ON case_matches(status);

ALTER TABLE providers    DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients      DISABLE ROW LEVEL SECURITY;
ALTER TABLE cases        DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_matches DISABLE ROW LEVEL SECURITY;

-- Seed: 7 Maryland providers
INSERT INTO providers (name,phone,email,city,state,credential_type,license_number,skills,service_radius_miles,available,status) VALUES
('Mary Johnson',   '(301) 555-0101','mary.johnson@email.com',  'Silver Spring','MD','RN', 'RN-MD-10421', ARRAY['Wound Care','Diabetes Management','Medication Management'],15,true, 'active'),
('James Okeke',    '(301) 555-0102','james.okeke@email.com',   'Laurel',       'MD','RN', 'RN-MD-20834', ARRAY['Vent Care','Trach Care','Pediatrics'],                     20,true, 'active'),
('Patricia Davis', '(240) 555-0103','pat.davis@email.com',     'Rockville',    'MD','LPN','LPN-MD-3312', ARRAY['Wound Care','Catheter Care','Colostomy Care'],             12,true, 'active'),
('Kevin Obi',      '(301) 555-0104','kevin.obi@email.com',     'Hyattsville',  'MD','CNA','CNA-MD-8847', ARRAY['Dementia Care','Transfer Assist','Ambulation Assist'],     10,true, 'active'),
('Susan Lee',      '(240) 555-0105','susan.lee@email.com',     'Gaithersburg', 'MD','PT', 'PT-MD-5561',  ARRAY['Stroke Recovery','Orthopedic','Fall Prevention'],          18,false,'active'),
('Adaeze Nwoke',   '(301) 555-0106','adaeze.nwoke@email.com',  'Beltsville',   'MD','CNA','CNA-MD-9903', ARRAY['Geriatrics','Medication Management','Vital Signs'],        10,true, 'active'),
('Thomas Wright',  '(240) 555-0107','tom.wright@email.com',    'Wheaton',      'MD','OT', 'OT-MD-2244',  ARRAY['Stroke Recovery','Dementia Care','Developmental Disabilities'],15,true,'active');

-- Seed: 5 clients
INSERT INTO clients (name,address,city,state,contact_name,contact_phone,required_credential,required_skills,urgency_level,payer_type,visit_frequency,status) VALUES
('Robert Thompson','4521 Cedar Lane',  'Silver Spring','MD','Linda Thompson','(301) 555-2001','RN', ARRAY['Wound Care','Medication Management'],'routine',  'Private Pay','Daily',  'active'),
('Agnes Mwangi',   '812 Birchwood Dr', 'Laurel',       'MD','Peter Mwangi',  '(301) 555-2002','CNA',ARRAY['Dementia Care','Transfer Assist'],   'urgent',   'Medicaid',   '3x/week','active'),
('Harold Stevens', '239 Oak Street',   'Rockville',    'MD','Carol Stevens', '(240) 555-2003','LPN',ARRAY['Catheter Care','Vital Signs'],         'routine',  'CareFirst',  '2x/week','active'),
('Dorothy Kim',    '1107 Maple Ave',   'Hyattsville',  'MD','Daniel Kim',    '(301) 555-2004','PT', ARRAY['Stroke Recovery','Orthopedic'],        'urgent',   'Medicare',   '3x/week','active'),
('Eugene Okafor',  '345 Spruce Court', 'Gaithersburg', 'MD','Ngozi Okafor',  '(240) 555-2005','RN', ARRAY['Vent Care','Trach Care'],             'emergency','Private Pay','Daily',  'active');
