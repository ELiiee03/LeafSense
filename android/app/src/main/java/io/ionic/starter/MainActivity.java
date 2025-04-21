package io.ionic.starter;

import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.view.WindowManager;
import android.view.WindowInsets;
import android.graphics.Color;
import android.view.ViewGroup.LayoutParams;

import com.getcapacitor.BridgeActivity;
import io.ionic.starter.LeafInferencePlugin; // Add this import


public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        this.registerPlugin(LeafInferencePlugin.class);
        
        // Set up edge-to-edge display
        setupEdgeToEdgeDisplay();
        
        super.onCreate(savedInstanceState);
    }
    
    private void setupEdgeToEdgeDisplay() {
        // Make the app draw under the status bar and navigation bar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            
            // For Android 10+ (API 29+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                getWindow().setFlags(
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                );
            }
        }
        
        // For Android P and newer (API 28+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode = 
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        
        // For Android R and newer (API 30+)
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            // For older Android versions
            View decorView = getWindow().getDecorView();
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            decorView.setSystemUiVisibility(flags);
        }
    }
}