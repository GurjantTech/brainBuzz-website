package com.app.billbox.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing

@Composable
fun OtpVerificationScreen(
    phoneNumber: String,
    onVerify: () -> Unit,
    onResendCode: () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    var otp by remember { mutableStateOf("") }
    val isOtpComplete = otp.length == 6
    val formattedPhone = remember(phoneNumber) { formatPhoneForDisplay(phoneNumber) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .navigationBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = Spacing.lg, vertical = Spacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.height(Spacing.xxl))

        AuthLogo(logoSize = 64.dp)

        Text(
            text = "Verify Your Number",
            style = MaterialTheme.typography.headlineMedium,
            color = colors.textPrimary,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = Spacing.lg),
        )

        Text(
            text = "We've sent a 6-digit code to $formattedPhone",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = Spacing.sm, bottom = Spacing.xxl),
        )

        OtpInputRow(
            otp = otp,
            onOtpChange = { otp = it },
            modifier = Modifier.padding(horizontal = Spacing.sm),
        )

        Spacer(modifier = Modifier.height(Spacing.xxl))

        Button(
            onClick = onVerify,
            enabled = isOtpComplete,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(28.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = colors.primary,
                contentColor = colors.onPrimary,
                disabledContainerColor = colors.primary.copy(alpha = 0.4f),
            ),
        ) {
            Text(text = "Verify & Continue", fontWeight = FontWeight.SemiBold)
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                modifier = Modifier.padding(start = Spacing.sm),
            )
        }

        TextButton(
            onClick = onResendCode,
            modifier = Modifier.padding(top = Spacing.md),
        ) {
            Icon(
                imageVector = Icons.Default.Sync,
                contentDescription = null,
                tint = colors.accent,
                modifier = Modifier
                    .size(16.dp)
                    .padding(end = Spacing.xs),
            )
            Text(
                text = "Resend Code",
                color = colors.accent,
                fontWeight = FontWeight.Medium,
            )
        }

        Spacer(modifier = Modifier.height(Spacing.xxl))

        AuthTermsFooter(
            highlightLinks = true,
            modifier = Modifier.padding(bottom = Spacing.md),
        )
    }
}
