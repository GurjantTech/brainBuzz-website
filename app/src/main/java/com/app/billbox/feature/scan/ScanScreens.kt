package com.app.billbox.feature.scan

import android.Manifest
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.PictureAsPdf
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.app.billbox.domain.model.ExtractedField
import com.app.billbox.domain.model.ExtractedFieldType
import com.app.billbox.ui.components.BillBoxTextButton
import com.app.billbox.ui.components.BillBoxTextField
import com.app.billbox.ui.components.BillBoxTopBar
import com.app.billbox.ui.components.PrimaryButton
import com.app.billbox.ui.components.ScreenContainer
import com.app.billbox.ui.components.SecondaryButton
import com.app.billbox.ui.components.StepProgressBar
import com.app.billbox.ui.components.SuccessScreen
import com.app.billbox.ui.components.SwitchRow
import com.app.billbox.ui.theme.LocalBillBoxColors
import com.app.billbox.ui.theme.Spacing
import com.app.billbox.util.DateUtils
import androidx.compose.ui.text.input.KeyboardType
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import coil3.compose.AsyncImage
import java.io.File
private val scanSteps = listOf("Review", "Warranty", "Reminders", "Done")

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun SourcePickerSheet(
    onDismiss: () -> Unit,
    onCameraSelected: () -> Unit,
    onGallerySelected: (Uri) -> Unit,
    onPdfSelected: (Uri) -> Unit,
) {
    val colors = LocalBillBoxColors.current
    val sheetState = rememberModalBottomSheetState()
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent(),
    ) { uri -> uri?.let { onGallerySelected(it) } }

    val pdfLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
    ) { uri -> uri?.let { onPdfSelected(it) } }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = colors.surface,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Spacing.lg),
            verticalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            Text(
                text = "Scan Bill",
                style = MaterialTheme.typography.headlineMedium,
                color = colors.textPrimary,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Choose how you want to import your document for secure processing.",
                style = MaterialTheme.typography.bodyMedium,
                color = colors.textSecondary,
            )
            SourceOption(
                icon = Icons.Default.CameraAlt,
                title = "Take Photo",
                description = "Capture a new bill using your device's camera.",
                iconBackground = colors.iconBgCamera,
                iconTint = colors.accent,
                onClick = {
                    onDismiss()
                    onCameraSelected()
                },
            )
            SourceOption(
                icon = Icons.Default.Image,
                title = "Choose from Gallery",
                description = "Select an existing image from your photo library.",
                iconBackground = colors.iconBgGallery,
                iconTint = colors.primary,
                onClick = { galleryLauncher.launch("image/*") },
            )
            SourceOption(
                icon = Icons.Default.PictureAsPdf,
                title = "Upload PDF",
                description = "Upload a digital document or receipt PDF.",
                iconBackground = colors.iconBgPdf,
                iconTint = Color(0xFFEA580C),
                onClick = { pdfLauncher.launch(arrayOf("application/pdf")) },
            )
        }
    }
}

