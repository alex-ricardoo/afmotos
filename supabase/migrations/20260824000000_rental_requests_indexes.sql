-- Migration: Index on rental_requests.motorcycle_id
CREATE INDEX IF NOT EXISTS idx_rental_requests_motorcycle_id ON public.rental_requests(motorcycle_id);
