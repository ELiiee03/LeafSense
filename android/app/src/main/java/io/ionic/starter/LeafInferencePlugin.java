package io.ionic.starter;

import java.io.File; // Add this import
import java.util.Map;
import com.getcapacitor.JSObject;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LeafInference")
public class LeafInferencePlugin extends Plugin {
    @PluginMethod
    public void runInference(PluginCall call) {
    String imagePath = call.getString("imagePath");

        // Add file existence check
     File imageFile = new File(imagePath.replace("file://", ""));
    if (!imageFile.exists()) {
        call.reject("Image file not found: " + imagePath);
        return;
    }
    
    try {
        Map<String, Object> result = ((MainActivity) getActivity()).runInference(
             imageFile.getAbsolutePath() 
        );
        JSObject ret = new JSObject();
        ret.put("predictedClass", result.get("predictedClass"));
        ret.put("confidence", result.get("confidence"));
        call.resolve(ret);
    } catch (Exception e) {
        call.reject("Error running inference: " + e.getMessage());
    }
}
}