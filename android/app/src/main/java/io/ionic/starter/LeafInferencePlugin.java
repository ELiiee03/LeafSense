package io.ionic.starter;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LeafInference")
public class LeafInferencePlugin extends Plugin {
    @PluginMethod
    public void runInference(PluginCall call) {
        String imagePath = call.getString("imagePath");
        
        try {
            Map<String, Object> result = ((MainActivity) getActivity()).runInference(imagePath);
            call.resolve(new JSObject(result));
        } catch (Exception e) {
            call.reject("Error running inference: " + e.getMessage());
        }
    }
}