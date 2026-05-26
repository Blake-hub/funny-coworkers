UPDATE team SET owner_id = (SELECT id FROM app_user WHERE email = 'mike.johnson@pmis.com' LIMIT 1) WHERE identifier = 'ENG';
UPDATE team SET owner_id = (SELECT id FROM app_user WHERE email = 'lisa.anderson@pmis.com' LIMIT 1) WHERE identifier = 'QA';
UPDATE team SET owner_id = (SELECT id FROM app_user WHERE email = 'emily.davis@pmis.com' LIMIT 1) WHERE identifier = 'PROD';
UPDATE team SET lead_name = (SELECT name FROM app_user WHERE id = team.owner_id LIMIT 1) WHERE lead_name IS NULL OR lead_name = '';
