-- seed_products.sql
-- Source: Product_codes_to_be_clubbed.xlsx
-- 25 brands; primary codes become canonical products, alias codes go into product_code_map

-- Canonical products
INSERT INTO products (product_code, product_name, brand_cat) VALUES
  ('I0156', 'AMINOGLOBIN-XT',              'Others'),
  ('I0003', 'ARDEN 250',                   'Others'),
  ('I0005', 'ARDEN 325',                   'Pillar'),
  ('I0009', 'ARDEN 500',                   'Others'),
  ('I0010', 'ARDEN 650',                   'Pillar'),
  ('I0165', 'ARDEN A',                     'Others'),
  ('I0006', 'ARDEN JUNIOR',                'Others'),
  ('I0111', 'ARDEN MF SUSPENSION',         'Pillar'),
  ('I0167', 'ARDEN SPAS',                  'Others'),
  ('I0196', 'COLDAID +',                   'Pillar'),
  ('I0053', 'COLDAID SUSPENSION',          'Pillar'),
  ('I0021', 'CONIDERM-F',                  'Others'),
  ('I0036', 'CONIDERM-MX',                 'Others'),
  ('I0074', 'HEPAHEAL SYRUP',              'Others'),
  ('I0023', 'LORAMYL',                     'Others'),
  ('I0272', 'MV 30 SYRUP',                 'Pillar'),
  ('I0274', 'MV 30 TAB',                   'Pillar'),
  ('I0197', 'ORT+',                        'Pillar'),
  ('I0184', 'SERVIL HERBAL COUGH SYRUP',   'Others'),
  ('I0037', 'SERVIL JUNIOR',               'Others'),
  ('I0044', 'SERVIL LS-BABY DROPS',        'Others'),
  ('I0071', 'SERVIL-D',                    'Others'),
  ('I0018', 'SERVIL-LS JUNIOR',            'Others'),
  ('I0108', 'SERVIL-LS SYRUP',             'Others')
ON CONFLICT (product_code) DO NOTHING;

-- Alias / additional codes that must be clubbed into the canonical product
INSERT INTO product_code_map (alias_code, canonical_product_code) VALUES
  ('I0232', 'I0156'),  -- AMINOGLOBIN-XT alias
  ('I0400', 'I0009'),  -- ARDEN 500 alias
  ('I0237', 'I0165'),  -- ARDEN A alias
  ('I0240', 'I0111'),  -- ARDEN MF SUSPENSION alias
  ('I0238', 'I0167'),  -- ARDEN SPAS alias
  ('I0388', 'I0196'),  -- COLDAID + alias
  ('I0243', 'I0053'),  -- COLDAID SUSPENSION alias
  ('I0298', 'I0021'),  -- CONIDERM-F alias
  ('I0242', 'I0036'),  -- CONIDERM-MX alias
  ('I0233', 'I0074'),  -- HEPAHEAL SYRUP alias
  ('I0244', 'I0023'),  -- LORAMYL alias
  ('I0281', 'I0272'),  -- MV 30 SYRUP alias
  ('I0282', 'I0274'),  -- MV 30 TAB alias
  ('I0234', 'I0197'),  -- ORT+ alias
  ('I0239', 'I0184'),  -- SERVIL HERBAL COUGH SYRUP alias
  ('I0283', 'I0037')   -- SERVIL JUNIOR alias
ON CONFLICT (alias_code) DO NOTHING;

-- Self-referencing: canonical codes must also resolve via the map
-- so the upload engine can use a single lookup for all codes
INSERT INTO product_code_map (alias_code, canonical_product_code)
SELECT product_code, product_code FROM products
ON CONFLICT (alias_code) DO NOTHING;
