'use server';

import { createClient } from '@/lib/supabase/server';

export async function uploadImageAction(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file') as File;
  const path = formData.get('path') as string || 'general';

  if (!file) {
    return { error: 'Nenhum arquivo enviado' };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('motorcycle-images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    return { error: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from('motorcycle-images')
    .getPublicUrl(filePath);

  return { success: true, url: publicUrlData.publicUrl, path: filePath };
}

export async function deleteImageAction(path: string) {
  const supabase = await createClient();

  const { error } = await supabase.storage
    .from('motorcycle-images')
    .remove([path]);

  if (error) {
    console.error('Error deleting image:', error);
    return { error: error.message };
  }

  return { success: true };
}
