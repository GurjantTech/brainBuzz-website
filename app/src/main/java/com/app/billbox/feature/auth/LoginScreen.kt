package com.app.billbox.feature.auth

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing

@Composable
fun LoginScreen(
    onContinueWithMobile: (String) -> Unit,
    onContinueWithGoogle: () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    var phoneNumber by remember { mutableStateOf("") }
    val isPhoneValid = phoneNumber.filter { it.isDigit() }.length >= 10

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

        AuthLogo()

        Text(
            text = "BillBox",
            style = MaterialTheme.typography.headlineMedium,
            color = colors.textPrimary,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = Spacing.lg),
        )

        Text(
            text = "Never lose an important document again.",
            style = MaterialTheme.typography.bodyMedium,
            color = colors.textSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = Spacing.sm, bottom = Spacing.xxl),
        )

        PhoneNumberField(
            value = phoneNumber,
            onValueChange = { phoneNumber = it.filter { char -> char.isDigit() }.take(10) },
        )

        Spacer(modifier = Modifier.height(Spacing.lg))

        Button(
            onClick = { onContinueWithMobile(phoneNumber) },
            enabled = isPhoneValid,
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
            Text(text = "Continue with Mobile Number", fontWeight = FontWeight.SemiBold)
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                modifier = Modifier.padding(start = Spacing.sm),
            )
        }

        OrDivider(modifier = Modifier.padding(vertical = Spacing.lg))

        OutlinedButton(
            onClick = onContinueWithGoogle,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(28.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = colors.textPrimary),
            border = BorderStroke(1.dp, colors.border),
        ) {
            GoogleLogo()
            Text(
                text = "Continue with Google",
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(start = Spacing.sm),
            )
        }

        Spacer(modifier = Modifier.height(Spacing.xxl))

        AuthTermsFooter(
            modifier = Modifier.padding(bottom = Spacing.md),
        )
    }
}

@Composable
private fun PhoneNumberField(
    value: String,
    onValueChange: (String) -> Unit,
) {
    val colors = LocalBillBoxColors.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, colors.border, RoundedCornerShape(16.dp))
            .background(colors.surface)
            .padding(horizontal = Spacing.md, vertical = Spacing.md),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = "+91",
            style = MaterialTheme.typography.bodyLarge,
            color = colors.textPrimary,
            fontWeight = FontWeight.Medium,
        )
        Box(
            modifier = Modifier
                .padding(horizontal = Spacing.md)
                .width(1.dp)
                .height(24.dp)
                .background(colors.border),
        )
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            textStyle = MaterialTheme.typography.bodyLarge.copy(color = colors.textPrimary),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            cursorBrush = SolidColor(colors.accent),
            decorationBox = { innerTextField ->
                Box {
                    if (value.isEmpty()) {
                        Text(
                            text = "Mobile number",
                            style = MaterialTheme.typography.bodyLarge,
                            color = colors.textTertiary,
                        )
                    }
                    innerTextField()
                }
            },
        )
    }
}

@Composable
private fun GoogleLogo() {
    Text(
        text = "G",
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold,
        color = Color(0xFF4285F4),
    )
}
