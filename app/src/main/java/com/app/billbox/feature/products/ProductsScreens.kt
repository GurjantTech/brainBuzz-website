package com.app.billbox.feature.products

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Store
import androidx.compose.material.icons.filled.Wallet
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.app.billbox.domain.model.ExtractedFieldType
import com.app.billbox.domain.model.Product
import com.app.billbox.domain.model.WarrantyStatus
import com.app.billbox.ui.components.BillBoxSearchBar
import com.app.billbox.ui.components.BillBoxTextField
import com.app.billbox.ui.components.BillBoxTopBar
import com.app.billbox.ui.components.EmptyState
import com.app.billbox.ui.components.FilterChipRow
import com.app.billbox.ui.components.PrimaryButton
import com.app.billbox.ui.components.ProductCard
import com.app.billbox.ui.components.ScreenContainer
import com.app.billbox.ui.components.SecondaryButton
import com.app.billbox.ui.theme.BrandTealDark
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing
import com.app.billbox.util.DateUtils
import coil3.compose.AsyncImage
import java.util.concurrent.TimeUnit

@Composable
fun MyProductsScreen(
    viewModel: ProductsViewModel,
    onProductClick: (Long) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val products by viewModel.products.collectAsStateWithLifecycle()
    val sortedProducts = viewModel.sortedProducts(products)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(vertical = Spacing.md),
        verticalArrangement = Arrangement.spacedBy(Spacing.md),
    ) {
        ScreenContainer {
            Text(
                text = "My Products",
                style = MaterialTheme.typography.headlineMedium,
                color = LocalBillBoxColors.current.textPrimary,
                fontWeight = FontWeight.Bold,
            )
            BillBoxSearchBar(
                query = uiState.searchQuery,
                onQueryChange = viewModel::updateSearchQuery,
                modifier = Modifier.padding(top = Spacing.md),
            )
        }

        ScreenContainer {
            FilterChipRow(
                items = uiState.categories,
                selectedItem = uiState.selectedCategory,
                onItemSelected = { viewModel.selectCategory(it.ifBlank { null }) },
            )
        }

        ScreenContainer {
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                ProductSort.entries.forEach { sort ->
                    SortChip(
                        label = sort.name,
                        selected = uiState.sort == sort,
                        onClick = { viewModel.setSort(sort) },
                    )
                }
            }
        }

        ScreenContainer {
            if (sortedProducts.isEmpty()) {
                EmptyState(
                    title = "No products found",
                    description = "Try adjusting your search or scan a new bill",
                )
            } else {
                sortedProducts.forEach { product ->
                    ProductCard(
                        product = product,
                        onClick = { onProductClick(product.id) },
                        modifier = Modifier.padding(bottom = Spacing.sm),
                    )
                }
            }
        }
    }
}

@Composable
private fun SortChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val colors = LocalBillBoxColors.current
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = colors.accent.copy(alpha = 0.15f),
            selectedLabelColor = BrandTealDark,
        ),
    )
}

