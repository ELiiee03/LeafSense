package io.ionic.starter;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import androidx.annotation.Nullable;
import com.getcapacitor.BridgeActivity;
// import com.getcapacitor.Plugin;
// import com.getcapacitor.community.database.sqlite.CapacitorSQLite;

import org.tensorflow.lite.Interpreter;
import org.tensorflow.lite.support.image.ImageProcessor;
import org.tensorflow.lite.support.image.TensorImage;
import org.tensorflow.lite.support.image.ops.ResizeOp;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.io.FileInputStream;
import android.database.sqlite.SQLiteDatabase;
import java.util.HashMap;
import java.util.Map;


public class MainActivity extends BridgeActivity {
    private ImageProcessor imageProcessor;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(LeafInferencePlugin.class);
        
        // Initialize SQLite database
        // SQLiteDatabase database1 = openOrCreateDatabase("leaf_results.db", MODE_PRIVATE, null);
        try (SQLiteDatabase database = openOrCreateDatabase("leaf_results.db", MODE_PRIVATE, null)) {
            // Create a table to store inference results
            String createTableQuery = "CREATE TABLE IF NOT EXISTS results (" +
                          "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                          "predictedClass TEXT, " +
                          "confidence REAL)";
            database.execSQL(createTableQuery);
        }
        // Initialize TFLite
        try {
            Interpreter tflite = new Interpreter(loadModelFile());
            imageProcessor = new ImageProcessor.Builder()
                .add(new ResizeOp(224, 224, ResizeOp.ResizeMethod.BILINEAR))
                .build();
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        // Register our custom plugin
        registerPlugin(LeafInferencePlugin.class);
        // Register SQLite plugin
        registerPlugin(LeafInferencePlugin.class);
    }

    private void createTable() {
    }

    private MappedByteBuffer loadModelFile() throws IOException {
        String modelPath = "model.tflite";
        InputStream inputStream = getAssets().open(modelPath);
        File tempFile = File.createTempFile("model", ".tflite", getCacheDir());
        FileOutputStream outputStream = new FileOutputStream(tempFile);
        byte[] buffer = new byte[1024];
        int read;
        while ((read = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, read);
        }
        inputStream.close();
        outputStream.close();
        FileInputStream fileInputStream = new FileInputStream(tempFile);
        FileChannel fileChannel = fileInputStream.getChannel();
        long startOffset = 0;
        long declaredLength = tempFile.length();
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
        // FileChannel fileChannel = inputStream.getChannel();
        // long startOffset = 0;
        // long declaredLength = modelFile.length();
        // return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength);
    }


    public Map<String, Object> runInference(String imagePath) {
        // Load and preprocess image
        Bitmap bitmap = BitmapFactory.decodeFile(imagePath);
        TensorImage tensorImage = TensorImage.fromBitmap(bitmap);
        tensorImage = imageProcessor.process(tensorImage);

        // Prepare input and output
        float[][][][] input = new float[1][224][224][3];
        float[][] output = new float[1][3]; // Replace with your model's output size
        return java.util.Collections.emptyMap();
    }

    private Map<String, Object> processResults(float[] output) {
        // Find the index with highest probability
        int maxIndex = 0;
        float maxConfidence = output[0];
        for (int i = 1; i < output.length; i++) {
            if (output[i] > maxConfidence) {
                maxIndex = i;
                maxConfidence = output[i];
            }
        }

        // Map index to class name (you'll need to define these based on your model)
        String[] classNames = {"Jack Fruit", "Oak Leaf", "Jackfruit Leaf", "Birch Leaf"};
        
        Map<String, Object> result = new HashMap<>();
        result.put("predictedClass", classNames[maxIndex]);
        result.put("confidence", maxConfidence);
        
        return result;
    }
    // return result;
}