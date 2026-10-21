package com.app.billbox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing

@Composable
fun FilterChipRow(
    items: List<String>,
    selectedItem: String?,
    onItemSelected: (String) -> Unit,
    modifier: Modifier = Modifier,
    showAll: Boolean = true,
) {
    val colors = LocalBillBoxColors.current
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) {
        if (showAll) {
            FilterChipItem(
                label = "All",
                selected = selectedItem == null,
                onClick = { onItemSelected("") },
            )
        }
        items.forEach { item ->
            FilterChipItem(
                label = item,
                selected = selectedItem == item,
                onClick = { onItemSelected(item) },
            )
        }
    }
}

@Composable
fun FilterChipItem(
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
            selectedContainerColor = colors.accent,
            selectedLabelColor = colors.onAccent,
            containerColor = colors.surfaceVariant,
            labelColor = colors.textSecondary,
        ),
    )
}

@Composable
fun StepProgressBar(
    currentStep: Int,
    totalSteps: Int,
    stepLabels: List<String>,
    modifier: Modifier = Modifier,
) {
    val colors = LocalBillBoxColors.current
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(Spacing.sm),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(Spacing.xs),
        ) {
            repeat(totalSteps) { index ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .size(height = 4.dp, width = 0.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            if (index <= currentStep) colors.accent
                            else colors.border,
                        ),
                )
            }
        }
        if (currentStep < stepLabels.size) {
            Text(
                text = "Step ${currentStep + 1} of $totalSteps: ${stepLabels[currentStep]}",
                style = MaterialTheme.typography.labelMedium,
                color = colors.textSecondary,
            )
        }
    }
}

@Composable
fun SwitchRow(
    label: String,
    description: String? = null,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalBillBoxColors.current
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = Spacing.sm),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyLarge,
                color = colors.textPrimary,
            )
            description?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textSecondary,
                )
            }
        }
        androidx.compose.material3.Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = androidx.compose.material3.SwitchDefaults.colors(
                checkedThumbColor = colors.onPrimary,
                checkedTrackColor = colors.accent,
            ),
        )
    }
}

@Composable
fun BillBoxSearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    placeholder: String = "Search products...",
    modifier: Modifier = Modifier,
) {
    BillBoxTextField(
        value = query,
        onValueChange = onQueryChange,
        label = placeholder,
        modifier = modifier,
    )
}
