package com.app.billbox.feature.scan

import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.billbox.data.local.ReceiptImageStore
import com.app.billbox.data.notifications.ReminderNotificationHelper
import com.app.billbox.data.repository.ProductRepository
import com.app.billbox.domain.model.ExtractedField
import com.app.billbox.domain.model.ExtractedFieldType
import com.app.billbox.domain.model.ScanDraft
import com.app.billbox.util.OcrParser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

data class ScanUiState(
    val draft: ScanDraft = ScanDraft(),
    val isProcessing: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null,
    val savedProductId: Long? = null,
)

class ScanViewModel(
    private val repository: ProductRepository,
    private val appContext: Context,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ScanUiState())
    val uiState: StateFlow<ScanUiState> = _uiState.asStateFlow()

    fun setImageUri(uri: Uri) {
        _uiState.update { it.copy(draft = it.draft.copy(billImageUri = uri.toString())) }
    }

    fun processImage(uri: Uri) {
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true, error = null) }
            var persistedImageUri: String? = null
            try {
                val result = OcrParser.recognizeText(appContext, uri)
                Log.e("OCR_Result2",result.toString())
                persistedImageUri = ReceiptImageStore.persist(appContext, uri)
                val purchaseDate = parseDate(result.date) ?: System.currentTimeMillis()
                val warrantyExpiry = ProductRepository.calculateWarrantyExpiry(purchaseDate, 12)

                _uiState.update {
                    it.copy(
                        isProcessing = false,
                        draft = it.draft.copy(
                            billImageUri = persistedImageUri,
                            merchant = result.merchant,
                            productName = result.productName,
                            amount = result.amount,
                            currencyCode = result.currencyCode,
                            subtotal = result.subtotal,
                            cgst = result.cgst,
                            sgst = result.sgst,
                            lineItems = result.lineItems,
                            extractedFields = result.extractedFields,
                            purchaseDate = purchaseDate,
                            category = "Food & Dining",
                            rawOcrText = result.rawText,
                            ocrGrandTotal = result.ocrGrandTotal,
                            grandTotalRecalculated = result.grandTotalRecalculated,
                            roundOffPresent = result.roundOffPresent,
                            warrantyExpiry = warrantyExpiry,
                        ),
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isProcessing = false,
                        error = e.message ?: "Failed to process image",
                        draft = it.draft.copy(billImageUri = persistedImageUri ?: uri.toString()),
                    )
                }
            }
        }
    }

    fun updateDraft(update: ScanDraft.() -> ScanDraft) {
        _uiState.update { it.copy(draft = it.draft.update()) }
    }

    fun updateMerchant(value: String) = updateField { copy(merchant = value) }
    fun updateProductName(value: String) = updateField { copy(productName = value) }
    fun updateCurrencyCode(value: String) = updateField { copy(currencyCode = value) }
    fun updateSubtotal(value: String) = updateField {
        withUpdatedSummary(ExtractedFieldType.SUBTOTAL, value, "Subtotal")
    }
    fun updateCgst(value: String) = updateField {
        withUpdatedSummary(ExtractedFieldType.CGST, value, "CGST")
    }
    fun updateSgst(value: String) = updateField {
        withUpdatedSummary(ExtractedFieldType.SGST, value, "SGST")
    }
    fun updateAmount(value: String) = updateField {
        val fields = extractedFields.toMutableList()
        val index = fields.indexOfFirst { it.type == ExtractedFieldType.GRAND_TOTAL }
        if (index >= 0) {
            fields[index] = fields[index].copy(value = value)
        }
        copy(extractedFields = fields, amount = value)
    }
    fun updateCategory(value: String) = updateField { copy(category = value) }
    fun updateExtractedField(fieldId: String, value: String) = updateField {
        withUpdatedField(fieldId, value)
    }

    private fun ScanDraft.withUpdatedSummary(
        type: ExtractedFieldType,
        value: String,
        label: String,
    ): ScanDraft {
        val fields = extractedFields.toMutableList()
        val index = fields.indexOfFirst { it.type == type }
        if (index >= 0) {
            fields[index] = fields[index].copy(value = value)
        } else {
            fields += ExtractedField(
                id = java.util.UUID.randomUUID().toString(),
                type = type,
                label = label,
                value = value,
            )
        }
        return copy(extractedFields = fields)
            .syncKnownFieldsFromExtracted()
            .recalculateGrandTotal(clearMismatchBanner = true)
    }
    fun updateWarrantyMonths(value: Int) = updateField {
        copy(
            warrantyDurationMonths = value,
            warrantyExpiry = ProductRepository.calculateWarrantyExpiry(purchaseDate, value),
        )
    }
    fun toggleWarrantyReminder(enabled: Boolean) = updateField { copy(enableWarrantyReminder = enabled) }
    fun toggleReturnReminder(enabled: Boolean) = updateField { copy(enableReturnReminder = enabled) }
    fun toggleServiceReminder(enabled: Boolean) = updateField { copy(enableServiceReminder = enabled) }

    fun saveProduct(onSuccess: (Long) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, error = null) }
            try {
                val productId = repository.saveProductFromScan(_uiState.value.draft)
                scheduleReminders(productId)
                _uiState.update { it.copy(isSaving = false, savedProductId = productId) }
                onSuccess(productId)
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(isSaving = false, error = e.message ?: "Failed to save product")
                }
            }
        }
    }

    fun reset() {
        _uiState.value = ScanUiState()
    }

    private fun updateField(block: ScanDraft.() -> ScanDraft) {
        _uiState.update { it.copy(draft = it.draft.block()) }
    }

    private suspend fun scheduleReminders(productId: Long) {
        val draft = _uiState.value.draft
        val displayName = draft.merchant.ifBlank { draft.productName }
        if (draft.enableWarrantyReminder && draft.warrantyExpiry != null) {
            ReminderNotificationHelper.scheduleReminder(
                appContext,
                productId,
                displayName,
                "Warranty",
                draft.warrantyExpiry,
            )
        }
        if (draft.enableReturnReminder && draft.returnReminderDate != null) {
            ReminderNotificationHelper.scheduleReminder(
                appContext,
                productId + 1000,
                displayName,
                "Return",
                draft.returnReminderDate,
            )
        }
        if (draft.enableServiceReminder && draft.serviceReminderDate != null) {
            ReminderNotificationHelper.scheduleReminder(
                appContext,
                productId + 2000,
                displayName,
                "Service",
                draft.serviceReminderDate,
            )
        }
    }

    private fun parseDate(dateStr: String): Long? {
        if (dateStr.isBlank()) return null
        val formats = listOf(
            "dd/MM/yy",
            "dd/MM/yyyy",
            "d/M/yy",
            "d/M/yyyy",
            "MM/dd/yy",
            "MM/dd/yyyy",
            "dd-MM-yy",
            "dd-MM-yyyy",
        )
        for (format in formats) {
            try {
                val sdf = SimpleDateFormat(format, Locale.US)
                sdf.isLenient = false
                return sdf.parse(dateStr)?.time
            } catch (_: Exception) {
            }
        }
        return null
    }
}
