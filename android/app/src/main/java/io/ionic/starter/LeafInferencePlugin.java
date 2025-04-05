package io.ionic.starter;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.tensorflow.lite.Interpreter;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;
import java.io.File;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import android.net.Uri;
import java.io.FileInputStream;
import android.content.res.AssetFileDescriptor;
import android.util.Log;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.InputStream;

@CapacitorPlugin(name = "LeafInference")
public class LeafInferencePlugin extends Plugin {

    private Interpreter tflite;
    private static final int NUM_CLASSES = 10;

    @Override
    public void load() {
        try {
            MappedByteBuffer model = loadModelFile();
            tflite = new Interpreter(model);
        } catch (Exception e) {
            throw new RuntimeException("Error loading model", e);
        }
    }

    public LeafInferencePlugin() {}

    @PluginMethod
    public void runInference(PluginCall call) {
        try {
            String imagePath = call.getString("imagePath");
            if (imagePath == null) {
                call.reject("Image path is null");
                return;
            }

            Log.d("LeafInference", "Received image path: " + imagePath);

            Bitmap bitmap;
            if (imagePath.startsWith("content://")) {
                bitmap = loadBitmapFromUri(imagePath);
            } else {
                bitmap = loadBitmapFromFile(imagePath);
            }
            
            if (bitmap == null) {
                call.reject("Failed to decode image from path: " + imagePath);
                return;
            }

            processBitmap(bitmap, call);

        } catch (Exception e) {
            Log.e("LeafInference", "Inference failed: " + e.getMessage());
            call.reject("Inference failed: " + e.getMessage());
        }
    }

    private Bitmap loadBitmapFromUri(String imagePath) throws Exception {
        Uri uri = Uri.parse(imagePath);
        InputStream inputStream = getContext().getContentResolver().openInputStream(uri);
        return BitmapFactory.decodeStream(inputStream);
    }

    private Bitmap loadBitmapFromFile(String imagePath) {
        try {
            // Handle Capacitor's localhost file path
            if (imagePath.startsWith("https://localhost/_capacitor_file_/")) {
                imagePath = imagePath.replace("https://localhost/_capacitor_file_/", "");
            }
            
            // Handle file:// prefix
            if (imagePath.startsWith("file://")) {
                imagePath = imagePath.replace("file://", "");
            }

            Log.d("LeafInference", "Attempting to load image from path: " + imagePath);
            
            File imageFile = new File(imagePath);
            if (!imageFile.exists()) {
                Log.e("LeafInference", "Image file does not exist: " + imagePath);
                return null;
            }

            Bitmap bitmap = BitmapFactory.decodeFile(imagePath);
            if (bitmap == null) {
                Log.e("LeafInference", "Failed to decode image from path: " + imagePath);
                return null;
            }
            
            Log.d("LeafInference", "Successfully loaded image with dimensions: " + bitmap.getWidth() + "x" + bitmap.getHeight());
            return bitmap;
        } catch (Exception e) {
            Log.e("LeafInference", "Error loading bitmap: " + e.getMessage());
            return null;
        }
    }

