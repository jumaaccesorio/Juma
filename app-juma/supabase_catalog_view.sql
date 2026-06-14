-- ============================================================
-- JUMA ACCESSORY - VISTA DE CATÁLOGO PÚBLICO OPTIMIZADA
-- Version: 1.0
-- Ejecutar en Supabase SQL Editor para habilitar la vista híbrida.
-- ============================================================

-- Crear la vista optimizada para el catálogo público (sin datos de costos ni ocultos)
CREATE OR REPLACE VIEW public.catalog_products 
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.name,
  p.sub_name,
  p.category_id,
  c.name AS category_name,
  p.is_featured,
  p.sale_price,
  p.stock,
  p.enabled,
  p.image,
  p.image_thumb,
  p.image_card,
  p.image_full,
  p.created_at
FROM public.products p
LEFT JOIN public.categories c ON c.id = p.category_id
WHERE p.enabled = true;

-- Habilitar permisos de lectura para roles anon y authenticated en la vista
GRANT SELECT ON public.catalog_products TO anon, authenticated;
