import { supabase } from '@/supabaseClient';
import { sqliteService } from './sqliteService';

export const syncService = {
  async syncToSupabase() {
    const items = await sqliteService.getItems();
    for (const item of items) {
      const { error } = await supabase.from('items').insert(item);
      if (!error) {
        await sqliteService.items.delete(item.id);
      }
    }
  },

  async syncFromSupabase() {
    const { data, error } = await supabase.from('items').select('*');
    if (!error && data) {
      await sqliteService.clearItems();
      for (const item of data) {
        await sqliteService.addItem(item);
      }
    }
  }
};