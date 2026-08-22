-- Create motorcycle-images bucket if it does not exist
insert into storage.buckets (id, name, public)
select 'motorcycle-images', 'motorcycle-images', true
where not exists (
  select 1 from storage.buckets where id = 'motorcycle-images'
);

-- RLS for storage.objects
alter table storage.objects enable row level security;

-- Public can read motorcycle-images bucket
create policy "Public can view motorcycles images"
  on storage.objects for select
  using (bucket_id = 'motorcycle-images');

-- Admins can insert/update/delete in motorcycle-images bucket
create policy "Admins can insert images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'motorcycle-images' and public.is_admin());

create policy "Admins can update images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'motorcycle-images' and public.is_admin())
  with check (bucket_id = 'motorcycle-images' and public.is_admin());

create policy "Admins can delete images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'motorcycle-images' and public.is_admin());
