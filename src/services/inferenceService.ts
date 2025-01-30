import { sqliteService } from './sqliteService';
import { supabase } from '@/supabaseClient';
import axios from 'axios';
import { Network } from '@capacitor/network';
import { registerPlugin } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

// Register the LeafInference plugin
const LeafInference = registerPlugin<{
    runInference(options: { imagePath: string }): Promise<{
        predictedClass: string;
        confidence: number;
    }>;
}>('LeafInference');

interface LeafResponse {
    id: number;
    name: string;
    scientificName: string;
    description: string;
    familyName: string;
    habitat: string;
    confidence: number;
}

export const inferenceService = {
    async performInference(imagePath: string) {
        try {
            const networkStatus = await Network.getStatus();
            const timestamp = Date.now();

            console.log('Image path:', imagePath); // Log the image path

            if (networkStatus.connected) {
                // Online: Use Flask API
                try {

                    // Convert blob URL to base64
                    const response = await fetch(imagePath);
                    const blob = await response.blob();
                    
                    // Create FormData and append the blob
                    const formData = new FormData();
                    formData.append('file', blob, 'image.jpg');

                    // Send to Flask API
                    const result = await axios.post('http://127.0.0.1:5000/predict', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Accept': 'application/json',
                        },
                        withCredentials: false // Important for CORS
                    });
                    console.log('API Response:', result.data); // Debug log

                    // Format the response to match the expected structure
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
                            habitat: result.data.habitat
                        }
                    };

                    // // Store in Supabase
                    // await supabase.from('inference_results').insert({
                    //     image_path: imagePath,
                    //     result: JSON.stringify(finalResult),
                    //     timestamp
                    // });

                    return finalResult;
                } catch (error) {
                    console.error('Error in online inference:', error);
                    throw new Error('Failed to process online inference');
                }
            } else {
                // Offline: Use TFLite model
                try {
                    // If the image is a webPath (file URI), use it directly
                    // If it's a dataUrl, save it to a file first
                    let finalImagePath = imagePath;
                    if (imagePath.startsWith('data:image')) {
                        const base64Data = imagePath.split(',')[1];
                        const fileName = `leaf_${Date.now()}.jpg`;
                        
                        // Save the image to filesystem
                        const savedImage = await Filesystem.writeFile({
                            path: fileName,
                            data: base64Data,
                            directory: Directory.Cache
                        });
                        finalImagePath = savedImage.uri;
                    }

                    // Run TFLite inference with the file path
                    const tfliteResult = await LeafInference.runInference({
                        imagePath: imagePath
                    });

                    // Map TFLite result to local leaf data
                    const response = await axios.get<LeafResponse[]>('/data.json');
                    const leafData = response.data;
                    
                    const matchedLeaf = leafData.find(leaf => 
                        leaf.name.toLowerCase() === tfliteResult.predictedClass.toLowerCase()
                    );

                    if (!matchedLeaf) {
                        throw new Error('No matching leaf found in local data');
                    }

                    const finalResult = {
                        inference: {
                            predictedClass: tfliteResult.predictedClass,
                            confidence: tfliteResult.confidence
                        },
                        leafInfo: {
                            name: matchedLeaf.name,
                            scientificName: matchedLeaf.scientificName,
                            familyName: matchedLeaf.familyName,
                            description: matchedLeaf.description,
                            habitat: matchedLeaf.habitat
                        }
                    };
                    
                    // Store in SQLite
                    await sqliteService.saveInferenceResult({
                        imagePath: finalImagePath,
                        result: JSON.stringify(finalResult),
                        timestamp,
                        synced: 0
                    });
                    
                    // Clean up temporary file if we created one
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