import { sqliteService } from './sqliteService';
// import { supabase } from '@/supabaseClient';
import axios from 'axios';
import { networkState } from '@/services/networkService';
import { registerPlugin, Capacitor } from '@capacitor/core';
// import { Http } from '@capacitor-community/http';
import leafData from '../../public/data.json'; // Adjust path as needed
import { Directory, Filesystem } from '@capacitor/filesystem';
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
    async performInference(imagePath: string) {
        try {
            // Use network state from our service
            const isConnected = networkState.isOnline.value;
            const connectionType = networkState.connectionType.value;
            
            // Temporarily force online mode for testing
            // const networkStatus = { connected: true }; // Force online mode
            // const networkStatus = { connected: false }; // Force offline mode
            // Remove this after testing!
            // const timestamp = Date.now();

            // console.log('Image path:', imagePath); // Log the image path

            // if (isConnected && (connectionType === 'wifi' || connectionType === 'cellular')) {
                if (isConnected && (connectionType === 'cellular')) {
                // Online: Use Flask API
                try {
                    // Convert blob URL to base64
                    const response = await fetch(imagePath);
                    const blob = await response.blob();    
                    
                    
                    //For android handling 
                    // Convert blob to base64 for Capacitor HTTP plugin
                    const reader = new FileReader();
                    const base64Data = await new Promise<string>((resolve) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                     });

                    const result = await axios.post('https://leafsense-backend.onrender.com/predict', {
                        image: base64Data.split(',')[1] // Remove data URL prefix
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    // 'http://192.168.1.57:5000/predict' http://192.168.218.173:5000/predict

                    // const file = await Filesystem.readFile({
                    //     path: imagePath,
                    //     directory: Directory.Cache
                    // });
                    // // Extract base64 data without the prefix
                    // // const base64Image = base64Data.split(',')[1];

                    // // Modified HTTP request using Capacitor plugin
                    // const { data } = await Http.post({
                    //     url: 'http://192.168.1.57:5000/predict',
                    //     headers: {
                    //         'Content-Type': 'application/json', // Change content type
                    //         'Accept': 'application/json'
                    //     },
                    //     data: JSON.stringify({ image: file.data }), // Send as JSON object
                    //     responseType: 'json'
                    // });
                    // console.log('API Response:', data);
                    console.log('API Response:', result.data);

                    //For android handling 
                    
                    // Formatting response to match the expected structure
                    // const finalResult = {
                    //     inference: {
                    //         predictedClass: result.data.name,
                    //         confidence: result.data.confidence
                    //     },
                    //     leafInfo: {
                    //        name: result.data.name,
                    //          scientificName: result.data.scientificName,
                    //         familyName: result.data.familyName,
                    //         description: result.data.description,
                    //         habitat: result.data.habitat
                    //     }
                    // };
                    
                    const finalResult = {
                        inference: {
                            predictedClass: result.data.name,  // Changed from result.data
                            confidence: result.data.confidence
                        },
                        leafInfo: {
                            name: result.data.name,
                            scientificName: result.data.scientificName,
                            familyName: result.data.familyName,
                            description: result.data.description,
                            habitat: result.data.habitat,
                            color: result.data.color,
                            shape: result.data.shape,
                            margin: result.data.margin,
                            growthHabits: result.data.growthHabits,
                            // Add image data from server response if available
                            imageData: result.data.imageData || null,
                            imageType: result.data.imageType || 'jpeg',
                            imagePath: result.data.imagePath || null,
                            // Additional properties 
                            foliage: result.data.foliage,
                            bark: result.data.bark,
                            fruit: result.data.fruit,
                            flowers: result.data.flowers,
                            // Shape & structure properties
                            crown: typeof result.data.shape === 'object' ? result.data.shape.crown : undefined,
                            trunk: typeof result.data.shape === 'object' ? result.data.shape.trunk : undefined,
                            leaves: typeof result.data.shape === 'object' ? result.data.shape.leaves : result.data.shape,
                            // Ethnobotanical uses
                            edibleUses: result.data.ethnobotanicalUses?.edible,
                            medicinalUses: result.data.ethnobotanicalUses?.medicinal,
                            timberUses: result.data.ethnobotanicalUses?.timber,
                            otherUses: result.data.ethnobotanicalUses?.other,
                            // Additional details
                            climate: result.data.additionalDetails?.climate,
                            lifespan: result.data.additionalDetails?.lifespan,
                            lightNeeds: result.data.additionalDetails?.lightPreference,
                            waterNeeds: result.data.additionalDetails?.waterPreference,
                            soilRequirements: result.data.additionalDetails?.soilRequirements,
                            // Leaf characteristics
                            retention: result.data.additionalDetails?.leafCharacteristics?.retention,
                            texture: result.data.additionalDetails?.leafCharacteristics?.texture,
                            foliarVenation: result.data.additionalDetails?.leafCharacteristics?.foliarVenation,
                            uniqueBehavior: result.data.additionalDetails?.leafCharacteristics?.uniqueBehavior,
                            // Common names as aliases - check both possible locations in data structure
                            aliases: result.data.additionalDetails?.commonNames || 
                                    result.data.additionalDetails?.leafCharacteristics?.commonNames || []
                        },
                    };

                    // // Store in Supabase
                    // await supabase.from('inference_results').insert({
                    //     image_path: imagePath,
                    //     result: JSON.stringify(finalResult),
                    //     timestamp
                    // });

                    return finalResult;
                } catch (error) {
                    console.error('Error in online inference:', (error as any).response?.data || (error as any).message);
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
                    } else if (imagePath.startsWith('file://') || imagePath.startsWith('content://') || imagePath.startsWith('https://localhost/_capacitor_file_/')) {
                        // Use the path as-is if it's already a file or content URI
                        finalImagePath = imagePath;
                    } else {
                        // Try to convert the path using Capacitor's convertFileSrc
                        finalImagePath = Capacitor.convertFileSrc(imagePath);
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
                            color: matchedLeaf.color,
                            shape: matchedLeaf.shape,
                            growthHabits: matchedLeaf.growthHabits,
                            imagePath: matchedLeaf.imagePath,
                            // Add new properties from data.json
                            foliage: matchedLeaf.foliage,
                            bark: matchedLeaf.bark,
                            fruit: matchedLeaf.fruit,
                            flowers: matchedLeaf.flowers,
                            // Shape & structure properties
                            crown: typeof matchedLeaf.shape === 'object' ? matchedLeaf.shape.crown : undefined,
                            trunk: typeof matchedLeaf.shape === 'object' ? matchedLeaf.shape.trunk : undefined,
                            leaves: typeof matchedLeaf.shape === 'object' ? matchedLeaf.shape.leaves : matchedLeaf.shape,
                            // Ethnobotanical uses
                            edibleUses: matchedLeaf.ethnobotanicalUses?.edible,
                            medicinalUses: matchedLeaf.ethnobotanicalUses?.medicinal,
                            timberUses: matchedLeaf.ethnobotanicalUses?.timber,
                            otherUses: matchedLeaf.ethnobotanicalUses?.other,
                            // Additional details
                            climate: matchedLeaf.additionalDetails?.climate,
                            lifespan: matchedLeaf.additionalDetails?.lifespan,
                            lightNeeds: matchedLeaf.additionalDetails?.lightPreference,
                            waterNeeds: matchedLeaf.additionalDetails?.waterPreference,
                            soilRequirements: matchedLeaf.additionalDetails?.soilRequirements,
                            // Leaf characteristics
                            retention: matchedLeaf.additionalDetails?.leafCharacteristics?.retention,
                            texture: matchedLeaf.additionalDetails?.leafCharacteristics?.texture,
                            foliarVenation: matchedLeaf.additionalDetails?.leafCharacteristics?.foliarVenation,
                            uniqueBehavior: matchedLeaf.additionalDetails?.leafCharacteristics?.uniqueBehavior,
                            // Common names as aliases - check both possible locations in data structure
                            aliases: matchedLeaf.additionalDetails?.commonNames || 
                                    matchedLeaf.additionalDetails?.leafCharacteristics?.commonNames || []
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

// No need to add a listener here as we're using our network service
// Network.addListener('networkStatusChange', (status) => {
//     console.log('Network status changed:', status);
//     // You might want to update a global store or state here
// });

// function getMockOfflineResult() {
//     throw new Error('Function not implemented.');
// }