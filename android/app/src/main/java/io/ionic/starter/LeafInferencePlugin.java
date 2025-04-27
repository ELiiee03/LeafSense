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
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.util.Log;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.InputStream;

@CapacitorPlugin(name = "LeafInference")
public class LeafInferencePlugin extends Plugin {

    private Interpreter tflite;
    private static final int NUM_CLASSES = 10;
    private static final String[] CLASS_NAMES = {
        "Jackfruit", "Paper Mulberry", "Coconut", "Kapok", "Coconut", 
        "Durian", "African Oil Palm", "Poinsettia", "Cassava", "Rain tree"
    };
    
    // Flag to prevent concurrent inference calls
    private boolean isProcessing = false;
    // Counter to track number of inference calls
    private int inferenceCount = 0;

    @Override
    public void load() {
        try {
            initializeInterpreter();
        } catch (Exception e) {
            Log.e("LeafInference", "Error loading model", e);
        }
    }
    
    private synchronized void initializeInterpreter() {
        try {
            // Close the existing interpreter if it exists
            if (tflite != null) {
                tflite.close();
                tflite = null;
                System.gc(); // Suggest garbage collection
            }
            
            MappedByteBuffer model = loadModelFile();
            tflite = new Interpreter(model);
            Log.d("LeafInference", "TFLite interpreter initialized successfully");
        } catch (Exception e) {
            Log.e("LeafInference", "Failed to initialize interpreter", e);
            throw new RuntimeException("Error loading model", e);
        }
    }

    public LeafInferencePlugin() {}

    @PluginMethod
    public synchronized void runInference(PluginCall call) {
        // Save call reference to use in callback
        call.setKeepAlive(true);
        
        if (isProcessing) {
            call.reject("Another inference is already in progress");
            return;
        }
        
        try {
            isProcessing = true;
            inferenceCount++;
            Log.d("LeafInference", "Starting inference #" + inferenceCount);
            
            // Check if the interpreter is initialized
            if (tflite == null) {
                try {
                    initializeInterpreter();
                } catch (Exception e) {
                    call.reject("Failed to initialize TensorFlow Lite interpreter: " + e.getMessage());
                    isProcessing = false;
                    return;
                }
            }

            String imagePath = call.getString("imagePath");
            if (imagePath == null) {
                call.reject("Image path is null");
                isProcessing = false;
                return;
            }

            Log.d("LeafInference", "Received image path: " + imagePath);

            Bitmap bitmap = null;
            try {
                if (imagePath.startsWith("content://")) {
                    bitmap = loadBitmapFromUri(imagePath);
                } else {
                    bitmap = loadBitmapFromFile(imagePath);
                }
                
                if (bitmap == null) {
                    call.reject("Failed to decode image from path: " + imagePath);
                    isProcessing = false;
                    return;
                }

                processBitmap(bitmap, call);
            } catch (Exception e) {
                Log.e("LeafInference", "Error processing image: " + e.getMessage());
                if (bitmap != null && !bitmap.isRecycled()) {
                    bitmap.recycle();
                }
                call.reject("Error processing image: " + e.getMessage());
                isProcessing = false;
            }

        } catch (Exception e) {
            Log.e("LeafInference", "Inference failed: " + e.getMessage());
            call.reject("Inference failed: " + e.getMessage());
            isProcessing = false;
        }
    }

