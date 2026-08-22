-- Ensure unique partial index for one primary image per motorcycle
CREATE UNIQUE INDEX IF NOT EXISTS idx_motorcycle_images_primary 
ON public.motorcycle_images (motorcycle_id) 
WHERE is_primary = true;

-- Index for ordering images
CREATE INDEX IF NOT EXISTS idx_motorcycle_images_sort_order 
ON public.motorcycle_images (motorcycle_id, sort_order);
