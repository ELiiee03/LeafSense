import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { supabase } from '@/supabaseClient';
import { sqliteService } from '@/services/sqliteService';
import { Network } from '@capacitor/network';
import { decodeWKB } from './wkbUtils';

// Interface for location data to use with map pins
export interface PinLocation {
  id?: string;
  lat: number;
  lng: number;
  note: string;
  isPinned: boolean;
  address?: string;
  title?: string;
  leaf_id?: number;
  leafInfo?: {
    id: number;
    name: string;
    scientificName: string;
    familyName: string;
  };
}

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

// Function to process location data from various formats
function processLocationData(item: any): PinLocation | null {
  try {
    console.log('Processing item:', item);
    
    let lat: number | undefined, lng: number | undefined;
    
    // First check for direct coordinates
    if (item.lat && item.lng) {
      lat = parseFloat(item.lat);
      lng = parseFloat(item.lng);
      console.log('Using direct coordinates:', lat, lng);
    }
    // Handle WKB binary format using our utility
    else if (item.geom && typeof item.geom === 'string' && item.geom.startsWith('01')) {
      console.log('Found WKB format in geom, using WKB utility');
      const coords = decodeWKB(item.geom);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      }
    }
    // Try to parse from text-based formats
    else if (item.zgeom) {
      // Check for POINT format in zgeom
      if (typeof item.zgeom === 'string' && item.zgeom.includes('POINT')) {
        const match = item.zgeom.match(/POINT\(([^ ]+) ([^)]+)\)/);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
          console.log('Parsed coordinates from zgeom POINT format:', lat, lng);
        }
      }
      // Check for WKB format in zgeom
      else if (typeof item.zgeom === 'string' && item.zgeom.startsWith('01')) {
        console.log('Found WKB format in zgeom, using WKB utility');
        const coords = decodeWKB(item.zgeom);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
        }
      }
    }
    
    // Return null if we couldn't get coordinates
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      console.warn('Failed to extract valid coordinates from item:', item);
      return null;
    }
    
    // Create location object with the coordinates
    const location: PinLocation = {
      id: item.id,
      lat,
      lng,
      note: item.note || '',
      title: item.title || '',
      isPinned: true,
      address: item.address || ''
    };
    
    // Add leaf info if available
    if (item.inference_results) {
      location.leafInfo = {
        id: item.inference_results.id,
        name: item.inference_results.result,
        scientificName: item.inference_results.scientific_name,
        familyName: item.inference_results.family_name
      };
    }
    
    // Add leaf_id if available
    if (item.leaf_id) {
      location.leaf_id = item.leaf_id;
    }
    
    console.log('Successfully processed location:', location);
    return location;
  } catch (e) {
    console.error('Error processing location data:', e);
    return null;
  }
}

// Hook to fetch pinned locations
export function usePinnedLocations() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['pinnedLocations'],
    queryFn: async () => {
      console.log('Fetching pinned locations with TanStack Query...');
      
      try {
        // Get data with a join to inference_results to get leaf details
        const { data, error } = await supabase
          .from('pinned_locations')
          .select(`
            *,
            inference_results:leaf_id(
              id, 
              result, 
              scientific_name, 
              family_name
            )
          `);
        
        if (error) {
          console.error('Error fetching pinned locations:', error);
          // Return empty array instead of throwing to prevent loading state from getting stuck
          return [];
        }
        
        console.log('Raw data from Supabase:', data);
        
        // Check if we have data
        let locationData = data;
        if (!locationData || locationData.length === 0) {
          console.warn('No pin data returned from Supabase');
          
          // Fallback: try a simpler query without the join
          const { data: simpleData, error: simpleError } = await supabase
            .from('pinned_locations')
            .select('*');
            
          if (simpleError) {
            console.error('Error in fallback query:', simpleError);
            // Return empty array instead of throwing
            return [];
          }
          
          if (!simpleData || simpleData.length === 0) {
            console.warn('No data in fallback query either');
            return [];
          }
          
          console.log('Got data from fallback query:', simpleData);
          locationData = simpleData;
        }
        
        // Process the data
        const locations: PinLocation[] = [];
        
        if (locationData && Array.isArray(locationData)) {
          for (const item of locationData) {
            const location = processLocationData(item);
            if (location) {
              locations.push(location);
            }
          }
        }
        
        console.log('Processed', locations.length, 'valid locations');
        return locations;
      } catch (err) {
        console.error('Error in usePinnedLocations:', err);
        // Return empty array instead of throwing to ensure loading state ends
        return [];
      } finally {
        // Force immediate update to query state
        queryClient.setQueryData(['pinnedLocations'], (oldData: any) => oldData || []);
      }
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1, // Reduce retries to prevent long loading times
    retryDelay: 1000, // 1 second between retries
  });
}

