-- Migration: Add is_repasse column to sales table
-- Date: 2026-08-28
-- Feature: Venda de Moto na Modalidade Repasse (Sem Garantia)

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS is_repasse boolean DEFAULT false;

COMMENT ON COLUMN public.sales.is_repasse IS 'Indica se a venda é na modalidade de repasse (sem garantia comercial, preço reduzido no estado em que se encontra).';