@Composable
fun ProductDetailScreen(
    viewModel: ProductDetailViewModel,
    onBack: () -> Unit,
    onDeleted: () -> Unit,
) {
    val product by viewModel.product.collectAsStateWithLifecycle()
    val colors = LocalBillBoxColors.current
    var showEditDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background),
    ) {
        BillBoxTopBar(
            title = product?.merchant ?: product?.name ?: "Product Detail",
            showBack = true,
            onBack = onBack,
        )
        product?.let { p ->
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(Spacing.md),
                verticalArrangement = Arrangement.spacedBy(Spacing.md),
            ) {
                HeroCard(
                    productName = p.name,
                    merchant = p.merchant,
                    billImageUri = p.billImageUri,
                    warrantyStatus = p.warrantyStatus,
                    warrantyExpiry = p.warrantyExpiry,
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
                ) {
                    AttributeMiniCard(
                        icon = Icons.Default.CalendarToday,
                        label = "Purchased",
                        value = DateUtils.formatDate(p.purchaseDate),
                        modifier = Modifier.weight(1f),
                    )
                    AttributeMiniCard(
                        icon = Icons.Default.Wallet,
                        label = "Price",
                        value = DateUtils.formatAmount(p.amount, p.currencyCode),
                        modifier = Modifier.weight(1f),
                    )
                }

                AttributeMiniCard(
                    icon = Icons.Default.Store,
                    label = "Restaurant / Seller",
                    value = p.merchant ?: "—",
                )

                val summaryRows = buildList {
                    add("Currency" to p.currencyCode)

                    val cashier = p.extractedFields.firstOrNull { it.type == ExtractedFieldType.CASHIER }
                    if (cashier != null && cashier.value.isNotBlank()) {
                        add(cashier.label.ifBlank { "Cashier" } to cashier.value)
                    }

                    val itemFields = p.extractedFields.filter { it.type == ExtractedFieldType.LINE_ITEM }
                    if (itemFields.isNotEmpty()) {
                        itemFields.forEach { field ->
                            val parts = field.value.split("|").map { it.trim() }
                            val qty = parts.getOrNull(0).orEmpty()
                            val total = parts.getOrNull(2).orEmpty()
                            add(
                                "${field.label}${if (qty.isNotBlank()) " × $qty" else ""}" to
                                    total.ifBlank { field.value },
                            )
                        }
                    } else if (p.lineItems.isNotEmpty()) {
                        p.lineItems.forEach { item ->
                            add(
                                "${item.name} × ${item.quantity.cleanNumber()}" to
                                    (item.totalPrice?.let { DateUtils.formatAmount(it, p.currencyCode) } ?: "—"),
                            )
                        }
                    }

                    fun summaryValue(type: ExtractedFieldType, fallback: Double?, defaultLabel: String) {
                        val field = p.extractedFields.firstOrNull { it.type == type }
                        val raw = field?.value?.takeIf { it.isNotBlank() }
                        val label = field?.label?.takeIf { it.isNotBlank() } ?: defaultLabel
                        when {
                            raw != null -> add(label to raw)
                            fallback != null -> add(label to DateUtils.formatAmount(fallback, p.currencyCode))
                            type == ExtractedFieldType.ROUND_OFF -> Unit
                            else -> add(label to "—")
                        }
                    }

                    summaryValue(ExtractedFieldType.SUBTOTAL, p.subtotal, "Subtotal")
                    summaryValue(ExtractedFieldType.CGST, p.cgst, "CGST")
                    summaryValue(ExtractedFieldType.SGST, p.sgst, "SGST")
                    val hasRoundOff = p.extractedFields.any {
                        it.type == ExtractedFieldType.ROUND_OFF && it.value.isNotBlank()
                    }
                    if (hasRoundOff) {
                        summaryValue(ExtractedFieldType.ROUND_OFF, null, "Round Off")
                    }
                    summaryValue(ExtractedFieldType.GRAND_TOTAL, p.amount, "Grand Total")
                }

                DetailSectionCard(
                    icon = Icons.Default.Wallet,
                    title = "Bill Summary",
                    rows = summaryRows,
                )

                DetailSectionCard(
                    icon = Icons.Default.Shield,
                    title = "Warranty",
                    rows = listOf(
                        "Status" to DateUtils.warrantyStatusLabel(p.warrantyStatus),
                        "Expires" to (p.warrantyExpiry?.let { DateUtils.formatDate(it) } ?: "—"),
                    ),
                )

                DetailSectionCard(
                    icon = Icons.Default.Refresh,
                    title = "Return Window",
                    rows = listOf(
                        "Window Ends" to DateUtils.formatDate(p.purchaseDate + 7 * 24 * 60 * 60 * 1000L),
                        "Category" to p.category,
                    ),
                )

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = colors.surface),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Column(modifier = Modifier.padding(Spacing.md)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Description, null, tint = colors.primary)
                            Text(
                                "Purchase Bill",
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(start = Spacing.sm),
                                color = colors.textPrimary,
                            )
                        }
                        Text(
                            if (p.billImageUri != null) "Saved receipt image" else "No bill image available",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(top = Spacing.xs),
                        )
                        if (p.billImageUri != null) {
                            AsyncImage(
                                model = p.billImageUri,
                                contentDescription = "Saved purchase bill",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(360.dp)
                                    .padding(top = Spacing.md)
                                    .clip(RoundedCornerShape(12.dp)),
                                contentScale = ContentScale.Fit,
                            )
                        }
                    }
                }
            }

            Column(
                modifier = Modifier
                    .padding(Spacing.md)
                    .navigationBarsPadding(),
            ) {
                PrimaryButton(text = "Edit Product", onClick = { showEditDialog = true })
                SecondaryButton(
                    text = "Remove Item",
                    onClick = { viewModel.deleteProduct(onDeleted) },
                    isDanger = true,
                    modifier = Modifier.padding(top = Spacing.sm),
                )
            }

            if (showEditDialog) {
                EditProductDialog(
                    product = p,
                    onDismiss = { showEditDialog = false },
                    onSave = { name, merchant, category, amount ->
                        viewModel.updateProduct(name, merchant, category, amount)
                        showEditDialog = false
                    },
                )
            }
        } ?: EmptyState(
            title = "Product not found",
            description = "This product may have been deleted",
            modifier = Modifier.fillMaxSize(),
        )
    }
}

