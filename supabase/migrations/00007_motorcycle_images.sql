
CREATE TABLE motorcycle_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motorcycle_id uuid NOT NULL REFERENCES motorcycles(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  width integer,
  height integer,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_motorcycle_images_primary ON motorcycle_images(motorcycle_id) WHERE is_primary = true;
CREATE INDEX idx_motorcycle_images_sort_order ON motorcycle_images(motorcycle_id, sort_order);