    private void processBitmap(Bitmap originalBitmap, PluginCall call) {
        Bitmap resizedBitmap = null;
        try {
            Bitmap rgbBitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true);
            if (rgbBitmap == null) {
                call.reject("Failed to convert image to RGB format");
                return;
            }

            resizedBitmap = Bitmap.createScaledBitmap(rgbBitmap, 224, 224, true);
            
            float[][][][] input = new float[1][3][224][224]; // Fix input shape
            for (int y = 0; y < 224; y++) {
                for (int x = 0; x < 224; x++) {
                    int pixel = resizedBitmap.getPixel(x, y);
                    input[0][0][y][x] = ((pixel >> 16) & 0xFF) / 255.0f; // Red
                    input[0][1][y][x] = ((pixel >> 8) & 0xFF) / 255.0f;  // Green
                    input[0][2][y][x] = (pixel & 0xFF) / 255.0f;         // Blue
                }
            }

            float[][] output = new float[1][NUM_CLASSES]; // Output shape (1, 4)
            tflite.run(input, output);

            // 🔹 Log Raw Output from Model
            Log.d("Inference", "Raw Model Output: " + Arrays.toString(output[0]));

            // 🔹 Apply Softmax to Normalize Outputs
            float[] probabilities = softmax(output[0]);

            Log.d("Inference", "All confidence scores:");
            for (int i = 0; i < probabilities.length; i++) {
                Log.d("Inference", "Class " + i + ": " + String.format("%.5f", probabilities[i]));
            }

            // 🔹 Log Confidence Scores After Softmax
            Log.d("Inference", "Confidence Scores (Softmax Applied): " + Arrays.toString(probabilities));

            // Get class with highest confidence
            int classIndex = argmax(probabilities);
            float confidence = probabilities[classIndex];

            // Validate confidence score range
            if (confidence < 0 || confidence > 1) {
                call.reject("Invalid confidence score after softmax: " + confidence);
                return;
            }

            Log.d("Inference", "Predicted class index: " + classIndex + ", Confidence: " + confidence);

            JSObject[] allClassesArray = new JSObject[NUM_CLASSES];
            for (int i = 0; i < probabilities.length; i++) {
                JSObject classObject = new JSObject();
                classObject.put("id", i);
                classObject.put("confidence", probabilities[i]);
                allClassesArray[i] = classObject;
            }

            // Inside processBitmap() before resolving call:
            List<Float> confidenceList = new ArrayList<>();
            for (float value : probabilities) {
                confidenceList.add(value);  // Convert float[] to List<Float>
            }

            JSObject ret = new JSObject();
            ret.put("classIndex", classIndex);
            ret.put("confidence", confidence);
            // ret.put("rawOutput", Arrays.asList(output[0]));  // Send raw logits before softmax
            // ret.put("allClasses", Arrays.asList(allClassesArray)); // Send all softmax values
            ret.put("rawOutput", Arrays.toString(output[0])); // Log raw output before softmax
            // ret.put("allClasses", Arrays.asList(allClassesArray)); // Convert to List
            ret.put("allConfidences", confidenceList);  

            
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Processing failed: " + e.getMessage());
        } finally {
            if (originalBitmap != null && !originalBitmap.isRecycled()) {
                originalBitmap.recycle();
            }
            if (resizedBitmap != null && !resizedBitmap.isRecycled()) {
                resizedBitmap.recycle();
            }
        }
    }

    // Softmax Function to Normalize Model Output
    private float[] softmax(float[] logits) {
        float max = Float.NEGATIVE_INFINITY;
        for (float logit : logits) {
            if (logit > max) {
                max = logit;
            }
        }

        float sum = 0.0f;
        float[] expValues = new float[logits.length];
        for (int i = 0; i < logits.length; i++) {
            expValues[i] = (float) Math.exp(logits[i] - max); // Prevent overflow
            sum += expValues[i];
        }

        for (int i = 0; i < logits.length; i++) {
            expValues[i] /= sum;
        }
        return expValues;
    }

    // Finds the index of the highest value in an array
    private int argmax(float[] values) {
        int maxIndex = 0;
        float maxValue = values[0];

        for (int i = 1; i < values.length; i++) {
            if (values[i] > maxValue) {
                maxValue = values[i];
                maxIndex = i;
            }
        }
        return maxIndex;
    }

    private float[][][][] convertBitmapToInputTensor(Bitmap bitmap) {
        float[][][][] input = new float[1][3][224][224]; 
        for (int y = 0; y < 224; y++) {
            for (int x = 0; x < 224; x++) {
                int pixel = bitmap.getPixel(x, y);
                input[0][y][x][0] = ((pixel >> 16) & 0xFF) / 255.0f;
                input[0][y][x][1] = ((pixel >> 8) & 0xFF) / 255.0f;
                input[0][y][x][2] = (pixel & 0xFF) / 255.0f;
            }
        }
        return input;
    }

    // private int getClassIndex(float[] output) {
    //     int maxIndex = 0;
    //     float maxConfidence = -Float.MAX_VALUE;  // Start with very low value

    //     for (int i = 0; i < output.length; i++) {
    //         if (output[i] > maxConfidence) {
    //             maxConfidence = output[i];
    //             maxIndex = i;
    //         }
    //     }
        
    //     Log.d("Inference", "Predicted class index: " + maxIndex + ", Confidence: " + maxConfidence);
    //     return maxIndex;
    // }

    private MappedByteBuffer loadModelFile() throws Exception {
        String modelPath = "model.tflite";
        try (AssetFileDescriptor fileDescriptor = getActivity().getAssets().openFd(modelPath);
             FileInputStream inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
             FileChannel fileChannel = inputStream.getChannel()) {
            return fileChannel.map(FileChannel.MapMode.READ_ONLY, fileDescriptor.getStartOffset(), fileDescriptor.getDeclaredLength());
        }
    }
}