// Hook to save a new pinned location
export function useSavePinnedLocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (location: PinLocation) => {
      console.log('Saving pinned location:', location);
      
      const locationToSave = {
        user_id: null, // Update with actual user ID if available
        zgeom: `POINT(${location.lng} ${location.lat})`, // Use text format for better compatibility
        title: location.title || '',
        note: location.note || '',
        address: location.address || '',
        leaf_id: location.leaf_id || null,
        lat: location.lat,  // Store direct lat/lng values for easier retrieval
        lng: location.lng
      };
      
      const { data, error } = await supabase
        .from('pinned_locations')
        .insert(locationToSave)
        .select();
        
      if (error) {
        console.error('Error saving location:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch pinned locations
      queryClient.invalidateQueries({ queryKey: ['pinnedLocations'] });
    },
  });
}

// Hook to set up realtime updates for pinned locations
export function useRealtimeLocationUpdates() {
  const queryClient = useQueryClient();
  
  return {
    setupSubscription: () => {
      const subscription = supabase
        .channel('pinned_locations_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'pinned_locations' 
        }, () => {
          console.log('Realtime update received for pinned locations');
          queryClient.invalidateQueries({ queryKey: ['pinnedLocations'] });
        })
        .subscribe();
      
      return subscription;
    }
  };
}

// Existing queries and mutations
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
        // If online and log is synced (exists in Supabase)
        if (log.synced) {
          try {
            // First check if there are any pinned locations for this leaf
            const { data: pinnedLocations } = await supabase
              .from('pinned_locations')
              .select('id')
              .eq('leaf_id', log.id);
              
            if (pinnedLocations && pinnedLocations.length > 0) {
              console.log(`Found ${pinnedLocations.length} pinned locations for leaf ${log.id}`);
              
              // Delete all pinned locations for this leaf
              const { error: deleteError } = await supabase
                .from('pinned_locations')
                .delete()
                .eq('leaf_id', log.id);
                
              if (deleteError) {
                console.error('Error deleting pinned locations:', deleteError);
                throw new Error(`Unable to delete pinned locations: ${deleteError.message}`);
              }
            }
            
            // Now delete the inference result
            const { error } = await supabase
              .from('inference_results')
              .delete()
              .eq('id', log.id);
              
            if (error) {
              console.error('Error deleting from inference_results:', error);
              // Check if it's a foreign key constraint violation
              if (error.code === '23503' || error.message?.includes('violates foreign key constraint')) {
                throw new Error('This leaf has associated data that must be deleted first');
              }
              throw new Error(`Failed to delete: ${error.message}`);
            }
          } catch (error: any) {
            console.error('Deletion error:', error);
            throw new Error(error.message || 'Failed to delete due to database constraints');
          }
        } else {
          // If online but the log is not synced (local only)
          await sqliteService.deleteUnsyncedRecord(log.id);
        }
      } else {
        // If offline, can only delete unsynced logs
        if (!log.synced) {
          await sqliteService.deleteUnsyncedRecord(log.id);
        } else {
          throw new Error('Cannot delete synced records while offline');
        }
      }
      
      return log;
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