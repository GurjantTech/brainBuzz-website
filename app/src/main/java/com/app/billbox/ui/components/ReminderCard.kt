package com.app.billbox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.app.billbox.domain.model.Reminder
import com.app.billbox.domain.model.ReminderType
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

@Composable
fun ReminderCard(
    reminder: Reminder,
    modifier: Modifier = Modifier,
) {
    val colors = LocalBillBoxColors.current
    val typeColor = reminderTypeColor(reminder.type, colors)
    val daysRemaining = TimeUnit.MILLISECONDS.toDays(reminder.dueDate - System.currentTimeMillis())

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp),
    ) {
        Row(
            modifier = Modifier.padding(Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(typeColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = reminderTypeIcon(reminder.type),
                    contentDescription = null,
                    tint = typeColor,
                    modifier = Modifier.size(20.dp),
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = reminder.productName,
                    style = MaterialTheme.typography.titleSmall,
                    color = colors.textPrimary,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = "${reminder.type.name} · ${formatDate(reminder.dueDate)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textSecondary,
                )
            }
            Text(
                text = when {
                    daysRemaining < 0 -> "Overdue"
                    daysRemaining == 0L -> "Today"
                    daysRemaining == 1L -> "1 day"
                    else -> "$daysRemaining days"
                },
                style = MaterialTheme.typography.labelMedium,
                color = if (daysRemaining <= 7) colors.warrantyExpiring else colors.textSecondary,
            )
        }
    }
}

private fun reminderTypeIcon(type: ReminderType): ImageVector = when (type) {
    ReminderType.Warranty -> Icons.Default.Notifications
    ReminderType.Return -> Icons.Default.Replay
    ReminderType.Service -> Icons.Default.Build
}

private fun reminderTypeColor(type: ReminderType, colors: com.app.billbox.ui.theme.BillBoxColors): Color =
    when (type) {
        ReminderType.Warranty -> colors.warrantyActive
        ReminderType.Return -> colors.reminderReturn
        ReminderType.Service -> colors.reminderService
    }

private fun formatDate(timestamp: Long): String {
    return SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(Date(timestamp))
}

@Composable
private fun Box(
    modifier: Modifier = Modifier,
    contentAlignment: Alignment = Alignment.TopStart,
    content: @Composable () -> Unit,
) {
    androidx.compose.foundation.layout.Box(
        modifier = modifier,
        contentAlignment = contentAlignment,
        content = { content() },
    )
}