@Composable
private fun SourceOption(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    description: String,
    iconBackground: Color,
    iconTint: Color,
    onClick: () -> Unit,
) {
    val colors = LocalBillBoxColors.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = colors.surface),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(16.dp),
    ) {
        Row(
            modifier = Modifier.padding(Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .clip(CircleShape)
                    .background(iconBackground),
                contentAlignment = Alignment.Center,
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(26.dp))
            }
            Column {
                Text(text = title, style = MaterialTheme.typography.titleMedium, color = colors.textPrimary, fontWeight = FontWeight.SemiBold)
                Text(text = description, style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
            }
        }
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun CameraCaptureScreen(
    onImageCaptured: (Uri) -> Unit,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val colors = LocalBillBoxColors.current
    val cameraPermission = rememberPermissionState(Manifest.permission.CAMERA)
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }

    LaunchedEffect(Unit) {
        if (!cameraPermission.status.isGranted) {
            cameraPermission.launchPermissionRequest()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        BillBoxTopBar(title = "Capture Bill", showBack = true, onBack = onBack)
        if (!cameraPermission.status.isGranted) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
                Text("Camera permission required", color = colors.textSecondary)
            }
        } else {
            Box(modifier = Modifier.weight(1f)) {
                AndroidView(
                    factory = { ctx ->
                        PreviewView(ctx).also { previewView ->
                            val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                            cameraProviderFuture.addListener({
                                val cameraProvider = cameraProviderFuture.get()
                                val preview = Preview.Builder().build().also {
                                    it.surfaceProvider = previewView.surfaceProvider
                                }
                                val capture = ImageCapture.Builder().build()
                                imageCapture = capture
                                cameraProvider.unbindAll()
                                cameraProvider.bindToLifecycle(
                                    lifecycleOwner,
                                    CameraSelector.DEFAULT_BACK_CAMERA,
                                    preview,
                                    capture,
                                )
                            }, ContextCompat.getMainExecutor(ctx))
                        }
                    },
                    modifier = Modifier.fillMaxSize(),
                )
            }
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(Spacing.lg),
                contentAlignment = Alignment.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(colors.primary)
                        .clickable {
                            val capture = imageCapture ?: return@clickable
                            val photoFile = File(
                                context.cacheDir,
                                "bill_${System.currentTimeMillis()}.jpg",
                            )
                            val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()
                            capture.takePicture(
                                outputOptions,
                                ContextCompat.getMainExecutor(context),
                                object : ImageCapture.OnImageSavedCallback {
                                    override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                                        onImageCaptured(Uri.fromFile(photoFile))
                                    }

                                    override fun onError(exception: ImageCaptureException) {
                                    }
                                },
                            )
                        },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = "Capture",
                        tint = colors.onPrimary,
                        modifier = Modifier.size(32.dp),
                    )
                }
            }
        }
    }
}

@Composable
fun ScanProcessingScreen(
    viewModel: ScanViewModel,
    onComplete: () -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val colors = LocalBillBoxColors.current
    var progress by remember { mutableStateOf(0.84f) }

    LaunchedEffect(Unit) {
        progress = 0.84f
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .padding(Spacing.md),
    ) {
        BillBoxTopBar(title = "Scan Bill", showBack = true, onBack = onBack)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(Spacing.xs)) {
                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(colors.accent))
                Text("SCANNING YOUR BILL...", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            }
            Text("${(progress * 100).toInt()}% complete", color = colors.textSecondary, style = MaterialTheme.typography.labelMedium)
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(vertical = Spacing.md)
                .clip(RoundedCornerShape(16.dp))
                .background(colors.primary.copy(alpha = 0.9f)),
            contentAlignment = Alignment.Center,
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("EXTRACTING DATA...", color = colors.accent, fontWeight = FontWeight.Bold)
                Text("PARSING VENDOR...", color = Color.White.copy(alpha = 0.7f), modifier = Modifier.padding(top = Spacing.sm))
            }
        }
        Text(
            "Intelligent OCR Engine Active",
            style = MaterialTheme.typography.labelSmall,
            color = colors.textTertiary,
        )
        SecondaryButton(
            text = "Cancel Scan",
            onClick = onBack,
            modifier = Modifier.padding(top = Spacing.md),
        )
    }

    LaunchedEffect(uiState.isProcessing, uiState.error) {
        if (!uiState.isProcessing) onComplete()
    }
}

