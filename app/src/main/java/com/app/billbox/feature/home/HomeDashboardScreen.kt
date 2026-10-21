package com.app.billbox.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.app.billbox.domain.model.Product
import com.app.billbox.domain.model.Reminder
import com.app.billbox.domain.model.ReminderType
import com.app.billbox.domain.model.WarrantyStatus
import com.app.billbox.ui.components.EmptyState
import com.app.billbox.ui.components.ScreenContainer
import com.app.billbox.ui.components.StatusBadge
import com.app.billbox.ui.theme.BrandTeal
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing
import com.app.billbox.util.DateUtils
import java.util.Calendar
import java.util.concurrent.TimeUnit

@Composable
fun HomeDashboardScreen(
    viewModel: HomeViewModel,
    onScanBill: () -> Unit,
    onProductClick: (Long) -> Unit,
    onViewAllProducts: () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    val stats by viewModel.stats.collectAsStateWithLifecycle()
    val recentProducts by viewModel.recentProducts.collectAsStateWithLifecycle()
    val upcomingReminders by viewModel.upcomingReminders.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .background(colors.background)
            .padding(vertical = Spacing.md)
            .navigationBarsPadding(),
        verticalArrangement = Arrangement.spacedBy(Spacing.lg),
    ) {
        ScreenContainer {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        text = "${greetingForCurrentTime()} 👋",
                        style = MaterialTheme.typography.headlineMedium,
                        color = colors.textPrimary,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "Your protection dashboard",
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.textSecondary,
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    Icon(
                        Icons.Filled.Search,
                        contentDescription = "Search",
                        tint = colors.textSecondary
                    )
                    Box {
                        Icon(
                            Icons.Filled.Notifications,
                            contentDescription = "Notifications",
                            tint = colors.textSecondary
                        )
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(colors.error)
                                .align(Alignment.TopEnd),
                        )
                    }
                }
            }
        }

        ProtectionSummaryCard(
            totalProducts = stats.totalProducts,
            active = stats.totalProducts - stats.expiringSoon,
            expiring = stats.expiringSoon,
            expired = 0,
        )

        ScreenContainer {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = "Needs Attention",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary,
                )
                Text(
                    text = "View All",
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable(onClick = onViewAllProducts)
                        .padding(horizontal = Spacing.sm, vertical = Spacing.xs),
                    style = MaterialTheme.typography.labelMedium,
                    color = colors.accent,
                    fontWeight = FontWeight.SemiBold,
                )
            }
            if (upcomingReminders.isEmpty()) {
                EmptyState(
                    title = "All caught up!",
                    description = "No urgent reminders right now",
                )
            } else {
                upcomingReminders.forEach { reminder ->
                    AttentionCard(
                        reminder = reminder,
                        onClick = { onProductClick(reminder.productId) },
                    )
                }
            }
        }

        ScreenContainer {
            Text(
                text = "Recent Products",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary,
            )
            if (recentProducts.isEmpty()) {
                EmptyState(
                    title = "No products yet",
                    description = "Tap SCAN to add your first bill",
                )
            } else {
                recentProducts.forEach { product ->
                    PremiumProductCard(
                        product = product,
                        onClick = { onProductClick(product.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun ProtectionSummaryCard(
    totalProducts: Int,
    active: Int,
    expiring: Int,
    expired: Int,
) {
    val colors = LocalBillBoxColors.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Spacing.md),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(colors.primary, colors.primary.copy(alpha = 0.85f)),
                    ),
                )
                .padding(Spacing.lg),
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(
                        text = "YOUR PROTECTION",
                        style = MaterialTheme.typography.labelSmall,
                        color = colors.accent,
                        fontWeight = FontWeight.Bold,
                    )
                    Icon(
                        Icons.Filled.Shield,
                        contentDescription = null,
                        tint = colors.accent,
                        modifier = Modifier.size(28.dp)
                    )
                }
                Text(
                    text = "$totalProducts Products tracked",
                    style = MaterialTheme.typography.headlineMedium,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = Spacing.sm),
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = Spacing.lg),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                ) {
                    StatPill("Active", active.toString(), Color(0xFF22C55E))
                    StatPill("Expiring", expiring.toString(), Color(0xFFF59E0B))
                    StatPill("Expired", expired.toString(), Color(0xFFEF4444))
                }
            }
        }
    }
}

@Composable
private fun StatPill(label: String, value: String, dotColor: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color.White.copy(alpha = 0.12f))
            .padding(horizontal = Spacing.md, vertical = Spacing.sm),
    ) {
        Column {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(dotColor))
                Text(
                    label, style = MaterialTheme.typography.labelSmall,
                    color = Color.White.copy(alpha = 0.7f)
                )
            }
            Text(
                value,
                style = MaterialTheme.typography.titleLarge,
                color = Color.White,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun AttentionCard(
    reminder: Reminder,
    onClick: () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    val days = TimeUnit.MILLISECONDS.toDays(reminder.dueDate - System.currentTimeMillis())
    val badgeColor = when {
        days <= 3 -> colors.error
        days <= 7 -> colors.warrantyExpiring
        else -> colors.accent
    }
    val icon = when (reminder.type) {
        ReminderType.Warranty -> Icons.Filled.Notifications
        ReminderType.Return -> Icons.Filled.Replay
        ReminderType.Service -> Icons.Filled.Inventory2
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Spacing.xs),
        onClick = onClick,
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(2.dp),
    ) {
        Row(
            modifier = Modifier.padding(Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(colors.accent.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, null, tint = colors.accent)
            }
            Column(modifier = Modifier
                .weight(1f)
                .padding(horizontal = Spacing.md)) {
                Text(reminder.productName, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                Text(
                    text = when (reminder.type) {
                        ReminderType.Warranty -> "Warranty expires soon"
                        ReminderType.Return -> "Return window closing"
                        ReminderType.Service -> "Service due soon"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textSecondary,
                )
            }
            Text(
                text = when {
                    days < 0 -> "Overdue"
                    days == 0L -> "Today"
                    else -> "$days Days"
                },
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .background(badgeColor.copy(alpha = 0.12f))
                    .padding(horizontal = Spacing.sm, vertical = Spacing.xs),
                color = badgeColor,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
private fun PremiumProductCard(product: Product, onClick: () -> Unit) {
    val colors = LocalBillBoxColors.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Spacing.xs)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(2.dp),
    ) {
        Row(
            modifier = Modifier.padding(Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.surfaceVariant),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Filled.Inventory2,
                    contentDescription = null,
                    tint = colors.primary,
                    modifier = Modifier.size(28.dp)
                )
            }
            Column(modifier = Modifier
                .weight(1f)
                .padding(horizontal = Spacing.md)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(product.merchant ?: product.name,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary,
                        modifier = Modifier.weight(1f))
                    Spacer(modifier = Modifier.size(Spacing.sm))
                    StatusBadge(status = product.warrantyStatus)
                }
                if (product.merchant != null && product.merchant != product.name) {
                    Text(
                        product.name,
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary
                    )
                }
                product.amount?.let {
                    Text(
                        DateUtils.formatAmount(it, product.currencyCode),
                        style = MaterialTheme.typography.titleSmall,
                        color = colors.accent,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
            Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = colors.textTertiary)
        }
    }
}

private fun greetingForCurrentTime(): String {
    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    return when (hour) {
        in 5..11 -> "Good morning"
        in 12..16 -> "Good afternoon"
        in 17..20 -> "Good evening"
        else -> "Good night"
    }
}
