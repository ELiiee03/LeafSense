package io.ionic.starter;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.tensorflow.lite.Interpreter;
import java.io.File;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.io.FileInputStream;

@CapacitorPlugin(name = "LeafInference")
public class LeafInferencePlugin extends Plugin {
    
    private Interpreter tflite;
    
    @Override
    public void load() {
        // Initialize TFLite when plugin loads
        try {
            MappedByteBuffer model = loadModelFile("model.tflite");
            tflite = new Interpreter(model);
        } catch (Exception e) {
            throw new RuntimeException("Error loading model", e);
        }
    }

    @PluginMethod
    public void runInference(PluginCall call) {
        try {
            String imagePath = call.getString("imagePath");
            File imageFile = new File(imagePath.replace("file://", ""));
            
            // Add your image preprocessing here
            float[][][][] input = preprocessImage(imageFile);
            
            // Run inference
        float[][] output = new float[1][3];
        tflite.run(input, output);
        
        // Get predicted class index
        int classIndex = getClassIndex(output[0]);
        
        JSObject ret = new JSObject();
        ret.put("classIndex", classIndex);
        ret.put("confidence", getMaxConfidence(output[0]));
        call.resolve(ret);
            
        } catch (Exception e) {
            call.reject("Inference failed: " + e.getMessage());
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

    private MappedByteBuffer loadModelFile(String modelPath) throws Exception {
        FileInputStream inputStream = new FileInputStream(
            getActivity().getAssets().openFd(modelPath).getFileDescriptor()
        );
        FileChannel fileChannel = inputStream.getChannel();
        return fileChannel.map(
            FileChannel.MapMode.READ_ONLY,
            getActivity().getAssets().openFd(modelPath).getStartOffset(),
            getActivity().getAssets().openFd(modelPath).getDeclaredLength()
        );
    }
}