@Composable
fun ReviewExtractedDataScreen(
    viewModel: ScanViewModel,
    onContinue: () -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val draft = uiState.draft

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(LocalBillBoxColors.current.background)
            .systemBarsPadding(),
    ) {
        BillBoxTopBar(title = "Review Extracted Data", showBack = true, onBack = onBack)
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(Spacing.md),
            verticalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = LocalBillBoxColors.current.surface),
                shape = RoundedCornerShape(16.dp),
            ) {
                Column(modifier = Modifier.padding(Spacing.md)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text("Your Document", fontWeight = FontWeight.Bold)
                        Text(
                            "✔ Verified OCR",
                            color = LocalBillBoxColors.current.accent,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(260.dp)
                            .padding(top = Spacing.sm)
                            .clip(RoundedCornerShape(12.dp))
                            .background(LocalBillBoxColors.current.surfaceVariant),
                        contentAlignment = Alignment.Center,
                    ) {
                        AsyncImage(
                            model = draft.billImageUri,
                            contentDescription = "Captured bill",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Fit,
                        )
                    }
                }
            }

            Text(
                text = "Information Review",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
            )
            Text(
                text = "Verify and edit the automatically extracted details below.",
                style = MaterialTheme.typography.bodySmall,
                color = LocalBillBoxColors.current.textSecondary,
            )

            BillBoxTextField(value = draft.category, onValueChange = viewModel::updateCategory, label = "Category")
            BillBoxTextField(
                value = draft.currencyCode,
                onValueChange = viewModel::updateCurrencyCode,
                label = "Currency",
            )

            if (draft.extractedFields.isNotEmpty()) {
                val detailFields = draft.detailFields()
                if (detailFields.isNotEmpty()) {
                    Text(
                        "Bill details",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                    )
                    detailFields.forEach { field ->
                        ExtractedFieldEditor(
                            field = field,
                            onValueChange = { viewModel.updateExtractedField(field.id, it) },
                        )
                    }
                }

                Text(
                    "Bill summary",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Grand Total = Subtotal + CGST + SGST + Round Off",
                    style = MaterialTheme.typography.bodySmall,
                    color = LocalBillBoxColors.current.textSecondary,
                )

                if (draft.grandTotalRecalculated && draft.ocrGrandTotal.isNotBlank()) {
                    GrandTotalMismatchBanner(
                        ocrValue = draft.ocrGrandTotal,
                        calculatedValue = draft.amount,
                        currencyCode = draft.currencyCode,
                    )
                }

                draft.cashierField()?.let { field ->
                    ExtractedFieldEditor(
                        field = field,
                        onValueChange = { viewModel.updateExtractedField(field.id, it) },
                    )
                }
                draft.billItemFields().forEach { field ->
                    ExtractedFieldEditor(
                        field = field,
                        onValueChange = { viewModel.updateExtractedField(field.id, it) },
                    )
                }
                draft.summaryFields().forEach { field ->
                    ExtractedFieldEditor(
                        field = field,
                        onValueChange = { viewModel.updateExtractedField(field.id, it) },
                        emphasize = field.type == ExtractedFieldType.GRAND_TOTAL,
                    )
                }
            } else {
                // Fallback for older drafts / empty OCR field list
                BillBoxTextField(value = draft.merchant, onValueChange = viewModel::updateMerchant, label = "Restaurant / Seller")
                BillBoxTextField(value = draft.productName, onValueChange = viewModel::updateProductName, label = "Primary item")
                BillBoxTextField(value = DateUtils.formatDate(draft.purchaseDate), onValueChange = {}, label = "Bill date", readOnly = true)
                if (draft.lineItems.isNotEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = LocalBillBoxColors.current.surface),
                        shape = RoundedCornerShape(16.dp),
                    ) {
                        Column(
                            modifier = Modifier.padding(Spacing.md),
                            verticalArrangement = Arrangement.spacedBy(Spacing.sm),
                        ) {
                            Text("Items", fontWeight = FontWeight.Bold)
                            draft.lineItems.forEach { item ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Text(
                                        "${item.name} × ${item.quantity.cleanNumber()}",
                                        modifier = Modifier.weight(1f),
                                    )
                                    Text(
                                        item.totalPrice?.let {
                                            DateUtils.formatAmount(it, draft.currencyCode)
                                        }.orEmpty(),
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                }
                            }
                        }
                    }
                }
                Text("Bill summary", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                BillBoxTextField(value = draft.subtotal, onValueChange = viewModel::updateSubtotal, label = "Subtotal")
                BillBoxTextField(value = draft.cgst, onValueChange = viewModel::updateCgst, label = "CGST")
                BillBoxTextField(value = draft.sgst, onValueChange = viewModel::updateSgst, label = "SGST")
                BillBoxTextField(value = draft.amount, onValueChange = viewModel::updateAmount, label = "Grand Total")
            }
        }
        Row(
            modifier = Modifier.padding(Spacing.md),
            horizontalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            BillBoxTextButton(text = "Cancel", onClick = onBack, modifier = Modifier.weight(1f))
            PrimaryButton(
                text = "Continue",
                onClick = onContinue,
                modifier = Modifier.weight(2f),
                showArrow = true,
            )
        }
    }
}

