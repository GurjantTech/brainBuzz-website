package com.app.billbox.feature.reminders

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.app.billbox.domain.model.ReminderType
import com.app.billbox.ui.components.EmptyState
import com.app.billbox.ui.components.ReminderCard
import com.app.billbox.ui.components.ScreenContainer
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing

@Composable
fun RemindersScreen(
    viewModel: RemindersViewModel,
) {
    val selectedType by viewModel.selectedType.collectAsStateWithLifecycle()
    val reminders by viewModel.reminders.collectAsStateWithLifecycle()
    val colors = LocalBillBoxColors.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(vertical = Spacing.md),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        ScreenContainer {
            Text(
                text = "Reminders",
                style = MaterialTheme.typography.headlineMedium,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold,
            )
            Row(
                modifier = Modifier.padding(top = Spacing.md),
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
            ) {
                ReminderTypeChip("All", selectedType == null) { viewModel.selectType(null) }
                ReminderType.entries.forEach { type ->
                    ReminderTypeChip(type.name, selectedType == type) {
                        viewModel.selectType(type)
                    }
                }
            }
        }

        ScreenContainer {
            if (reminders.isEmpty()) {
                EmptyState(
                    title = "No reminders",
                    description = "Reminders will appear when you save products with alerts",
                )
            } else {
                reminders.forEach { reminder ->
                    ReminderCard(
                        reminder = reminder,
                        modifier = Modifier.padding(bottom = Spacing.sm),
                    )
                }
            }
        }
    }
}

@Composable
private fun ReminderTypeChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = colors.primary,
            selectedLabelColor = colors.onPrimary,
            containerColor = colors.surfaceVariant,
            labelColor = colors.textSecondary,
        ),
    )
}
