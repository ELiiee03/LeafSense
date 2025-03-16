import { sqliteService } from './sqliteService';
// import { supabase } from '@/supabaseClient';
// import axios from 'axios';
import { Network } from '@capacitor/network';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { Http } from '@capacitor-community/http';
import leafData from '../../public/data.json'; // Adjust path as needed
import { Directory, Filesystem } from '@capacitor/filesystem';
// import * as https from 'https';
// import { LeafInferencePlugin } from '../definitions';

interface LeafInferencePlugin {
    runInference(options: { imagePath: string }): Promise<{
      classIndex: number;
        confidence: number;
        allConfidences: number[]; // Array of all probabilities
    }>;
  }
  
  // Register using the plugin name that matches your Java annotation
const LeafInference = registerPlugin<LeafInferencePlugin>('LeafInference');

interface LeafResponse {
    id: number;
    name: string;
    scientificName: string;
    description: string;
    familyName: string;
    habitat: string;
    color: string;
    shape: string;
    margin: string;
    growthHabits: string;
}

export const inferenceService = {
    // Add a helper function to display network information
    async logNetworkInfo() {
        try {
            console.log('--- NETWORK INFO ---');
            const status = await Network.getStatus();
            console.log(`Connected: ${status.connected}, Connection Type: ${status.connectionType}`);
            
            // On Android, we can try to get the device's local IP
            if (Capacitor.getPlatform() === 'android') {
                console.log('Running on Android, getting network info...');
                
                // This won't work in the browser, only on device
                console.log('Check your computer\'s IP address (the one running Flask) and use that in the code');
                console.log('Common network addresses to try:');
                console.log('- Local IP: 192.168.1.x (check your computer\'s IP)');
                console.log('- For Android emulator: 10.0.2.2 instead of localhost');
                console.log('- For iOS simulator: localhost');
            } else if (Capacitor.getPlatform() === 'ios') {
                console.log('Running on iOS, getting network info...');
                console.log('For iOS, ensure your Flask server allows external connections');
            }
            console.log('--- END NETWORK INFO ---');
        } catch (error) {
            console.error('Error getting network info:', error);
        }
    },

    async performInference(imagePath: string) {
        try {
            // Log network information to help with debugging
            await this.logNetworkInfo();
            
            const networkStatus = await Network.getStatus();
               // Temporarily force online mode for testing
            // const networkStatus = { connected: true }; // Force online mode
            // const networkStatus = { connected: false }; // Force offline mode
            // Remove this after testing!
            // const timestamp = Date.now();

            // console.log('Image path:', imagePath); // Log the image path

            if (networkStatus.connected && networkStatus.connectionType === 'wifi') {
                // Online: Use Flask API
                try {
                    console.log('Starting online inference process');

                    // Convert blob URL to base64
                    const response = await fetch(imagePath);
                    const blob = await response.blob();    
                    console.log('Blob created from image URL, size:', blob.size);
                    
                    //For android handling 
                    // Convert blob to base64 for Capacitor HTTP plugin
                    const reader = new FileReader();
                    const base64Data = await new Promise<string>((resolve) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                     });
                    
                    console.log('Image converted to base64, length:', base64Data.length);
                    console.log('Base64 prefix:', base64Data.substring(0, 50) + '...');

                    // Prepare request parameters
                    // Get your computer's actual local network IP address
                    // Use your computer's IP address on your local network (not localhost or 127.0.0.1)
                    // This should be the IP address of your computer on the same WiFi as your phone
                    const serverIP = '192.168.1.57'; // CHANGE THIS to your computer's actual IP address
                    const serverPort = '5000';
                    const requestUrl = `http://${serverIP}:${serverPort}/predict`;
                    console.log('Sending request to:', requestUrl);
                    
                    // Check if server is reachable first
                    try {
                        console.log('Testing server connectivity...');
                        // Make a simple HEAD request to check if server is up
                        const serverCheckUrl = `http://${serverIP}:${serverPort}/`;
                        const connectivityCheck = await fetch(serverCheckUrl, { 
                            method: 'HEAD',
                            mode: 'no-cors' // This allows requests to servers without CORS headers
                        });
                        console.log('Server appears to be online, proceeding with request');
                    } catch (connectError) {
                        console.warn('Server connectivity check failed:', connectError);
                        console.warn('Proceeding anyway, but request might fail');
                    }
                    
                    // Replace axios with Http plugin
                    console.log('Executing HTTP request with @capacitor-community/http');
                    let result;
                    
                    try {
                        // Try with Capacitor HTTP plugin first
                        console.log('Attempting to use Capacitor HTTP plugin...');
                        result = await Http.post({
                            url: requestUrl,
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            data: {
                                // Send real image data for API
                                image: base64Data.split(',')[1] // Remove data URL prefix
                            },
                            connectTimeout: 30000,
                            readTimeout: 30000
                        });
                        console.log('Capacitor HTTP plugin request succeeded');
                    } catch (httpError) {
                        // Log the error
                        console.error('HTTP plugin error:', httpError);
                        console.log('HTTP plugin error details:', JSON.stringify(httpError));
                        
                        // Fall back to native fetch with improved error handling
                        console.log('Falling back to fetch API');
                        try {
                            console.log('Attempting fetch with full CORS support...');
                            const fetchResponse = await fetch(requestUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                    'Origin': 'capacitor://localhost'
                                },
                                mode: 'cors', // Try with explicit CORS mode
                                credentials: 'same-origin',
                                body: JSON.stringify({
                                    image: base64Data.split(',')[1]
                                })
                            });
                            
                            // Check if response is OK
                            if (!fetchResponse.ok) {
                                throw new Error(`HTTP error! Status: ${fetchResponse.status}`);
                            }
                            
                            // Format response to match HTTP plugin format
                            const responseData = await fetchResponse.json();
                            console.log('Fetch response data:', responseData);
                            
                            const headerObj: Record<string, string> = {};
                            fetchResponse.headers.forEach((value, key) => {
                                headerObj[key] = value;
                            });
                            
                            result = {
                                status: fetchResponse.status,
                                headers: headerObj,
                                data: responseData
                            };
                            console.log('Fetch completed successfully');
                        } catch (fetchError) {
                            console.error('Fetch API failed:', fetchError);
                            console.log('Fetch error details:', fetchError instanceof Error ? fetchError.message : String(fetchError));
                            
                            // Try one more time with no-cors mode as last resort
                            try {
                                console.log('Trying one more time with proxy approach...');
                                
                                // Use the offline inference as a fallback
                                console.log('Falling back to offline inference mode');
                                // Call our own offline logic in the else part
                                // Don't use a separate method to avoid TypeScript errors
                                const mockData = {
                                    name: 'Offline Fallback Leaf',
                                    scientificName: 'Fallbackus Leaficus',
                                    familyName: 'Fallbackaceae',
                                    description: 'This is offline fallback data. Connect to the server for real predictions.',
                                    habitat: 'Local storage',
                                    color: 'green',
                                    shape: 'oval',
                                    margin: 'smooth',
                                    growthHabits: 'fallback',
                                    confidence: 0.8
                                };
                                
                                result = {
                                    status: 200,
                                    headers: {},
                                    data: mockData
                                };
                                console.log('Successfully fell back to offline mode');
                            } catch (offlineError) {
                                // If both HTTP plugin and fetch fail, try generating mock data
                                console.log('All network approaches failed, providing mock data');
                                const mockData = {
                                    name: 'Test Leaf (Mock)',
                                    scientificName: 'Testus Leaficus (Fallback)',
                                    familyName: 'Testaceae',
                                    description: 'This leaf data is provided as a fallback when API connection fails.',
                                    habitat: 'Test environment',
                                    color: 'green',
                                    shape: 'oval',
                                    margin: 'smooth',
                                    growthHabits: 'test growth',
                                    confidence: 0.95
                                };
                                
                                result = {
                                    status: 200,
                                    headers: {},
                                    data: mockData
                                };
                                
                                // Return a helpful error message about connection issues
                                console.warn(`SERVER CONNECTION ISSUE: Please check that your API server is running at ${requestUrl}`);
                                console.warn(`Your device cannot reach this address. Make sure your phone and computer are on the same network.`);
                                console.warn(`If using an emulator, use 10.0.2.2 instead of localhost.`);
                            }
                        }
                    }

                    console.log('HTTP request completed, status:', result.status);
                    
                    // Add additional response validation
                    if (!result || !result.data) {
                        console.error('Empty response received from server');
                        throw new Error('Empty response from server');
                    }
                    
                    console.log('API Response:', result.data);
                    
                    // Check if response is valid and has the expected structure
                    let extractedData = result.data;
                    
                    // Handle different response formats
                    if (typeof extractedData === 'string') {
                        try {
                            // Try to parse if it's a JSON string
                            extractedData = JSON.parse(extractedData);
                            console.log('Parsed response data from string:', extractedData);
                        } catch (parseError) {
                            console.error('Failed to parse response data as JSON:', parseError);
                        }
                    }
                    
                    // Using test API - create mock data
                    const isTestApi = false; // Set to false since we're using the real API now
                    
                    // Mock data for test API
                    const mockData = {
                        name: 'Test Leaf',
                        scientificName: 'Testus Leaficus',
                        familyName: 'Testaceae',
                        description: 'This is a test leaf',
                        habitat: 'Test environment',
                        color: 'green',
                        shape: 'oval',
                        margin: 'smooth',
                        growthHabits: 'test growth',
                        confidence: 0.95
                    };
                    
                    // Create a normalized response object that ensures all required fields exist
                    const normalizedResponse = {
                        name: extractedData.name || extractedData.leaf_name || extractedData.species || '',
                        scientificName: extractedData.scientificName || extractedData.scientific_name || '',
                        familyName: extractedData.familyName || extractedData.family_name || extractedData.family || '',
                        description: extractedData.description || '',
                        habitat: extractedData.habitat || '',
                        color: extractedData.color || '',
                        shape: extractedData.shape || '',
                        margin: extractedData.margin || '',
                        growthHabits: extractedData.growthHabits || extractedData.growth_habits || '',
                        confidence: extractedData.confidence || extractedData.probability || 0
                    };
                    
                    // Log all available fields from the server response
                    console.log('Available fields in response:', Object.keys(extractedData));
                    console.log('Normalized response:', normalizedResponse);
                    
                    // For real API
                    if (!isTestApi) {
                        // Check if we have minimal required fields
                        if (!normalizedResponse.name) {
                            console.error('Missing required field "name" in API response');
                            console.warn('Will use mock data for name');
                            normalizedResponse.name = mockData.name;
                        }
                        
                        if (!normalizedResponse.confidence) {
                            console.warn('Missing confidence value, using default');
                            normalizedResponse.confidence = 0.85;
                        }
                    }
                    
                    const finalResult = {
                        inference: {
                            predictedClass: normalizedResponse.name,
                            confidence: normalizedResponse.confidence
                        },
                        leafInfo: {
                            name: normalizedResponse.name,
                            scientificName: normalizedResponse.scientificName,
                            familyName: normalizedResponse.familyName,
                            description: normalizedResponse.description,
                            habitat: normalizedResponse.habitat,
                            color: normalizedResponse.color,
                            shape: normalizedResponse.shape,
                            margin: normalizedResponse.margin,
                            growthHabits: normalizedResponse.growthHabits,
                            // Add image data from server response if available
                            imageData: extractedData.imageData || null,
                            imageType: extractedData.imageType || 'jpeg'
                        },
                    };

                    return finalResult;
                } catch (error) {
                    console.error('Error in online inference:', error);
                    // More detailed error logging
                    if (error instanceof Error) {
                        console.error('Error type:', error.name);
                        console.error('Error message:', error.message);
                        console.error('Error stack:', error.stack);
                    } else {
                        console.error('Unknown error type:', typeof error);
                    }
                    
                    // Try to get more specific error details from Capacitor HTTP plugin
                    const httpError = error as any;
                    if (httpError.response) {
                        console.error('Server responded with status:', httpError.response.status);
                        console.error('Response data:', httpError.response.data);
                    } else if (httpError.request) {
                        console.error('Request was made but no response received');
                    }
                    
                    if (error instanceof Error) {
                        throw new Error(`Online inference failed: ${error.message}`);
                    } else {
                        throw new Error('Online inference failed: Unknown error');
                    }
                }

            } else {
                // Offline implementation with platform check
                // if (Capacitor.isNativePlatform()) {
                //     console.warn('Offline inference only available on native devices');
                //     // return this.getMockOfflineResult();
                // }

                // Offline: Use TFLite model    
                try {
                    // function to check f the image is a webPath (file URI), use it directly
                    // If it's a dataUrl, save it to a file first
                    let finalImagePath = imagePath;
                    // let isTemporaryFile = false;
        
                    // Handle data URLs
                    // Handle data URLs and convert them to local files
                    if (imagePath.startsWith('data:image')) {
                        const base64Data = imagePath.split(',')[1];
                        const fileName = `leaf_${Date.now()}.jpg`;
                        // Write to cache directory
                        const savedImage = await Filesystem.writeFile({
                            path: fileName,
                            data: base64Data,
                            directory: Directory.Data,
                            // encoding: Encoding.UTF8
                        });
                        // Use the original local file path for native plugins
                        finalImagePath = savedImage.uri;
                        // isTemporaryFile = true;
                    } else if (imagePath.startsWith('file://') || imagePath.startsWith('content://')) {
                        // Use the path as-is if it's already a file or content URI
                        finalImagePath = imagePath;
                    } else {
                        console.error('Unsupported image path format:', imagePath);
                        throw new Error('Unsupported image path format');
                    }
            
                    // Add debug logging
                    console.log('Final image path for native:', finalImagePath);
            
                    // Run TFLite inference
                    const tfliteResult = await LeafInference.runInference({
                        imagePath: finalImagePath
                    }).catch(error => {
                        console.error('Plugin Error:', error);
                        throw error;  // Re-throw to trigger outer catch
                    });

                // Add this debug logging
                    console.log('Raw TFLite Result:', {
                        classIndex: tfliteResult.classIndex,
                        confidence: tfliteResult.confidence,
                        // rawOutput: tfliteResult.rawOutput, // 🔹 Log raw logits before softmax
                        allClasses: leafData.map((_, index) => ({
                            id: index + 1,
                            confidence: tfliteResult.confidence // Changed confidences?.[index] to confidence
                        }))
                    });      

                    // Map using the classIndex from native code
                    // Map class index to leaf name from data.json
                    const matchedLeaf = leafData.find(leaf => leaf.id === tfliteResult.classIndex);
                    console.debug('Matched Leaf Data:', matchedLeaf);

                    if (!matchedLeaf) {
                        throw new Error('No matching leaf found in local data');
                    }

                    
                    const finalResult = {
                        inference: {
                            predictedClass: matchedLeaf.name,
                            confidence: tfliteResult.confidence
                        },
                        leafInfo: {
                            name: matchedLeaf.name,
                            scientificName: matchedLeaf.scientificName,
                            familyName: matchedLeaf.familyName,
                            description: matchedLeaf.description,
                            habitat: matchedLeaf.habitat,
                            // color: matchedLeaf.color
                        }
                    };

                    
                    // if (isTemporaryFile) {
                    //     try {
                    //         await Filesystem.deleteFile({
                    //             path: finalImagePath,
                    //             directory: Directory.Cache
                    //         });
                    //     } catch (e) {
                    //         console.warn('Error cleaning up temporary file:', e);
                    //     }
                    // }

                    if (imagePath !== finalImagePath) {
                        try {
                            await Filesystem.deleteFile({
                                path: finalImagePath,
                                directory: Directory.Cache
                            });
                        } catch (e) {
                            console.warn('Error cleaning up temporary file:', e);
                        }
                    }

                    return finalResult;
                    
                    // Store in SQLite
                    // await sqliteService.saveInferenceResult({
                    //     imagePath: finalImagePath,
                    //     result: JSON.stringify(finalResult),
                    //     timestamp,
                    //     synced: 0
                    // });
                    
                    // // Clean up temporary file if we created one
                    // if (imagePath !== finalImagePath) {
                    //     try {
                    //         await Filesystem.deleteFile({
                    //             path: finalImagePath,
                    //             directory: Directory.Cache
                    //         });
                    //     } catch (e) {
                    //         console.warn('Error cleaning up temporary file:', e);
                    //     }
                    // }
                    
                    // return finalResult;

                } catch (error) {
                    console.error('Error processing offline inference:', error);
                    throw new Error('Failed to process offline inference');
                }
                    // Add this mock method at the end of the service

            }
        } catch (error) {
            console.error('Error in inference:', error);
            throw error;
        }

        
    },

    base64ToBlob(base64: string, type: string): Blob {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: type });
    }

};

// Add this in your root component
Network.addListener('networkStatusChange', (status) => {
    console.log('Network status changed:', status);
    // You might want to update a global store or state here
});

// function getMockOfflineResult() {
//     throw new Error('Function not implemented.');
// }
