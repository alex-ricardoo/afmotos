-- Migration: Add is_repasse column to motorcycles table
-- Feature: Identificação de Motocicleta de Repasse no Estoque e Vitrine Pública

ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS is_repasse boolean DEFAULT false;

COMMENT ON COLUMN public.motorcycles.is_repasse IS 'Indica se a motocicleta está cadastrada como modalidade de repasse (sem garantia comercial de loja, venda no estado em que se encontra por preço de repasse).';

CREATE INDEX IF NOT EXISTS idx_motorcycles_is_repasse ON public.motorcycles(is_repasse);
