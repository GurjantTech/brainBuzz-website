package com.app.billbox.feature.auth

import androidx.compose.foundation.Image
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.app.billbox.R
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing

@Composable
fun AuthLogo(
    modifier: Modifier = Modifier,
    logoSize: androidx.compose.ui.unit.Dp = 72.dp,
) {
    Image(
        painter = painterResource(R.drawable.bill_box_app_icon),
        contentDescription = "BillBox",
        modifier = modifier.size(logoSize),
    )
}

@Composable
fun AuthTermsFooter(
    highlightLinks: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val colors = LocalBillBoxColors.current
    val linkColor = if (highlightLinks) colors.accent else colors.textSecondary

    Text(
        text = buildAnnotatedString {
            append("By continuing, you agree to our ")
            withStyle(SpanStyle(color = linkColor, fontWeight = FontWeight.Medium)) {
                append("Terms of Service")
            }
            append(" and ")
            withStyle(SpanStyle(color = linkColor, fontWeight = FontWeight.Medium)) {
                append("Privacy Policy")
            }
            append(".")
        },
        style = MaterialTheme.typography.labelSmall.copy(lineHeight = 16.sp),
        color = colors.textSecondary,
        textAlign = TextAlign.Center,
        modifier = modifier.padding(horizontal = Spacing.lg),
    )
}

@Composable
fun OrDivider(modifier: Modifier = Modifier) {
    val colors = LocalBillBoxColors.current
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(colors.border),
        )
        Text(
            text = "OR",
            style = MaterialTheme.typography.labelMedium,
            color = colors.textTertiary,
        )
        Box(
            modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(colors.border),
        )
    }
}

@Composable
fun OtpInputRow(
    otp: String,
    onOtpChange: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalBillBoxColors.current
    val focusRequester = remember { FocusRequester() }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    Box(modifier = modifier.fillMaxWidth()) {
        BasicTextField(
            value = otp,
            onValueChange = { value ->
                onOtpChange(value.filter { it.isDigit() }.take(6))
            },
            modifier = Modifier
                .fillMaxWidth()
                .focusRequester(focusRequester),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            cursorBrush = SolidColor(colors.accent),
            decorationBox = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.sm, Alignment.CenterHorizontally),
                ) {
                    repeat(6) { index ->
                        val char = otp.getOrNull(index)?.toString().orEmpty()
                        val isFocused = otp.length == index
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .border(
                                    width = if (isFocused) 2.dp else 1.dp,
                                    color = if (isFocused) colors.accent else colors.border,
                                    shape = RoundedCornerShape(12.dp),
                                )
                                .background(colors.surface),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                text = char,
                                style = MaterialTheme.typography.titleLarge,
                                color = colors.textPrimary,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }
                }
            },
        )
    }
}

fun formatPhoneForDisplay(phoneNumber: String): String {
    val digits = phoneNumber.filter { it.isDigit() }
    return when {
        digits.length == 10 -> {
            val area = digits.substring(0, 3)
            val middle = digits.substring(3, 6)
            val last = digits.substring(6)
            "($area) $middle-$last"
        }
        digits.length > 6 -> {
            val prefix = digits.dropLast(6)
            val suffix = digits.takeLast(6)
            "+$prefix ${suffix.chunked(3).joinToString("-")}"
        }
        else -> phoneNumber
    }
}
