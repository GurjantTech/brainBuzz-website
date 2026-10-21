package com.app.billbox.domain.model

enum class WarrantyStatus {
    Active,
    Expiring,
    Expired,
    None
}

enum class ReminderType {
    Warranty,
    Return,
    Service
}

data class BillLineItem(
    val name: String,
    val quantity: Double = 1.0,
    val unitPrice: Double? = null,
    val totalPrice: Double? = null,
)

/**
 * A single detected bill field in receipt order.
 * Unknown labels become [ExtractedFieldType.OTHER] so the review form can still show them.
 */
enum class ExtractedFieldType {
    VENDOR,
    LEGAL_ENTITY,
    ADDRESS,
    GSTIN,
    FSSAI,
    CUSTOMER_NAME,
    DATE,
    TIME,
    SERVICE_TYPE,
    CASHIER,
    BILL_NUMBER,
    TOKEN_NUMBER,
    LINE_ITEM,
    TOTAL_QTY,
    SUBTOTAL,
    DISCOUNT,
    CGST,
    SGST,
    IGST,
    SERVICE_CHARGE,
    ROUND_OFF,
    GRAND_TOTAL,
    PAYMENT_METHOD,
    OTHER,
}

data class ExtractedField(
    val id: String,
    val type: ExtractedFieldType,
    val label: String,
    val value: String,
)

data class Product(
    val id: Long = 0,
    val name: String,
    val merchant: String? = null,
    val purchaseDate: Long,
    val amount: Double? = null,
    val currencyCode: String = "INR",
    val subtotal: Double? = null,
    val cgst: Double? = null,
    val sgst: Double? = null,
    val lineItems: List<BillLineItem> = emptyList(),
    val extractedFields: List<ExtractedField> = emptyList(),
    val rawOcrText: String = "",
    val category: String = "General",
    val billImageUri: String? = null,
    val warrantyExpiry: Long? = null,
    val warrantyStatus: WarrantyStatus = WarrantyStatus.None,
    val createdAt: Long = System.currentTimeMillis(),
)

data class Reminder(
    val id: Long = 0,
    val productId: Long,
    val productName: String = "",
    val type: ReminderType,
    val dueDate: Long,
    val isEnabled: Boolean = true,
)

