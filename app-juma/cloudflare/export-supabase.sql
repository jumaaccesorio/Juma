-- Execute only inside the JUMA project in Supabase SQL Editor.
-- One read-only statement gives a consistent snapshot of application rows.
-- Download results as CSV. Keep the file private: it includes customer data.
-- Includes an inventory of files, NOT file bytes or Auth users/passwords.
SELECT json_build_object(
 'formatVersion',1,
 'sourceUrl','https://ezpbabxossevlheftgcu.supabase.co',
 'exportedAt',now(),
 'authExported',false,
 'authUserCount',(SELECT count(*) FROM auth.users),
 'tables',json_build_object(
  'categories',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.categories t),
  'clients',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.clients t),
  'products',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.products t),
  'product_sizes',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.product_sizes t),
  'orders',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.orders t),
  'order_items',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.order_items t),
  'favorites',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.favorites t),
  'restock_cart_items',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.restock_cart_items t),
  'finance_expenses',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.finance_expenses t),
  'hero_banner',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.hero_banner t),
  'featured_panels',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.featured_panels t),
  'packaging_costs',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.packaging_costs t),
  'community_subscribers',(SELECT coalesce(json_agg(t ORDER BY id),'[]'::json) FROM public.community_subscribers t)
 ),
 'storage',(SELECT coalesce(json_agg(json_build_object(
   'bucket',bucket_id,'name',name,'metadata',metadata
 ) ORDER BY bucket_id,name),'[]'::json) FROM storage.objects)
) AS snapshot;