@Composable
private fun GrandTotalMismatchBanner(
    ocrValue: String,
    calculatedValue: String,
    currencyCode: String,
) {
    val colors = LocalBillBoxColors.current
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = colors.error.copy(alpha = 0.12f)),
        shape = RoundedCornerShape(12.dp),
    ) {
        Column(
            modifier = Modifier.padding(Spacing.md),
            verticalArrangement = Arrangement.spacedBy(Spacing.xs),
        ) {
            Text(
                text = "Grand Total recalculated",
                fontWeight = FontWeight.Bold,
                color = colors.error,
            )
            Text(
                text = "OCR showed ${DateUtils.formatAmount(ocrValue.toDoubleOrNull(), currencyCode)} " +
                    "but Subtotal + CGST + SGST + Round Off = " +
                    DateUtils.formatAmount(calculatedValue.toDoubleOrNull(), currencyCode) +
                    ". The calculated value is shown below and remains editable.",
                style = MaterialTheme.typography.bodySmall,
                color = colors.textPrimary,
            )
        }
    }
}

@Composable
private fun ExtractedFieldEditor(
    field: ExtractedField,
    onValueChange: (String) -> Unit,
    emphasize: Boolean = false,
) {
    when (field.type) {
        ExtractedFieldType.LINE_ITEM -> {
            val parts = field.value.split("|").map { it.trim() }
            val qty = parts.getOrNull(0).orEmpty()
            val unit = parts.getOrNull(1).orEmpty()
            val total = parts.getOrNull(2).orEmpty()
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                Text(
                    text = field.label,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                    BillBoxTextField(
                        value = qty,
                        onValueChange = { onValueChange(listOf(it, unit, total).joinToString("|")) },
                        label = "Qty",
                        modifier = Modifier.weight(1f),
                        keyboardType = KeyboardType.Decimal,
                    )
                    BillBoxTextField(
                        value = unit,
                        onValueChange = { onValueChange(listOf(qty, it, total).joinToString("|")) },
                        label = "Price",
                        modifier = Modifier.weight(1f),
                        keyboardType = KeyboardType.Decimal,
                    )
                    BillBoxTextField(
                        value = total,
                        onValueChange = { onValueChange(listOf(qty, unit, it).joinToString("|")) },
                        label = "Amount",
                        modifier = Modifier.weight(1f),
                        keyboardType = KeyboardType.Decimal,
                    )
                }
            }
        }
        ExtractedFieldType.SUBTOTAL,
        ExtractedFieldType.DISCOUNT,
        ExtractedFieldType.CGST,
        ExtractedFieldType.SGST,
        ExtractedFieldType.IGST,
        ExtractedFieldType.SERVICE_CHARGE,
        ExtractedFieldType.ROUND_OFF,
        ExtractedFieldType.GRAND_TOTAL,
        ExtractedFieldType.TOTAL_QTY,
        -> {
            val label = if (emphasize) "${field.label} (final)" else field.label
            BillBoxTextField(
                value = field.value,
                onValueChange = onValueChange,
                label = label,
                keyboardType = KeyboardType.Decimal,
            )
        }
        else -> BillBoxTextField(
            value = field.value,
            onValueChange = onValueChange,
            label = field.label,
        )
    }
}

