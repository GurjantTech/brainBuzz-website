package com.app.billbox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DocumentScanner
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.app.billbox.navigation.MainTab
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing

@Composable
fun BillBoxBottomNav(
    currentTab: MainTab,
    onTabSelected: (MainTab) -> Unit,
    onScanClick: () -> Unit,
) {
    val colors = LocalBillBoxColors.current

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .height(106.dp),
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(84.dp)
                .align(Alignment.BottomCenter),
            color = colors.surface,
            shadowElevation = 8.dp,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = Spacing.xs, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                NavItem(
                    icon = Icons.Default.Home,
                    label = "HOME",
                    selected = currentTab == MainTab.Home,
                    onClick = { onTabSelected(MainTab.Home) },
                )
                NavItem(
                    icon = Icons.Default.Inventory2,
                    label = "PRODUCTS",
                    selected = currentTab == MainTab.Products,
                    onClick = { onTabSelected(MainTab.Products) },
                )
                Spacer(modifier = Modifier.size(width = 72.dp, height = 48.dp))
                NavItem(
                    icon = Icons.Default.Notifications,
                    label = "ALERTS",
                    selected = currentTab == MainTab.Reminders,
                    onClick = { onTabSelected(MainTab.Reminders) },
                )
                NavItem(
                    icon = Icons.Default.Person,
                    label = "PROFILE",
                    selected = currentTab == MainTab.Profile,
                    onClick = { onTabSelected(MainTab.Profile) },
                )
            }
        }

        ScanFab(
            onClick = onScanClick,
            modifier = Modifier.align(Alignment.TopCenter),
        )
    }
}

@Composable
private fun NavItem(
    icon: ImageVector,
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = Spacing.sm, vertical = 2.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Box(
            modifier = Modifier
                .size(38.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(if (selected) colors.accent.copy(alpha = 0.2f) else androidx.compose.ui.graphics.Color.Transparent),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = if (selected) colors.accent else colors.textTertiary,
                modifier = Modifier.size(22.dp),
            )
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(
                fontSize = 9.sp,
                lineHeight = 12.sp,
            ),
            color = if (selected) colors.accent else colors.textTertiary,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
        )
    }
}

@Composable
private fun ScanFab(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalBillBoxColors.current
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier,
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(colors.primary)
                .clickable(onClick = onClick),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = Icons.Default.DocumentScanner,
                contentDescription = "Scan",
                tint = colors.onPrimary,
                modifier = Modifier.size(30.dp),
            )
        }
        Text(
            text = "SCAN",
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
            color = colors.primary,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 3.dp),
        )
    }
}

@Composable
fun PageIndicator(
    pageCount: Int,
    currentPage: Int,
    modifier: Modifier = Modifier,
) {
    val colors = LocalBillBoxColors.current
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(pageCount) { index ->
            Box(
                modifier = Modifier
                    .then(
                        if (index == currentPage) {
                            Modifier
                                .size(width = 24.dp, height = 8.dp)
                                .clip(RoundedCornerShape(4.dp))
                        } else {
                            Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                        },
                    )
                    .background(
                        if (index == currentPage) colors.primary
                        else colors.border,
                    ),
            )
        }
    }
}
