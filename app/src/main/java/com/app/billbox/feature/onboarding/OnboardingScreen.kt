package com.app.billbox.feature.onboarding

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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.app.billbox.ui.components.BillBoxTextButton
import com.app.billbox.ui.components.PageIndicator
import com.app.billbox.ui.components.PrimaryButton
import com.app.billbox.ui.theme.BrandForest
import com.app.billbox.ui.theme.BrandTeal
import com.app.billbox.ui.theme.BrandTealDark
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing
import kotlinx.coroutines.launch

@Composable
fun OnboardingScreen(onComplete: () -> Unit) {
    val pagerState = rememberPagerState(pageCount = { 3 })
    val scope = rememberCoroutineScope()
    val colors = LocalBillBoxColors.current
    val isLastPage = pagerState.currentPage == 2

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .padding(Spacing.md)
            .navigationBarsPadding(),
        verticalArrangement = Arrangement.SpaceBetween,
    ) {
        OnboardingHeader(
            currentPage = pagerState.currentPage,
            onSkip = onComplete,
        )

        HorizontalPager(
            state = pagerState,
            modifier = Modifier.weight(1f),
        ) { page ->
            when (page) {
                0 -> AiOrganizationPage()
                1 -> StoreDocumentsPage()
                2 -> SmartRemindersPage()
            }
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(Spacing.lg),
        ) {
            PageIndicator(pageCount = 3, currentPage = pagerState.currentPage)
            PrimaryButton(
                text = if (isLastPage) "Get Started" else "Next",
                onClick = {
                    if (isLastPage) onComplete()
                    else scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                },
                showArrow = true,
            )
            if (isLastPage) {
                BillBoxTextButton(
                    text = "Manage Notification Settings",
                    onClick = onComplete,
                )
            } else {
                Spacer(modifier = Modifier.height(48.dp))
            }
        }
    }
}

@Composable
private fun OnboardingHeader(
    currentPage: Int,
    onSkip: () -> Unit,
) {
    val colors = LocalBillBoxColors.current

    when (currentPage) {
        0 -> Spacer(modifier = Modifier.height(48.dp))
        1 -> Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = "Billbox",
                style = MaterialTheme.typography.titleLarge,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold,
            )
            BillBoxTextButton(text = "Skip", onClick = onSkip)
        }
        else -> Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(colors.primary),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(18.dp),
                )
            }
            Text(
                text = "Billbox",
                style = MaterialTheme.typography.titleLarge,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(start = Spacing.sm),
            )
        }
    }
}

@Composable
private fun AiOrganizationPage() {
    val colors = LocalBillBoxColors.current
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp),
            contentAlignment = Alignment.Center,
        ) {
            Card(
                modifier = Modifier
                    .size(width = 260.dp, height = 180.dp),
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                shape = RoundedCornerShape(20.dp),
            ) {
                Column(
                    modifier = Modifier.padding(Spacing.md),
                    verticalArrangement = Arrangement.spacedBy(Spacing.sm),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top,
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(colors.surfaceVariant),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                imageVector = Icons.Default.Receipt,
                                contentDescription = null,
                                tint = colors.textSecondary,
                                modifier = Modifier.size(22.dp),
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = null,
                                tint = BrandTeal,
                                modifier = Modifier.size(16.dp),
                            )
                            Icon(
                                imageVector = Icons.Default.AutoAwesome,
                                contentDescription = null,
                                tint = BrandTeal.copy(alpha = 0.6f),
                                modifier = Modifier.size(12.dp),
                            )
                        }
                    }

                    repeat(2) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.85f)
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(colors.surfaceVariant),
                        )
                    }

                    Spacer(modifier = Modifier.height(Spacing.xs))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                        ) {
                            Icon(
                                imageVector = Icons.Default.Store,
                                contentDescription = null,
                                tint = colors.textSecondary,
                                modifier = Modifier.size(18.dp),
                            )
                            Text(
                                text = "Apple Store",
                                fontWeight = FontWeight.SemiBold,
                                color = colors.textPrimary,
                            )
                        }
                        Text(
                            text = "$1,299.00",
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary,
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                        ) {
                            Icon(
                                imageVector = Icons.Default.Category,
                                contentDescription = null,
                                tint = colors.textSecondary,
                                modifier = Modifier.size(18.dp),
                            )
                            Text(
                                text = "Electronics",
                                color = colors.textSecondary,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            tint = BrandTealDark,
                            modifier = Modifier.size(20.dp),
                        )
                    }
                }
            }

            Card(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .offset(x = 24.dp, y = 8.dp),
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                shape = RoundedCornerShape(20.dp),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = Spacing.md, vertical = Spacing.sm),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                ) {
                    Icon(
                        imageVector = Icons.Default.Sync,
                        contentDescription = null,
                        tint = BrandTeal,
                        modifier = Modifier.size(16.dp),
                    )
                    Text(
                        text = "Processing Bill...",
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Medium,
                    )
                }
            }
        }

        OnboardingTitle(text = "AI Organizes It For You")
        OnboardingBody(
            text = "Upload a bill and BillBox automatically extracts important details like merchant, amount, date, category and warranty.",
        )
    }
}