private fun Double.cleanNumber(): String =
    if (this % 1.0 == 0.0) toInt().toString() else toString()

@Composable
fun AddWarrantyDetailsScreen(
    viewModel: ScanViewModel,
    onContinue: () -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val draft = uiState.draft

    Column(modifier = Modifier.fillMaxSize()) {
        BillBoxTopBar(title = "Warranty Details", showBack = true, onBack = onBack)
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(Spacing.md),
            verticalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            StepProgressBar(currentStep = 1, totalSteps = 4, stepLabels = scanSteps)
            BillBoxTextField(
                value = draft.warrantyDurationMonths.toString(),
                onValueChange = { value ->
                    value.toIntOrNull()?.let { viewModel.updateWarrantyMonths(it) }
                },
                label = "Warranty Duration (months)",
            )
            draft.warrantyExpiry?.let { expiry ->
                Text(
                    text = "Expires: ${DateUtils.formatDate(expiry)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = LocalBillBoxColors.current.textSecondary,
                )
            }
        }
        PrimaryButton(
            text = "Continue",
            onClick = onContinue,
            modifier = Modifier.padding(Spacing.md),
        )
    }
}

@Composable
fun SetRemindersScreen(
    viewModel: ScanViewModel,
    onSave: () -> Unit,
    onBack: () -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val draft = uiState.draft
    val dayMs = 24 * 60 * 60 * 1000L

    Column(modifier = Modifier.fillMaxSize()) {
        BillBoxTopBar(title = "Set Reminders", showBack = true, onBack = onBack)
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(Spacing.md),
            verticalArrangement = Arrangement.spacedBy(Spacing.md),
        ) {
            StepProgressBar(currentStep = 2, totalSteps = 4, stepLabels = scanSteps)
            SwitchRow(
                label = "Warranty Reminder",
                description = "Notify before warranty expires",
                checked = draft.enableWarrantyReminder,
                onCheckedChange = viewModel::toggleWarrantyReminder,
            )
            SwitchRow(
                label = "Return Reminder",
                description = "Notify about return window",
                checked = draft.enableReturnReminder,
                onCheckedChange = { enabled ->
                    viewModel.toggleReturnReminder(enabled)
                    if (enabled) {
                        viewModel.updateDraft {
                            copy(returnReminderDate = System.currentTimeMillis() + 14 * dayMs)
                        }
                    }
                },
            )
            SwitchRow(
                label = "Service Reminder",
                description = "Notify for scheduled service",
                checked = draft.enableServiceReminder,
                onCheckedChange = { enabled ->
                    viewModel.toggleServiceReminder(enabled)
                    if (enabled) {
                        viewModel.updateDraft {
                            copy(serviceReminderDate = System.currentTimeMillis() + 90 * dayMs)
                        }
                    }
                },
            )
        }
        PrimaryButton(
            text = if (uiState.isSaving) "Saving..." else "Save Product",
            onClick = onSave,
            enabled = !uiState.isSaving,
            modifier = Modifier.padding(Spacing.md),
        )
    }
}

@Composable
fun ProductSavedScreen(
    onViewProduct: () -> Unit,
    onDone: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(Spacing.md),
        verticalArrangement = Arrangement.Center,
    ) {
        StepProgressBar(
            currentStep = 3,
            totalSteps = 4,
            stepLabels = scanSteps,
            modifier = Modifier.padding(bottom = Spacing.lg),
        )
        SuccessScreen(
            title = "All Set!",
            description = "Welcome to your dashboard.",
        )
        PrimaryButton(
            text = "View Product",
            onClick = onViewProduct,
            modifier = Modifier.padding(top = Spacing.lg),
        )
        SecondaryButton(
            text = "Done",
            onClick = onDone,
            modifier = Modifier.padding(top = Spacing.sm),
        )
    }
}
