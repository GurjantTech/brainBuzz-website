package com.app.billbox.feature.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.app.billbox.ui.components.PrimaryButton
import com.app.billbox.ui.components.ScreenContainer
import com.app.billbox.ui.components.SwitchRow
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing
import com.app.billbox.ui.theme.ThemeMode

@Composable
fun ProfileSettingsScreen(
    viewModel: ProfileViewModel,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val colors = LocalBillBoxColors.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(vertical = Spacing.md),
        verticalArrangement = Arrangement.spacedBy(Spacing.lg),
    ) {
        ScreenContainer {
            Text(
                text = "Profile & Settings",
                style = MaterialTheme.typography.headlineMedium,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold,
            )
        }

        SettingsSection(title = "Appearance") {
            ThemeMode.entries.forEach { mode ->
                ThemeOptionRow(
                    label = when (mode) {
                        ThemeMode.Light -> "Light"
                        ThemeMode.Dark -> "Dark"
                        ThemeMode.System -> "System Default"
                    },
                    selected = uiState.themeMode == mode,
                    onClick = { viewModel.setThemeMode(mode) },
                )
            }
        }

        SettingsSection(title = "Notifications") {
            SwitchRow(
                label = "Reminder Notifications",
                description = "Get notified for warranty and return reminders",
                checked = uiState.notificationsEnabled,
                onCheckedChange = viewModel::setNotificationsEnabled,
            )
        }

        SettingsSection(title = "Backup") {
            PrimaryButton(
                text = if (uiState.isExporting) "Exporting..." else "Export Backup",
                onClick = viewModel::exportBackup,
                enabled = !uiState.isExporting,
            )
            uiState.exportMessage?.let { message ->
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textSecondary,
                    modifier = Modifier.padding(top = Spacing.sm),
                )
            }
        }

        SettingsSection(title = "Account") {
            Text(
                text = "Login & Cloud Sync",
                style = MaterialTheme.typography.bodyLarge,
                color = colors.textPrimary,
            )
            Text(
                text = "Coming soon",
                style = MaterialTheme.typography.bodySmall,
                color = colors.textTertiary,
            )
        }

        SettingsSection(title = "About") {
            InfoSettingRow("Version", "1.0.0")
            InfoSettingRow("App", "BillBox")
            InfoSettingRow("Privacy", "Your data stays on your device")
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    ScreenContainer {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = colors.textPrimary,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(bottom = Spacing.sm),
        )
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = colors.surface),
            shape = RoundedCornerShape(12.dp),
        ) {
            Column(modifier = Modifier.padding(Spacing.md)) {
                content()
            }
        }
    }
}

@Composable
private fun ThemeOptionRow(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .clickable(onClick = onClick)
            .padding(vertical = Spacing.sm),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyLarge, color = colors.textPrimary)
        if (selected) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                tint = colors.primary,
            )
        }
    }
}

@Composable
private fun InfoSettingRow(label: String, value: String) {
    val colors = LocalBillBoxColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Spacing.sm),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium, color = colors.textSecondary)
        Text(text = value, style = MaterialTheme.typography.bodyMedium, color = colors.textPrimary)
    }
}
