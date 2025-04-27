import { sqliteService } from './sqliteService';
// import { supabase } from '@/supabaseClient';
import axios from 'axios';
import { networkState } from '@/services/networkService';
import { registerPlugin, Capacitor } from '@capacitor/core';
// import { Http } from '@capacitor-community/http';
import leafData from '../../public/data.json'; // Adjust path as needed
import { Directory, Filesystem } from '@capacitor/filesystem';
// import { LeafInferencePlugin } from '../definitions';

// Add Chrome's Performance Memory API interface
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Extend the Performance interface
interface ExtendedPerformance extends Performance {
  memory?: MemoryInfo;
}

// Cast the performance object to our extended interface
const perf = performance as ExtendedPerformance;

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
    // Add a flag to track if inference is in progress
    isProcessing: false,
    inferenceCount: 0,
    lastError: null as unknown | null,
    
    async performInference(imagePath: string) {
        // Don't allow multiple simultaneous inferences
        if (this.isProcessing) {
            console.warn('🚫 Another inference is already in progress');
            throw new Error('Another inference is already in progress. Please wait for the current process to complete.');
        }
        
        try {
            this.isProcessing = true;
            this.inferenceCount++;
            
            // Memory usage at start
            const startMemory = perf.memory ? perf.memory.usedJSHeapSize / (1024 * 1024) : null;
            const startTime = performance.now();
            
            console.log(`🔍 Starting inference process #${this.inferenceCount}...`);
            if (startMemory) {
                console.log(`📊 Initial Memory Usage: ${startMemory.toFixed(2)} MB`);
            }
            
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

                    console.log('🔄 Sending image to API...');
                    const apiStartTime = performance.now();
                    
                    const result = await axios.post('https://1917-143-44-193-52.ngrok-free.app/predict', {
                        image: base64Data.split(',')[1] // Remove data URL prefix
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    
                    const apiEndTime = performance.now();
                    console.log(`⏱️ API Inference Time: ${(apiEndTime - apiStartTime).toFixed(2)} ms`);

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
                    
                    // Log memory and time stats
                    const endTime = performance.now();
                    const endMemory = perf.memory ? perf.memory.usedJSHeapSize / (1024 * 1024) : null;
                    
                    console.log(`⏱️ Total Online Inference Time: ${(endTime - startTime).toFixed(2)} ms`);
                    if (endMemory && startMemory) {
                        console.log(`📊 Memory Usage (Online): Initial ${startMemory.toFixed(2)} MB → Final ${endMemory.toFixed(2)} MB (Change: ${(endMemory - startMemory).toFixed(2)} MB)`);
                    }

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
            this.lastError = error;
            throw error;
        } finally {
            // After each inference run, make sure to reset the processing flag
            setTimeout(() => {
                this.isProcessing = false;
                console.log(`🏁 Inference #${this.inferenceCount} complete, ready for next inference`);
            }, 1000); // Add a small delay to ensure everything is cleaned up
        }
    },

    // Extracted offline inference into a separate method for better organization
    async performOfflineInference(imagePath: string) {
        try {
            // Memory usage at start
            const startMemory = perf.memory ? perf.memory.usedJSHeapSize / (1024 * 1024) : null;
            const startTime = performance.now();
            
            console.log(`🔍 Starting offline inference process #${this.inferenceCount}...`);
            if (startMemory) {
                console.log(`📊 Initial Memory Usage (Offline): ${startMemory.toFixed(2)} MB`);
            }
            
            let finalImagePath = imagePath;
            let savedFile = null;

            try {
                if (imagePath.startsWith('data:image')) {
                    const base64Data = imagePath.split(',')[1];
                    const fileName = `leaf_${Date.now()}.jpg`;
                    savedFile = await Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: Directory.Data,
                    });
                    finalImagePath = savedFile.uri;
                } else if (imagePath.startsWith('file://') || imagePath.startsWith('content://') || imagePath.startsWith('https://localhost/_capacitor_file_/')) {
                    finalImagePath = imagePath;
                } else {
                    finalImagePath = Capacitor.convertFileSrc(imagePath);
                }

                console.log('Final image path for native inference:', finalImagePath);

                console.log('🔄 Running TFLite inference...');
                const tfliteStartTime = performance.now();
                
                const tfliteResult = await LeafInference.runInference({
                    imagePath: finalImagePath
                }).catch(error => {
                    console.error('TFLite Plugin Error:', error);
                    throw error;
                });
                
                const tfliteEndTime = performance.now();
                console.log(`⏱️ TFLite Inference Time: ${(tfliteEndTime - tfliteStartTime).toFixed(2)} ms`);

                // These class names MUST match the order in the Java LeafInferencePlugin.java file
                const CLASS_NAMES = [
                    "Jackfruit", "Paper Mulberry", "Kapok", "Coconut", "Durian", 
                    "African Oil Palm", "Poinsettia", "Cassava", "Rain tree", "Cacao"
                ];

                // Handle the allConfidences safely regardless of its type
                console.log('===== LEAF CLASSIFICATION RESULTS (CLIENT) =====');
                
                // Fix: Handle different possible formats of allConfidences
                let confidences: number[] = [];
                
                if (tfliteResult.allConfidences && 
                    (Array.isArray(tfliteResult.allConfidences) || typeof tfliteResult.allConfidences === 'object') &&
                    (Array.isArray(tfliteResult.allConfidences) ? tfliteResult.allConfidences.length > 0 : Object.keys(tfliteResult.allConfidences).length > 0)) {
                    
                    // Check if it's an array
                    if (Array.isArray(tfliteResult.allConfidences)) {
                        confidences = tfliteResult.allConfidences;
                    } 
                    // Check if it's an object with numeric keys (common when Java List is converted to JS)
                    else if (typeof tfliteResult.allConfidences === 'object') {
                        confidences = Object.values(tfliteResult.allConfidences);
                    }
                } 
                // If allConfidences is empty but we have raw output, use that instead
                else if (tfliteResult.rawOutput) {
                    try {
                        // Parse the raw output string (format: "[val1, val2, ...]")
                        const rawOutputString = tfliteResult.rawOutput;
                        const cleanedStr = rawOutputString.replace('[', '').replace(']', '').trim();
                        const rawValues = cleanedStr.split(',').map(val => parseFloat(val.trim()));
                        
                        // Apply softmax to get probabilities
                        confidences = this.softmax(rawValues);
                        console.log('Using raw output for confidences:', confidences);
                    } catch (e) {
                        console.error('Error parsing raw output:', e);
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

                // For debugging - log the class index from TFLite and what we're looking up
                console.log(`🔍 TFLite predicted class index: ${tfliteResult.classIndex}`);
                
                // Map the TFLite model class index to our correct data index
                // The class index directly maps to the IDs in data.json
                const predictedClassName = CLASS_NAMES[tfliteResult.classIndex];
                console.log(`🔍 Mapped to class name: ${predictedClassName}`);
                
                // Find the leaf by ID - this ensures correct UI display
                const matchedLeaf = leafData.find(leaf => leaf.id === tfliteResult.classIndex);
                
                console.debug('Matched Leaf Data:', matchedLeaf);

                if (!matchedLeaf) {
                    throw new Error(`No matching leaf found for ID ${tfliteResult.classIndex} (${predictedClassName})`);
                }

                // Log the consistency between TFLite output and our data mapping
                console.log(`✅ TFLite prediction: ${predictedClassName}, UI will display: ${matchedLeaf.name}`);

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
                
                // Log memory and time stats
                const endTime = performance.now();
                const endMemory = perf.memory ? perf.memory.usedJSHeapSize / (1024 * 1024) : null;
                
                console.log(`⏱️ Total Offline Inference Time: ${(endTime - startTime).toFixed(2)} ms`);
                if (endMemory && startMemory) {
                    console.log(`📊 Memory Usage (Offline): Initial ${startMemory.toFixed(2)} MB → Final ${endMemory.toFixed(2)} MB (Change: ${(endMemory - startMemory).toFixed(2)} MB)`);
                }

                return finalResult;
            } finally {
                // Clean up any temporary files
                if (savedFile && imagePath !== finalImagePath) {
                    try {
                        await Filesystem.deleteFile({
                            path: finalImagePath,
                            directory: Directory.Cache
                        });
                        console.log('✓ Temporary file cleaned up');
                    } catch (e) {
                        console.warn('Error cleaning up temporary file:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error processing offline inference:', error);
            throw new Error('Failed to process offline inference: ' + (error as Error).message);
        }
    },

    // Softmax function to convert raw logits to probabilities
    softmax(logits: number[]): number[] {
        // Find the maximum value to prevent overflow
        const maxLogit = Math.max(...logits);
        
        // Subtract max from each value and calculate exp
        const expValues = logits.map(logit => Math.exp(logit - maxLogit));
        
        // Calculate the sum of all exp values
        const sumExp = expValues.reduce((acc, val) => acc + val, 0);
        
        // Normalize by dividing each by the sum
        return expValues.map(expVal => expVal / sumExp);
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
    },
    
    // Reset method to recover from errors
    reset() {
        this.isProcessing = false;
        this.lastError = null;
        console.log('🔄 Inference service reset');
    }
};