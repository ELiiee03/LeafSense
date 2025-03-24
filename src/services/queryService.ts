import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { supabase } from '@/supabaseClient';
import { sqliteService } from '@/services/sqliteService';
import { Network } from '@capacitor/network';

interface Log {
  id: number;
  result: string;
  scientific_name: string;
  family_name: string;
  description: string;
  created_at: string;
  habitat?: string;
  growthHabits?: string;
  image?: string;
  synced?: boolean;
}

const PAGE_SIZE = 20;

export const useLogsQuery = (page: number) => {
  return useQuery({
    queryKey: ['logs', page],
    queryFn: async () => {
      const isOnline = (await Network.getStatus()).connected;
      
      if (isOnline) {
        const { data, error } = await supabase
          .from('inference_results')
          .select('*')
          .order('created_at', { ascending: false })
          .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

        if (error) throw error;
        return data.map(item => ({
          ...item,
          synced: true,
          image: item.image || null
        }));
      } else {
        // When offline, get data from SQLite
        const offlineResults = await sqliteService.getUnsyncedResults();
        return offlineResults.map(item => ({
          id: item.id,
          result: item.predicted_class,
          scientific_name: item.scientific_name,
          family_name: item.family_name,
          description: item.description,
          created_at: new Date(item.timestamp).toISOString(),
          habitat: item.habitat,
          growthHabits: item.growth_habits,
          image: item.image_path,
          synced: false
        }));
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useDeleteLogMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Log) => {
      const isOnline = (await Network.getStatus()).connected;
      
      if (isOnline) {
        const { error } = await supabase
          .from('inference_results')
          .delete()
          .eq('id', log.id);
          
        if (error) throw error;
        
        // Also delete any associated pins
        await supabase
          .from('pinned_locations')
          .delete()
          .eq('leaf_id', log.id);
      } else {
        throw new Error('Cannot delete while offline');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch logs queries
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
};

export const useSyncMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await sqliteService.syncWithSupabase();
    },
    onSuccess: () => {
      // Invalidate and refetch logs queries
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}; 