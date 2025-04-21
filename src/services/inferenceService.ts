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
        rawOutput?: string;
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

            // Automatically use online inference if we have an internet connection (either WiFi or cellular)
            if (isConnected && (connectionType === 'wifi' || connectionType === 'cellular')) {
                console.log('Using online inference with Flask API');
                try {
                    // Convert blob URL to base64
                    const response = await fetch(imagePath);
                    const blob = await response.blob();

                    // Convert blob to base64 for Capacitor HTTP plugin
                    const reader = new FileReader();
                    const base64Data = await new Promise<string>((resolve) => {
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                    });

                    const result = await axios.post('https://1917-143-44-193-52.ngrok-free.app/predict', {
                        image: base64Data.split(',')[1] // Remove data URL prefix
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    console.log('API Response:', result.data);

                    const finalResult = {
                        inference: {
                            predictedClass: result.data.name,
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
                            imageData: result.data.imageData || null,
                            imageType: result.data.imageType || 'jpeg',
                            imagePath: result.data.imagePath || null,
                            foliage: result.data.foliage,
                            bark: result.data.bark,
                            fruit: result.data.fruit,
                            flowers: result.data.flowers,
                            crown: typeof result.data.shape === 'object' ? result.data.shape.crown : undefined,
                            trunk: typeof result.data.shape === 'object' ? result.data.shape.trunk : undefined,
                            leaves: typeof result.data.shape === 'object' ? result.data.shape.leaves : result.data.shape,
                            edibleUses: result.data.ethnobotanicalUses?.edible,
                            medicinalUses: result.data.ethnobotanicalUses?.medicinal,
                            timberUses: result.data.ethnobotanicalUses?.timber,
                            otherUses: result.data.ethnobotanicalUses?.other,
                            climate: result.data.additionalDetails?.climate,
                            lifespan: result.data.additionalDetails?.lifespan,
                            lightNeeds: result.data.additionalDetails?.lightPreference,
                            waterNeeds: result.data.additionalDetails?.waterPreference,
                            soilRequirements: result.data.additionalDetails?.soilRequirements,
                            retention: result.data.additionalDetails?.leafCharacteristics?.retention,
                            texture: result.data.additionalDetails?.leafCharacteristics?.texture,
                            foliarVenation: result.data.additionalDetails?.leafCharacteristics?.foliarVenation,
                            uniqueBehavior: result.data.additionalDetails?.leafCharacteristics?.uniqueBehavior,
                            aliases: result.data.additionalDetails?.commonNames ||
                                result.data.additionalDetails?.leafCharacteristics?.commonNames || []
                        },
                    };

                    return finalResult;
                } catch (error) {
                    console.error('Error in online inference:', (error as any).response?.data || (error as any).message);
                    console.log('Falling back to offline TFLite inference');
                    // If online inference fails, fall back to offline TFLite
                    return this.performOfflineInference(imagePath);
                }
            } else {
                // No internet connection, use TFLite
                console.log('Network unavailable. Using offline TFLite inference');
                return this.performOfflineInference(imagePath);
            }
        } catch (error) {
            console.error('Error in inference:', error);
            throw error;
        }
    },

    // Extracted offline inference into a separate method for better organization
    async performOfflineInference(imagePath: string) {
        try {
            let finalImagePath = imagePath;

            if (imagePath.startsWith('data:image')) {
                const base64Data = imagePath.split(',')[1];
                const fileName = `leaf_${Date.now()}.jpg`;
                const savedImage = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Data,
                });
                finalImagePath = savedImage.uri;
            } else if (imagePath.startsWith('file://') || imagePath.startsWith('content://') || imagePath.startsWith('https://localhost/_capacitor_file_/')) {
                finalImagePath = imagePath;
            } else {
                finalImagePath = Capacitor.convertFileSrc(imagePath);
            }

            console.log('Final image path for native inference:', finalImagePath);

            const tfliteResult = await LeafInference.runInference({
                imagePath: finalImagePath
            }).catch(error => {
                console.error('TFLite Plugin Error:', error);
                throw error;
            });

            const CLASS_NAMES = [
                "Cacao", "Cassava", "Coconut", "Durian", "Jackfruit",
                "Kapok", "Oil Palm", "Paper Mulberry", "Poinsettia", "Saman Samanea"
            ];

            // Handle the allConfidences safely regardless of its type
            console.log('===== LEAF CLASSIFICATION RESULTS (CLIENT) =====');
            
            // Fix: Handle different possible formats of allConfidences
            let confidences: number[] = [];
            
            if (tfliteResult.allConfidences) {
                // Check if it's an array
                if (Array.isArray(tfliteResult.allConfidences)) {
                    confidences = tfliteResult.allConfidences;
                } 
                // Check if it's an object with numeric keys (common when Java List is converted to JS)
                else if (typeof tfliteResult.allConfidences === 'object') {
                    confidences = Object.values(tfliteResult.allConfidences);
                }
            }

            // Log each class confidence
            for (let i = 0; i < CLASS_NAMES.length; i++) {
                const confidence = confidences[i] || 0;
                const className = CLASS_NAMES[i];
                const percentage = (confidence * 100).toFixed(2);
                console.log(`${className}: ${percentage}%`);
            }
            console.log('===============================================');

            if (tfliteResult.rawOutput) {
                console.log('Raw model output:', tfliteResult.rawOutput);
            }

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
                    foliage: matchedLeaf.foliage,
                    bark: matchedLeaf.bark,
                    fruit: matchedLeaf.fruit,
                    flowers: matchedLeaf.flowers,
                    crown: typeof matchedLeaf.shape === 'object' ? matchedLeaf.shape.crown : undefined,
                    trunk: typeof matchedLeaf.shape === 'object' ? matchedLeaf.shape.trunk : undefined,
                    leaves: typeof matchedLeaf.shape === 'object' ? matchedLeaf.shape.leaves : matchedLeaf.shape,
                    edibleUses: matchedLeaf.ethnobotanicalUses?.edible,
                    medicinalUses: matchedLeaf.ethnobotanicalUses?.medicinal,
                    timberUses: matchedLeaf.ethnobotanicalUses?.timber,
                    otherUses: matchedLeaf.ethnobotanicalUses?.other,
                    climate: matchedLeaf.additionalDetails?.climate,
                    lifespan: matchedLeaf.additionalDetails?.lifespan,
                    lightNeeds: matchedLeaf.additionalDetails?.lightPreference,
                    waterNeeds: matchedLeaf.additionalDetails?.waterPreference,
                    soilRequirements: matchedLeaf.additionalDetails?.soilRequirements,
                    retention: matchedLeaf.additionalDetails?.leafCharacteristics?.retention,
                    texture: matchedLeaf.additionalDetails?.leafCharacteristics?.texture,
                    foliarVenation: matchedLeaf.additionalDetails?.leafCharacteristics?.foliarVenation,
                    uniqueBehavior: matchedLeaf.additionalDetails?.leafCharacteristics?.uniqueBehavior,
                    aliases: matchedLeaf.additionalDetails?.commonNames ||
                        matchedLeaf.additionalDetails?.leafCharacteristics?.commonNames || []
                }
            };

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
        } catch (error) {
            console.error('Error processing offline inference:', error);
            throw new Error('Failed to process offline inference');
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