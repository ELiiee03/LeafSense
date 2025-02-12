package io.ionic.starter;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.tensorflow.lite.Interpreter;
import java.util.Arrays;
import java.io.File;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
//import java.nio.ByteBuffer;
//import java.nio.ByteOrder;
import android.provider.MediaStore;
import android.net.Uri;
import java.io.FileInputStream;
import android.content.res.AssetFileDescriptor;
import android.util.Log;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
//import android.graphics.Matrix;



@CapacitorPlugin(name = "LeafInference")
public class LeafInferencePlugin extends Plugin {
    
    private Interpreter tflite;
    private static final int NUM_CLASSES = 4; // Update this with your model's output classes
    
    @Override
    public void load() {
        try {
            MappedByteBuffer model = loadModelFile();
            tflite = new Interpreter(model);
        } catch (Exception e) {
            throw new RuntimeException("Error loading model", e);
        }
    }

@PluginMethod
public void runInference(PluginCall call) {
    try {
        String imagePath = call.getString("imagePath");
        if (imagePath == null) {
            call.reject("Image path is null");
            return;
        }
        // Handle content URIs
        if (imagePath.startsWith("content://")) {
            try {
                Uri uri = Uri.parse(imagePath);
                Bitmap bitmap = MediaStore.Images.Media.getBitmap(getContext().getContentResolver(), uri);
                processBitmap(bitmap, call);
                return;
            } catch (Exception e) {
                call.reject("Error loading content URI: " + e.getMessage());
                return;
            }
        }
        // Handle file paths
        String realPath = imagePath.replace("file://", "");
        File imageFile = new File(realPath);

        // Add debug logging
        Log.d("LeafInference", "Checking file at path: " + realPath);
        Log.d("LeafInference", "File exists: " + imageFile.exists());
        Log.d("LeafInference", "File length: " + imageFile.length());

        if (!imageFile.exists()) {
            call.reject("Image file does not exist: " + realPath);
            return;
        }

        // Validate file format
        if (!realPath.toLowerCase().endsWith(".jpg") && !realPath.toLowerCase().endsWith(".jpeg") && !realPath.toLowerCase().endsWith(".png")) {
            call.reject("Unsupported image format: " + realPath);
            return;
        }

        // Debug file header
        try (FileInputStream fis = new FileInputStream(imageFile)) {
            byte[] header = new byte[8];
            int bytesRead = fis.read(header);
            Log.d("LeafInference", "File header: " + Arrays.toString(header)); // Use Arrays.toString()
        } catch (Exception e) {
            Log.e("LeafInference", "Error reading file header", e);
        }

        // Decode image file
        Bitmap bitmap = BitmapFactory.decodeFile(realPath);
        if (bitmap == null) {
            call.reject("Failed to decode image file");
            return;
        }

        processBitmap(bitmap, call);

    } catch (Exception e) {
        call.reject("Inference failed: " + e.getMessage());
    }
}

    private void processBitmap(Bitmap originalBitmap, PluginCall call) {
        Bitmap resizedBitmap = null;
        try {
            // Check original bitmap
            if (originalBitmap.getWidth() == 0 || originalBitmap.getHeight() == 0) {
                call.reject("Invalid image dimensions");
                return;
            }
            // Resize to model input size
            resizedBitmap = Bitmap.createScaledBitmap(originalBitmap, 224, 224, true);
            
            // Convert to normalized float array
            float[][][][] input = new float[1][224][224][3];
            for (int y = 0; y < 224; y++) {
                for (int x = 0; x < 224; x++) {
                    int pixel = resizedBitmap.getPixel(x, y);
                    input[0][y][x][0] = ((pixel >> 16) & 0xFF) / 255.0f; // Red
                    input[0][y][x][1] = ((pixel >> 8) & 0xFF) / 255.0f;  // Green
                    input[0][y][x][2] = (pixel & 0xFF) / 255.0f;        // Blue
                }
            }

            // Run inference
            float[][] output = new float[1][NUM_CLASSES];
            tflite.run(input, output);

            // Process results
            int classIndex = getClassIndex(output[0]);
            float confidence = output[0][classIndex];

            // Return result
            JSObject ret = new JSObject();
            ret.put("classIndex", classIndex);
            ret.put("confidence", confidence);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Processing failed: " + e.getMessage());
        } finally {
            // Clean up bitmaps
            if (originalBitmap != null && !originalBitmap.isRecycled()) {
                originalBitmap.recycle();
            }
            if (resizedBitmap != null && !resizedBitmap.isRecycled()) {
                resizedBitmap.recycle();
            }
        }
    }

    private int getClassIndex(float[] output) {
        int maxIndex = 0;
        for (int i = 1; i < output.length; i++) {
            if (output[i] > output[maxIndex]) {
                maxIndex = i;
            }
        }
        return maxIndex;
    }

    private MappedByteBuffer loadModelFile() throws Exception {
        String modelPath = "model.tflite";
        try (AssetFileDescriptor fileDescriptor = getActivity().getAssets().openFd(modelPath);
             FileInputStream inputStream = new FileInputStream(fileDescriptor.getFileDescriptor());
             FileChannel fileChannel = inputStream.getChannel()) {
            return fileChannel.map(FileChannel.MapMode.READ_ONLY, fileDescriptor.getStartOffset(), fileDescriptor.getDeclaredLength());
        }
    }
}