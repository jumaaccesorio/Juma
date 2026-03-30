alter table public.products
  add column if not exists image_thumb text,
  add column if not exists image_card text,
  add column if not exists image_full text;

update public.products
set
  image_thumb = coalesce(image_thumb, image),
  image_card = coalesce(image_card, image),
  image_full = coalesce(image_full, image)
where image is not null
  and image <> '';
