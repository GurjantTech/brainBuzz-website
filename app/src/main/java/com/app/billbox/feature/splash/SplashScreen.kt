package com.app.billbox.feature.splash

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.app.billbox.R
import com.app.billbox.ui.theme.BrandTeal
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing
import kotlinx.coroutines.delay

private val SplashProgressTrack = Color(0xFF1E3A5F)
private val SplashFooterText = Color(0xFF94A3B8)

@Composable
fun SplashScreen(
    viewModel: SplashViewModel,
    onNavigateToOnboarding: () -> Unit,
    onNavigateToLogin: () -> Unit,
    onNavigateToMain: () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    val onboardingCompleted by viewModel.onboardingCompleted.collectAsStateWithLifecycle()
    val isLoggedIn by viewModel.isLoggedIn.collectAsStateWithLifecycle()
    var progress by remember { mutableFloatStateOf(0f) }
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 1600),
        label = "splash_progress",
    )

    LaunchedEffect(Unit) {
        progress = 0.28f
    }

    LaunchedEffect(onboardingCompleted, isLoggedIn) {
        if (onboardingCompleted != null && isLoggedIn != null) {
            delay(1800)
            when {
                onboardingCompleted == false -> onNavigateToOnboarding()
                isLoggedIn == false -> onNavigateToLogin()
                else -> onNavigateToMain()
            }
        }
    }

    Box(
        modifier = Modifier
            .navigationBarsPadding()
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(colors.splashStart.copy(alpha = 0.95f), colors.splashEnd),
                ),
            ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = Spacing.xl),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Spacer(modifier = Modifier.weight(1.15f))

            Image(
                painter = painterResource(R.drawable.bill_box_app_icon),
                contentDescription = "Billbox",
                modifier = Modifier.size(120.dp),
            )

            Text(
                text = "Billbox",
                style = MaterialTheme.typography.displayMedium,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = Spacing.lg),
            )

            Box(
                modifier = Modifier
                    .padding(top = Spacing.sm)
                    .size(width = 48.dp, height = 3.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(BrandTeal),
            )

            Text(
                text = "Your documents. Organized. Protected.",
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White.copy(alpha = 0.9f),
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = Spacing.md),
            )

            Spacer(modifier = Modifier.weight(1f))

            LinearProgressIndicator(
                progress = { animatedProgress },
                modifier = Modifier
                    .fillMaxWidth(0.42f)
                    .height(3.dp)
                    .clip(RoundedCornerShape(2.dp)),
                color = BrandTeal,
                trackColor = SplashProgressTrack,
            )

            Text(
                text = "INITIALIZING SECURITY",
                style = MaterialTheme.typography.labelSmall.copy(
                    letterSpacing = 2.sp,
                    fontSize = 10.sp,
                ),
                color = Color.White.copy(alpha = 0.75f),
                modifier = Modifier.padding(top = Spacing.sm),
            )

            Spacer(modifier = Modifier.weight(0.85f))

            Text(
                text = "powered by G tech.",
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
                color = SplashFooterText,
                modifier = Modifier.padding(bottom = Spacing.xl),
            )
        }
    }
}
