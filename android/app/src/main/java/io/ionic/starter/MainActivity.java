package io.ionic.starter;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import io.ionic.starter.LeafInferencePlugin; // Add this import


public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(LeafInferencePlugin.class);
        super.onCreate(savedInstanceState);
    }
}