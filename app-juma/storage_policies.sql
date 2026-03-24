-- Ejecutar en Supabase SQL Editor para permitir usar el bucket "products"

create policy "public read products bucket"
on storage.objects
for select
to public
using (bucket_id = 'products');

create policy "public upload products bucket"
on storage.objects
for insert
to public
with check (bucket_id = 'products');

create policy "public update products bucket"
on storage.objects
for update
to public
using (bucket_id = 'products')
with check (bucket_id = 'products');

create policy "public delete products bucket"
on storage.objects
for delete
to public
using (bucket_id = 'products');