@Composable
private fun HeroCard(
    productName: String,
    merchant: String?,
    billImageUri: String?,
    warrantyStatus: WarrantyStatus,
    warrantyExpiry: Long?,
) {
    val colors = LocalBillBoxColors.current
    val daysRemaining = warrantyExpiry?.let {
        TimeUnit.MILLISECONDS.toDays(it - System.currentTimeMillis())
    } ?: 0L
    val progress = if (daysRemaining > 0) (daysRemaining.coerceAtMost(365) / 365f) else 0f

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(4.dp),
    ) {
        Column(modifier = Modifier.padding(Spacing.md)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(colors.surfaceVariant),
                contentAlignment = Alignment.Center,
            ) {
                if (billImageUri != null) {
                    AsyncImage(
                        model = billImageUri,
                        contentDescription = "Receipt for ${merchant ?: productName}",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop,
                    )
                } else {
                    Text(productName, fontWeight = FontWeight.Bold, color = colors.textSecondary)
                }
            }
            Text(
                text = merchant ?: productName,
                style = MaterialTheme.typography.titleLarge,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = Spacing.md),
            )
            if (merchant != null && productName != merchant) {
                Text(
                    text = productName,
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.textSecondary,
                )
            }
            Row(
                modifier = Modifier.padding(top = Spacing.md),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text("REMAINING COVERAGE", style = MaterialTheme.typography.labelSmall, color = colors.textSecondary)
                    Text(
                        text = if (daysRemaining > 0) "$daysRemaining days remaining" else "Expired",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = colors.textPrimary,
                    )
                }
                warrantyExpiry?.let {
                    Text(DateUtils.formatDate(it), style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                }
            }
            LinearProgressIndicator(
                progress = { progress.coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = Spacing.sm)
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = BrandTealDark,
                trackColor = colors.surfaceVariant,
            )
        }
    }
}

private fun Double.cleanNumber(): String =
    if (this % 1.0 == 0.0) toInt().toString() else toString()

@Composable
private fun AttributeMiniCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String,
    modifier: Modifier = Modifier,
) {
    val colors = LocalBillBoxColors.current
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        shape = RoundedCornerShape(14.dp),
    ) {
        Column(modifier = Modifier.padding(Spacing.md)) {
            Icon(icon, null, tint = colors.textSecondary, modifier = Modifier.size(20.dp))
            Text(label, style = MaterialTheme.typography.labelSmall, color = colors.textSecondary, modifier = Modifier.padding(top = Spacing.xs))
            Text(value, fontWeight = FontWeight.Bold, color = colors.textPrimary)
        }
    }
}

@Composable
private fun DetailSectionCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    rows: List<Pair<String, String>>,
) {
    val colors = LocalBillBoxColors.current
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        shape = RoundedCornerShape(16.dp),
    ) {
        Column(modifier = Modifier.padding(Spacing.md)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, null, tint = colors.primary)
                Text(title, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = Spacing.sm), color = colors.textPrimary)
            }
            rows.forEach { (label, value) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = Spacing.sm),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(label, color = colors.textSecondary)
                    Text(value, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
                }
            }
        }
    }
}

@Composable
private fun EditProductDialog(
    product: Product,
    onDismiss: () -> Unit,
    onSave: (name: String, merchant: String, category: String, amount: String) -> Unit,
) {
    val colors = LocalBillBoxColors.current
    var name by remember { mutableStateOf(product.name) }
    var merchant by remember { mutableStateOf(product.merchant ?: "") }
    var category by remember { mutableStateOf(product.category) }
    var amount by remember { mutableStateOf(product.amount?.cleanNumber() ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = colors.surface,
        title = { Text("Edit Product", fontWeight = FontWeight.Bold, color = colors.textPrimary) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                BillBoxTextField(value = name, onValueChange = { name = it }, label = "Product name")
                BillBoxTextField(value = merchant, onValueChange = { merchant = it }, label = "Restaurant / Seller")
                BillBoxTextField(value = category, onValueChange = { category = it }, label = "Category")
                BillBoxTextField(value = amount, onValueChange = { amount = it }, label = "Total amount")
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(name, merchant, category, amount) }) {
                Text("Save", color = colors.primary, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = colors.textSecondary)
            }
        },
    )
}