@Composable
private fun StoreDocumentsPage() {
    val colors = LocalBillBoxColors.current
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(220.dp),
            contentAlignment = Alignment.Center,
        ) {
            Card(
                modifier = Modifier
                    .size(width = 200.dp, height = 140.dp)
                    .offset(x = 24.dp, y = 24.dp),
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = null,
                        tint = BrandTealDark,
                        modifier = Modifier.size(28.dp),
                    )
                }
            }

            Card(
                modifier = Modifier.size(width = 220.dp, height = 160.dp),
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Column(
                    modifier = Modifier.padding(Spacing.md),
                    verticalArrangement = Arrangement.spacedBy(Spacing.sm),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(80.dp)
                            .border(1.dp, colors.border, RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            imageVector = Icons.Default.Receipt,
                            contentDescription = null,
                            tint = BrandForest,
                            modifier = Modifier.size(32.dp),
                        )
                    }
                    repeat(2) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(colors.surfaceVariant),
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.55f)
                            .height(24.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(BrandForest),
                    )
                }
            }
        }

        OnboardingTitle(text = "Store Every Important Document")
        OnboardingBody(
            text = "Keep your bills, invoices, receipts, warranties and important documents safely in one place.",
        )

        FeatureHighlightCard(
            icon = Icons.Default.Folder,
            title = "All-in-One Vault",
            description = "Securely store and access any document type instantly.",
        )
    }
}

@Composable
private fun SmartRemindersPage() {
    val colors = LocalBillBoxColors.current
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        NotificationStack()

        OnboardingTitle(text = "Never Miss Important Dates")
        OnboardingBody(
            text = buildAnnotatedString {
                append("Get smart reminders before ")
                withStyle(SpanStyle(color = colors.accent, fontWeight = FontWeight.SemiBold)) {
                    append("warranties")
                }
                append(" expire, ")
                withStyle(SpanStyle(color = colors.accent, fontWeight = FontWeight.SemiBold)) {
                    append("subscriptions")
                }
                append(" renew, or important ")
                withStyle(SpanStyle(color = colors.accent, fontWeight = FontWeight.SemiBold)) {
                    append("documents")
                }
                append(" need your attention.")
            },
        )
    }
}

@Composable
private fun OnboardingTitle(text: String) {
    val colors = LocalBillBoxColors.current
    Text(
        text = text,
        style = MaterialTheme.typography.headlineMedium,
        color = colors.textPrimary,
        fontWeight = FontWeight.Bold,
        textAlign = TextAlign.Center,
        modifier = Modifier.padding(top = Spacing.lg, start = Spacing.md, end = Spacing.md),
    )
}

@Composable
private fun OnboardingBody(text: String) {
    val colors = LocalBillBoxColors.current
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        color = colors.textSecondary,
        textAlign = TextAlign.Center,
        lineHeight = 22.sp,
        modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.md),
    )
}

@Composable
private fun OnboardingBody(text: androidx.compose.ui.text.AnnotatedString) {
    val colors = LocalBillBoxColors.current
    Text(
        text = text,
        style = MaterialTheme.typography.bodyMedium,
        color = colors.textSecondary,
        textAlign = TextAlign.Center,
        lineHeight = 22.sp,
        modifier = Modifier.padding(horizontal = Spacing.lg, vertical = Spacing.md),
    )
}

@Composable
private fun FeatureHighlightCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String,
) {
    val colors = LocalBillBoxColors.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.md, vertical = Spacing.sm),
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp),
    ) {
        Row(
            modifier = Modifier.padding(Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(BrandTeal.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = BrandTeal)
            }
            Column {
                Text(title, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                Text(
                    description,
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textSecondary,
                )
            }
        }
    }
}

@Composable
private fun NotificationStack() {
    val colors = LocalBillBoxColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.lg)
            .height(220.dp),
        verticalArrangement = Arrangement.spacedBy((-16).dp),
    ) {
        NotificationCard(
            label = "WARRANTY EXPIRY",
            timeLabel = "2m ago",
            title = "MacBook Pro M3",
            description = "Your premium warranty coverage expires in 7 days. Tap to renew or claim.",
            accentColor = BrandTeal,
            icon = Icons.Default.AccessTime,
            backgroundColor = BrandTeal.copy(alpha = 0.08f),
        )
        NotificationCard(
            label = "UPCOMING ALERT",
            timeLabel = "NOW",
            title = "Tesla Service Due",
            description = "Maintenance check required for model Year 2023. Book service now to avoid fees.",
            accentColor = colors.primary,
            icon = Icons.Default.Notifications,
            borderWidth = 2.dp,
            modifier = Modifier.padding(start = Spacing.sm),
        )
        NotificationCard(
            label = "SUBSCRIPTION RENEWAL",
            timeLabel = null,
            title = "Cloud Storage Pro",
            description = null,
            accentColor = colors.textTertiary,
            icon = Icons.Default.CalendarToday,
            modifier = Modifier.padding(start = Spacing.md),
        )
    }
}

@Composable
private fun NotificationCard(
    label: String,
    timeLabel: String?,
    title: String,
    description: String?,
    accentColor: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    modifier: Modifier = Modifier,
    backgroundColor: Color = Color.Unspecified,
    borderWidth: androidx.compose.ui.unit.Dp = 1.dp,
) {
    val colors = LocalBillBoxColors.current
    val containerColor = if (backgroundColor == Color.Unspecified) colors.surface else backgroundColor

    Card(
        modifier = modifier
            .fillMaxWidth()
            .border(borderWidth, accentColor.copy(alpha = if (borderWidth > 1.dp) 1f else 0.35f), RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = containerColor),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(
            modifier = Modifier.padding(Spacing.md),
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(16.dp))
            }
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.labelSmall,
                        color = colors.textTertiary,
                        fontWeight = FontWeight.Medium,
                    )
                    if (timeLabel != null) {
                        Text(
                            text = timeLabel,
                            style = MaterialTheme.typography.labelSmall,
                            color = colors.textTertiary,
                        )
                    }
                }
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary,
                    modifier = Modifier.padding(top = 2.dp),
                )
                if (description != null) {
                    Text(
                        text = description,
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                        modifier = Modifier.padding(top = 2.dp),
                    )
                }
            }
        }
    }
}
