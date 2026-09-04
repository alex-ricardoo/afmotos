/**
 * Contrato de Tipagem TypeScript para o Componente Base de Skeleton
 * e Esquemas de Carregamento Estruturado (AF Motos)
 */

import React from 'react';

export type SkeletonVariant =
  'default' | 'text' | 'image' | 'card' | 'list' | 'button' | 'avatar' | 'input';

export type ResponsiveMode = 'all' | 'mobileOnly' | 'desktopOnly';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Estilo e comportamento do elemento esqueleto.
   * @default 'default'
   */
  variant?: SkeletonVariant;

  /**
   * Ativa ou desativa a animação de gradiente de shimmer.
   * @default true
   */
  animate?: boolean;

  /**
   * Força proporção geométrica fixa (ex: '16/10', '4/3', '1/1').
   * Essencial para imagens e mídias para garantir CLS = 0.
   */
  aspectRatio?: '16/10' | '4/3' | '1/1' | '21/9' | string;

  /**
   * Visibilidade adaptativa condicional entre celular e desktop.
   * @default 'all'
   */
  responsiveMode?: ResponsiveMode;

  /**
   * Texto de acessibilidade anunciado para leitores de tela.
   * @default 'Carregando conteúdo...'
   */
  label?: string;
}

/**
 * Contrato de Props para Skeletons Especializados por Domínio
 */
export interface CatalogSkeletonProps {
  /** Quantidade de cards na grade de preview (padrão: 6) */
  cardCount?: number;
  /** Modo de visualização inicial */
  viewMode?: 'grid' | 'list';
}

export interface MotorcycleDetailSkeletonProps {
  /** Se deve renderizar também a grade de motos recomendadas no rodapé */
  includeRecommendations?: boolean;
}
