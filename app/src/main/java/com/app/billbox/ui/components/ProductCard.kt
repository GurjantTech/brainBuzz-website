package com.app.billbox.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.app.billbox.domain.model.Product
import com.app.billbox.domain.model.WarrantyStatus
import com.app.billbox.ui.theme.BillboxTheme
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing
import com.app.billbox.ui.theme.ThemeMode
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ProductCard(
    product: Product,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val colors = LocalBillBoxColors.current
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
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
                    .size(48.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(colors.surfaceVariant),
                contentAlignment = Alignment.Center,
            ) {
            Icon(
                imageVector = Icons.Default.Inventory2,
                contentDescription = null,
                tint = colors.accent,
            )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = product.merchant ?: product.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = colors.textPrimary,
                    fontWeight = FontWeight.SemiBold,
                )
                if (product.merchant != null && product.merchant != product.name) {
                    Text(
                        text = product.name,
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textSecondary,
                    )
                }
                Text(
                    text = formatDate(product.purchaseDate),
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textTertiary,
                )
            }
            StatusBadge(status = product.warrantyStatus)
        }
    }
}

@Composable
fun StatusBadge(status: WarrantyStatus) {
    val colors = LocalBillBoxColors.current
    val (label, color) = when (status) {
        WarrantyStatus.Active -> "Active" to colors.warrantyActive
        WarrantyStatus.Expiring -> "Expiring" to colors.warrantyExpiring
        WarrantyStatus.Expired -> "Expired" to colors.warrantyExpired
        WarrantyStatus.None -> "No Warranty" to colors.textTertiary
    }
    Text(
        text = label,
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.15f))
            .padding(horizontal = Spacing.sm, vertical = Spacing.xs)
            ,
        style = MaterialTheme.typography.labelSmall,
        color = color,
        fontWeight = FontWeight.Medium,
    )
}

private fun formatDate(timestamp: Long): String {
    return SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(Date(timestamp))
}

@Preview(showBackground = true)
@Composable
private fun ProductCardPreview() {
    BillboxTheme(themeMode = ThemeMode.Light) {
        ProductCard(
            product = Product(
                name = "MacBook Pro",
                merchant = "Apple Store",
                purchaseDate = System.currentTimeMillis(),
                warrantyStatus = WarrantyStatus.Active,
            ),
            onClick = {},
            modifier = Modifier.padding(Spacing.md),
        )
    }
}