    private Bitmap loadBitmapFromUri(String imagePath) throws Exception {
        Uri uri = Uri.parse(imagePath);
        InputStream inputStream = null;
        try {
            inputStream = getContext().getContentResolver().openInputStream(uri);
            return BitmapFactory.decodeStream(inputStream);
        } finally {
            if (inputStream != null) {
                try {
                    inputStream.close();
                } catch (Exception e) {
                    Log.e("LeafInference", "Error closing input stream", e);
                }
            }
        }
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

    private void processBitmap(final Bitmap originalBitmap, final PluginCall call) {
        Bitmap resizedBitmap = null;
        try {
            Bitmap rgbBitmap = originalBitmap.copy(Bitmap.Config.ARGB_8888, true);
            if (rgbBitmap == null) {
                call.reject("Failed to convert image to RGB format");
                isProcessing = false;
                return;
            }

            resizedBitmap = Bitmap.createScaledBitmap(rgbBitmap, 224, 224, true);
            rgbBitmap.recycle(); // Recycle immediately after scaling
            
            float[][][][] input = new float[1][3][224][224]; // Fix input shape
            for (int y = 0; y < 224; y++) {
                for (int x = 0; x < 224; x++) {
                    int pixel = resizedBitmap.getPixel(x, y);
                    input[0][0][y][x] = ((pixel >> 16) & 0xFF) / 255.0f; // Red
                    input[0][1][y][x] = ((pixel >> 8) & 0xFF) / 255.0f;  // Green
                    input[0][2][y][x] = (pixel & 0xFF) / 255.0f;         // Blue
                }
            }

            float[][] output = new float[1][NUM_CLASSES]; // Output shape (1, 10)
            tflite.run(input, output);

            // Log Raw Output from Model
            Log.d("Inference", "Raw Model Output: " + Arrays.toString(output[0]));

            // Apply Softmax to Normalize Outputs
            float[] probabilities = softmax(output[0]);

            // Log detailed class-by-class confidence scores
            Log.d("Inference", "===== LEAF CLASSIFICATION RESULTS =====");
            for (int i = 0; i < probabilities.length; i++) {
                String className = (i < CLASS_NAMES.length) ? CLASS_NAMES[i] : "Class " + i;
                Log.d("Inference", className + ": " + String.format("%.4f", probabilities[i] * 100) + "%");
            }
            Log.d("Inference", "======================================");

            // Get class with highest confidence
            int classIndex = argmax(probabilities);
            float confidence = probabilities[classIndex];
            String predictedClassName = (classIndex < CLASS_NAMES.length) ? CLASS_NAMES[classIndex] : "Unknown";

            Log.d("Inference", "TOP PREDICTION: " + predictedClassName + 
                " (Class " + classIndex + ") with confidence: " + 
                String.format("%.2f", confidence * 100) + "%");

            // Validate confidence score range
            if (confidence < 0 || confidence > 1) {
                call.reject("Invalid confidence score after softmax: " + confidence);
                isProcessing = false;
                return;
            }

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
            ret.put("rawOutput", Arrays.toString(output[0])); // Log raw output before softmax
            ret.put("allConfidences", confidenceList);  
            
            call.resolve(ret);
            
            // After 3 inferences, recreate the interpreter to avoid memory issues
            if (inferenceCount % 3 == 0) {
                Log.d("LeafInference", "Reinitializing interpreter after " + inferenceCount + " inferences");
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            initializeInterpreter();
                        } catch (Exception e) {
                            Log.e("LeafInference", "Error reinitializing interpreter", e);
                        }
                    }
                }).start();
            }

        } catch (Exception e) {
            Log.e("LeafInference", "Processing failed: " + e.getMessage(), e);
            call.reject("Processing failed: " + e.getMessage());
        } finally {
            if (originalBitmap != null && !originalBitmap.isRecycled()) {
                originalBitmap.recycle();
            }
            if (resizedBitmap != null && !resizedBitmap.isRecycled()) {
                resizedBitmap.recycle();
            }
            
            // Trigger GC if needed
            if (inferenceCount % 3 == 0) {
                System.gc();
            }
            
            isProcessing = false;
            Log.d("LeafInference", "Inference #" + inferenceCount + " completed");
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

    private MappedByteBuffer loadModelFile() throws Exception {
        String modelPath = "model.tflite";
        AssetFileDescriptor fileDescriptor = null;
        FileInputStream inputStream = null;
        FileChannel fileChannel = null;
        
        try {
            fileDescriptor = getActivity().getAssets().openFd(modelPath);
            inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
            fileChannel = inputStream.getChannel();
            return fileChannel.map(FileChannel.MapMode.READ_ONLY, fileDescriptor.getStartOffset(), fileDescriptor.getDeclaredLength());
        } finally {
            if (fileChannel != null) {
                try { fileChannel.close(); } catch (Exception e) { Log.e("LeafInference", "Error closing file channel", e); }
            }
            if (inputStream != null) {
                try { inputStream.close(); } catch (Exception e) { Log.e("LeafInference", "Error closing input stream", e); }
            }
            if (fileDescriptor != null) {
                try { fileDescriptor.close(); } catch (Exception e) { Log.e("LeafInference", "Error closing file descriptor", e); }
            }
        }
    }
    
    @Override
    protected void handleOnDestroy() {
        if (tflite != null) {
            tflite.close();
            tflite = null;
        }
        super.handleOnDestroy();
    }
}
