package io.ionic.starter;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import androidx.annotation.Nullable;
import com.getcapacitor.BridgeActivity;
import android.os.Build;
import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.community.database.sqlite.CapacitorSQLite;

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
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(LeafInferencePlugin.class); // Only registration here
    }
}