package com.app.billbox.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = BrandNavy,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE6FAF5),
    secondary = BrandTeal,
    onSecondary = BrandNavyDark,
    tertiary = BrandAccent,
    background = BackgroundLight,
    onBackground = TextPrimaryLight,
    surface = SurfaceLight,
    onSurface = TextPrimaryLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = TextSecondaryLight,
    error = BrandError,
    onError = Color.White,
    outline = BorderLight,
)

private val DarkColorScheme = darkColorScheme(
    primary = BrandTeal,
    onPrimary = BrandNavyDark,
    primaryContainer = Color(0xFF1B5E55),
    secondary = BrandTeal,
    onSecondary = BrandNavyDark,
    tertiary = BrandAccent,
    background = BackgroundDark,
    onBackground = TextPrimaryDark,
    surface = SurfaceDark,
    onSurface = TextPrimaryDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = TextSecondaryDark,
    error = BrandError,
    onError = Color.White,
    outline = BorderDark,
)

@Composable
fun BillboxTheme(
    themeMode: ThemeMode = ThemeMode.System,
    content: @Composable () -> Unit,
) {
    val darkTheme = when (themeMode) {
        ThemeMode.Light -> false
        ThemeMode.Dark -> true
        ThemeMode.System -> isSystemInDarkTheme()
    }

    val billBoxColors = if (darkTheme) DarkBillBoxColors else LightBillBoxColors
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    CompositionLocalProvider(LocalBillBoxColors provides billBoxColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content,
        )
    }
}
