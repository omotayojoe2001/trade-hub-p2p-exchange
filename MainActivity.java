package com.tradehub.centralexchange;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable edge-to-edge for Android 15+ compatibility
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            EdgeToEdge.enable(this);
        }
        
        // Configure window for edge-to-edge display
        configureEdgeToEdge();
        
        setContentView(R.layout.activity_main);
        
        // Handle window insets for proper display
        handleWindowInsets();
    }

    private void configureEdgeToEdge() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Use new API for Android 11+
            getWindow().setDecorFitsSystemWindows(false);
            
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                );
            }
        } else {
            // Fallback for older versions
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        }
        
        // Configure window flags
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        getWindow().setNavigationBarColor(android.graphics.Color.TRANSPARENT);
    }

    private void handleWindowInsets() {
        View mainView = findViewById(android.R.id.content);
        
        ViewCompat.setOnApplyWindowInsetsListener(mainView, (v, insets) -> {
            WindowInsetsCompat windowInsets = WindowInsetsCompat.toWindowInsetsCompat(insets);
            
            // Get system bar insets
            androidx.core.graphics.Insets systemBars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars()
            );
            
            // Apply padding to avoid system bars
            v.setPadding(
                systemBars.left,
                systemBars.top,
                systemBars.right,
                systemBars.bottom
            );
            
            return WindowInsetsCompat.CONSUMED;
        });
    }

    @Override
    public void onConfigurationChanged(android.content.res.Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        
        // Handle configuration changes for large screens
        if (newConfig.screenWidthDp >= 600) {
            // Tablet/foldable layout adjustments
            adjustForLargeScreen();
        }
    }

    private void adjustForLargeScreen() {
        // Implement large screen optimizations
        // This ensures proper display on tablets and foldables
        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            // Add any specific large screen adjustments here
            contentView.requestLayout();
        }
    }
}