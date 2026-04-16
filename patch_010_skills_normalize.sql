-- patch_010_skills_normalize.sql
-- CareMatch360 v2.7.13
--
-- Rewrites historical slug-format skill arrays in providers.skills to
-- display-string format so web-applicant and admin-created providers
-- share a single canonical representation.
--
-- Safe to re-run: the CASE expression passes through values already in
-- display-string form unchanged.
--
-- Run this BEFORE the code deploy. The deploy script will pause and
-- ask you to confirm you've run it.

BEGIN;

-- Sanity check before the rewrite: how many rows have at least one slug value?
SELECT COUNT(*) AS rows_with_slug_skills
FROM providers
WHERE skills && ARRAY[
  'vent_care','trach_care','wound_care','g_tube','iv_therapy','catheter_care',
  'colostomy','feeding_tube','oxygen_therapy','medication_management','vital_signs',
  'pediatrics','geriatrics','dementia_care','alzheimers','behavioral_health',
  'autism','developmental_disabilities','hospice_palliative','oncology',
  'cardiac_care','diabetes_management','stroke_recovery','post_surgical'
]::text[];

-- The rewrite. For each provider, rebuild skills[] mapping known slugs to
-- display strings; unknown values (including already-display-string entries
-- and any free-form future skills) pass through unchanged.
UPDATE providers
SET skills = (
  SELECT ARRAY_AGG(
    CASE s
      WHEN 'vent_care'                  THEN 'Vent Care'
      WHEN 'trach_care'                 THEN 'Trach Care'
      WHEN 'wound_care'                 THEN 'Wound Care'
      WHEN 'g_tube'                     THEN 'G-Tube'
      WHEN 'iv_therapy'                 THEN 'IV Therapy'
      WHEN 'catheter_care'              THEN 'Catheter Care'
      WHEN 'colostomy'                  THEN 'Colostomy Care'
      WHEN 'feeding_tube'               THEN 'Feeding Tube'
      WHEN 'oxygen_therapy'             THEN 'Oxygen Therapy'
      WHEN 'medication_management'      THEN 'Medication Management'
      WHEN 'vital_signs'                THEN 'Vital Signs'
      WHEN 'pediatrics'                 THEN 'Pediatrics'
      WHEN 'geriatrics'                 THEN 'Geriatrics'
      WHEN 'dementia_care'              THEN 'Dementia Care'
      WHEN 'alzheimers'                 THEN 'Alzheimer''s'
      WHEN 'behavioral_health'          THEN 'Behavioral Health'
      WHEN 'autism'                     THEN 'Autism'
      WHEN 'developmental_disabilities' THEN 'Developmental Disabilities'
      WHEN 'hospice_palliative'         THEN 'Hospice / Palliative'
      WHEN 'oncology'                   THEN 'Oncology'
      WHEN 'cardiac_care'               THEN 'Cardiac Care'
      WHEN 'diabetes_management'        THEN 'Diabetes Management'
      WHEN 'stroke_recovery'            THEN 'Stroke Recovery'
      WHEN 'post_surgical'              THEN 'Post-Surgical'
      ELSE s
    END
  )
  FROM UNNEST(skills) AS s
)
WHERE skills && ARRAY[
  'vent_care','trach_care','wound_care','g_tube','iv_therapy','catheter_care',
  'colostomy','feeding_tube','oxygen_therapy','medication_management','vital_signs',
  'pediatrics','geriatrics','dementia_care','alzheimers','behavioral_health',
  'autism','developmental_disabilities','hospice_palliative','oncology',
  'cardiac_care','diabetes_management','stroke_recovery','post_surgical'
]::text[];

-- Post-check: after the rewrite, this should return 0.
SELECT COUNT(*) AS rows_still_with_slug_skills
FROM providers
WHERE skills && ARRAY[
  'vent_care','trach_care','wound_care','g_tube','iv_therapy','catheter_care',
  'colostomy','feeding_tube','oxygen_therapy','medication_management','vital_signs',
  'pediatrics','geriatrics','dementia_care','alzheimers','behavioral_health',
  'autism','developmental_disabilities','hospice_palliative','oncology',
  'cardiac_care','diabetes_management','stroke_recovery','post_surgical'
]::text[];

COMMIT;
