import { Network } from '@capacitor/network';
import { ref } from 'vue';

// Reactive state that can be imported in components
export const networkState = {
  isOnline: ref(true),
  connectionType: ref<string | null>(null),
  lastUpdated: ref(new Date())
};

// Event system to notify components when network changes
type NetworkChangeCallback = (status: { connected: boolean, connectionType: string | null }) => void;
const listeners: NetworkChangeCallback[] = [];

// Subscribe to network changes
export const onNetworkChange = (callback: NetworkChangeCallback) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

// Notify all listeners
const notifyListeners = () => {
  const status = {
    connected: networkState.isOnline.value,
    connectionType: networkState.connectionType.value
  };
  listeners.forEach(listener => listener(status));
};

// Initialize the network status
export const initNetworkService = async () => {
  // Get initial network status
  const status = await Network.getStatus();
  networkState.isOnline.value = status.connected;
  networkState.connectionType.value = status.connectionType;
  networkState.lastUpdated.value = new Date();

  // Setup listener for network changes
  Network.addListener('networkStatusChange', (status) => {
    console.log('Network status changed:', status.connected ? 'online' : 'offline');
    
    // When going offline, update immediately to prevent hanging operations
    if (!status.connected) {
      networkState.isOnline.value = false;
      networkState.connectionType.value = status.connectionType;
      networkState.lastUpdated.value = new Date();
      notifyListeners();
      console.log('Network went offline, updated state immediately');
    } else {
      // When going online, update with a slight delay to let network stabilize
      setTimeout(() => {
        networkState.isOnline.value = status.connected;
        networkState.connectionType.value = status.connectionType;
        networkState.lastUpdated.value = new Date();
        notifyListeners();
        console.log('Network went online, updated state after delay');
      }, 500);
    }
  });
};

// Force refresh all UI components that depend on network status
export const refreshNetworkDependent = () => {
  networkState.lastUpdated.value = new Date();
  notifyListeners();
};

// Clean up network listeners
export const cleanupNetworkService = () => {
  Network.removeAllListeners();
};

// Helper to check if using cellular data
export const isCellularData = () => {
  return networkState.isOnline.value && networkState.connectionType.value === 'cellular';
}; 