data class ScanDraft(
    val billImageUri: String? = null,
    val merchant: String = "",
    val productName: String = "",
    val purchaseDate: Long = System.currentTimeMillis(),
    val amount: String = "",
    val currencyCode: String = "INR",
    val subtotal: String = "",
    val cgst: String = "",
    val sgst: String = "",
    val lineItems: List<BillLineItem> = emptyList(),
    val extractedFields: List<ExtractedField> = emptyList(),
    val category: String = "General",
    val rawOcrText: String = "",
    val ocrGrandTotal: String = "",
    val grandTotalRecalculated: Boolean = false,
    val roundOffPresent: Boolean = false,
    val warrantyDurationMonths: Int = 12,
    val warrantyExpiry: Long? = null,
    val enableWarrantyReminder: Boolean = true,
    val enableReturnReminder: Boolean = false,
    val enableServiceReminder: Boolean = false,
    val returnReminderDate: Long? = null,
    val serviceReminderDate: Long? = null,
) {
    fun detailFields(): List<ExtractedField> =
        extractedFields.filterNot {
            it.type in BillSummaryFieldTypes ||
                it.type == ExtractedFieldType.CASHIER ||
                it.type == ExtractedFieldType.LINE_ITEM
        }

    fun billItemFields(): List<ExtractedField> =
        extractedFields.filter { it.type == ExtractedFieldType.LINE_ITEM }

    fun cashierField(): ExtractedField? =
        extractedFields.firstOrNull { it.type == ExtractedFieldType.CASHIER }

    fun summaryFields(): List<ExtractedField> {
        val byType = extractedFields
            .filter { BillSummaryFieldTypes.contains(it.type) }
            .groupBy { it.type }

        fun fieldOrFallback(
            type: ExtractedFieldType,
            fallbackValue: String,
            defaultLabel: String,
        ): ExtractedField {
            val existing = byType[type]?.firstOrNull()
            val value = sequenceOf(existing?.value, fallbackValue)
                .mapNotNull { it?.trim()?.takeIf { v -> v.isNotBlank() } }
                .firstOrNull()
                .orEmpty()
            return ExtractedField(
                id = existing?.id ?: "summary-${type.name.lowercase()}",
                type = type,
                label = existing?.label?.takeIf { it.isNotBlank() } ?: defaultLabel,
                value = value,
            )
        }

        return buildList {
            add(fieldOrFallback(ExtractedFieldType.SUBTOTAL, subtotal, "Subtotal"))
            add(fieldOrFallback(ExtractedFieldType.CGST, cgst, "CGST"))
            add(fieldOrFallback(ExtractedFieldType.SGST, sgst, "SGST"))
            if (roundOffPresent || byType.containsKey(ExtractedFieldType.ROUND_OFF)) {
                val roundValue = byType[ExtractedFieldType.ROUND_OFF]?.firstOrNull()?.value.orEmpty()
                if (roundValue.isNotBlank()) {
                    add(fieldOrFallback(ExtractedFieldType.ROUND_OFF, roundValue, "Round Off"))
                }
            }
            add(fieldOrFallback(ExtractedFieldType.GRAND_TOTAL, amount, "Grand Total"))
        }
    }

    fun calculateGrandTotalValue(): String {
        val roundOff = extractedFields
            .firstOrNull { it.type == ExtractedFieldType.ROUND_OFF }
            ?.value
            .orEmpty()
        return com.app.billbox.util.BillSummaryMath.calculateGrandTotal(
            subtotal = extractedFields.firstOrNull { it.type == ExtractedFieldType.SUBTOTAL }?.value ?: subtotal,
            cgst = extractedFields.firstOrNull { it.type == ExtractedFieldType.CGST }?.value ?: cgst,
            sgst = extractedFields.firstOrNull { it.type == ExtractedFieldType.SGST }?.value ?: sgst,
            roundOff = roundOff,
        )
    }

    fun withUpdatedField(fieldId: String, value: String): ScanDraft {
        val target = extractedFields.firstOrNull { it.id == fieldId }
        val updatedFields = if (target != null) {
            extractedFields.map { field ->
                if (field.id == fieldId) field.copy(value = value) else field
            }
        } else {
            // Synthetic summary field ids (summary-cgst / summary-sgst) when OCR omitted them
            val type = when (fieldId) {
                "summary-cgst" -> ExtractedFieldType.CGST
                "summary-sgst" -> ExtractedFieldType.SGST
                "summary-subtotal" -> ExtractedFieldType.SUBTOTAL
                "summary-grand_total" -> ExtractedFieldType.GRAND_TOTAL
                "summary-round_off" -> ExtractedFieldType.ROUND_OFF
                else -> null
            }
            if (type == null) {
                extractedFields
            } else {
                val existingIndex = extractedFields.indexOfFirst { it.type == type }
                if (existingIndex >= 0) {
                    extractedFields.toMutableList().also {
                        it[existingIndex] = it[existingIndex].copy(value = value)
                    }
                } else {
                    extractedFields + ExtractedField(
                        id = fieldId,
                        type = type,
                        label = type.name.replace('_', ' ').lowercase()
                            .replaceFirstChar { it.titlecase() },
                        value = value,
                    )
                }
            }
        }
        var next = copy(extractedFields = updatedFields).syncKnownFieldsFromExtracted()
        val changedType = target?.type ?: updatedFields.firstOrNull { it.id == fieldId }?.type
        if (changedType != null && changedType in SummaryInputTypes) {
            next = next.recalculateGrandTotal(clearMismatchBanner = true)
        }
        return next
    }

    fun recalculateGrandTotal(clearMismatchBanner: Boolean = false): ScanDraft {
        val calculated = calculateGrandTotalValue()
        if (calculated.isBlank()) return this
        val fields = extractedFields.toMutableList()
        val grandIndex = fields.indexOfFirst { it.type == ExtractedFieldType.GRAND_TOTAL }
        if (grandIndex >= 0) {
            fields[grandIndex] = fields[grandIndex].copy(value = calculated)
        } else {
            fields += ExtractedField(
                id = java.util.UUID.randomUUID().toString(),
                type = ExtractedFieldType.GRAND_TOTAL,
                label = "Grand Total",
                value = calculated,
            )
        }
        return copy(
            extractedFields = fields,
            amount = calculated,
            grandTotalRecalculated = if (clearMismatchBanner) false else grandTotalRecalculated,
        )
    }

    fun syncKnownFieldsFromExtracted(): ScanDraft {
        if (extractedFields.isEmpty()) return this
        fun first(type: ExtractedFieldType): String? =
            extractedFields.firstOrNull { it.type == type }?.value

        val lineItemsFromFields = extractedFields
            .filter { it.type == ExtractedFieldType.LINE_ITEM }
            .mapNotNull { field -> parseLineItemValue(field.label, field.value) }

        return copy(
            merchant = first(ExtractedFieldType.VENDOR)?.ifBlank { null } ?: merchant,
            productName = lineItemsFromFields.firstOrNull()?.name
                ?: productName.ifBlank { first(ExtractedFieldType.VENDOR).orEmpty() },
            amount = first(ExtractedFieldType.GRAND_TOTAL) ?: amount,
            subtotal = first(ExtractedFieldType.SUBTOTAL) ?: subtotal,
            cgst = first(ExtractedFieldType.CGST) ?: cgst,
            sgst = first(ExtractedFieldType.SGST) ?: sgst,
            lineItems = lineItemsFromFields.ifEmpty { lineItems },
            roundOffPresent = roundOffPresent ||
                extractedFields.any { it.type == ExtractedFieldType.ROUND_OFF },
        )
    }

    companion object {
        val BillSummaryFieldTypes = setOf(
            ExtractedFieldType.SUBTOTAL,
            ExtractedFieldType.CGST,
            ExtractedFieldType.SGST,
            ExtractedFieldType.ROUND_OFF,
            ExtractedFieldType.GRAND_TOTAL,
        )

        private val SummaryInputTypes = setOf(
            ExtractedFieldType.SUBTOTAL,
            ExtractedFieldType.CGST,
            ExtractedFieldType.SGST,
            ExtractedFieldType.ROUND_OFF,
        )

        fun parseLineItemValue(label: String, value: String): BillLineItem? {
            val parts = value.split("|").map { it.trim() }
            if (parts.size < 3) {
                val amount = value.replace(",", "").toDoubleOrNull()
                return BillLineItem(name = label.ifBlank { "Item" }, totalPrice = amount)
            }
            return BillLineItem(
                name = label.ifBlank { parts[0] },
                quantity = parts[0].toDoubleOrNull() ?: 1.0,
                unitPrice = parts[1].toDoubleOrNull(),
                totalPrice = parts[2].toDoubleOrNull(),
            )
        }
    }
}

data class DashboardStats(
    val totalProducts: Int = 0,
    val expiringSoon: Int = 0,
    val activeReminders: Int = 0,
)
