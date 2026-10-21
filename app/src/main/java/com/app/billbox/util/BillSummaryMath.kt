package com.app.billbox.util

import com.app.billbox.domain.model.ExtractedField
import com.app.billbox.domain.model.ExtractedFieldType
import java.math.BigDecimal
import java.math.RoundingMode
import kotlin.math.abs

/**
 * Bill Summary math and ordering.
 *
 * Order: Subtotal → CGST → SGST → Round Off (optional) → Grand Total (always last)
 * Grand Total = Subtotal + CGST + SGST + Round Off (missing Round Off = 0)
 */
object BillSummaryMath {
    val summaryTypesInOrder = listOf(
        ExtractedFieldType.SUBTOTAL,
        ExtractedFieldType.CGST,
        ExtractedFieldType.SGST,
        ExtractedFieldType.ROUND_OFF,
        ExtractedFieldType.GRAND_TOTAL,
    )

    private val summaryTypeSet = summaryTypesInOrder.toSet()

    fun isSummaryType(type: ExtractedFieldType): Boolean = type in summaryTypeSet

    fun calculateGrandTotal(
        subtotal: String,
        cgst: String,
        sgst: String,
        roundOff: String = "",
    ): String {
        val base = parseMoneyDecimal(subtotal) ?: return ""
        val taxCgst = parseMoneyDecimal(cgst) ?: BigDecimal.ZERO
        val taxSgst = parseMoneyDecimal(sgst) ?: BigDecimal.ZERO
        val round = parseMoneyDecimal(roundOff.replace("+", "").trim()) ?: BigDecimal.ZERO
        return formatMoney(base.add(taxCgst).add(taxSgst).add(round))
    }

    fun amountsMatch(a: String, b: String, epsilon: Double = 0.01): Boolean {
        val left = parseMoney(a) ?: return a.isBlank() && b.isBlank()
        val right = parseMoney(b) ?: return false
        return abs(left - right) < epsilon
    }

    fun formatMoney(value: Double): String =
        formatMoney(BigDecimal.valueOf(value))

    fun formatMoney(value: BigDecimal): String =
        value.setScale(2, RoundingMode.HALF_UP).toPlainString()

    fun parseMoney(raw: String): Double? =
        parseMoneyDecimal(raw)?.toDouble()

    fun parseMoneyDecimal(raw: String): BigDecimal? {
        val cleaned = raw.replace(",", "")
            .replace("₹", "")
            .replace("Rs", "", ignoreCase = true)
            .replace("INR", "", ignoreCase = true)
            .replace("$", "")
            .trim()
        if (cleaned.isBlank()) return null
        return runCatching { BigDecimal(cleaned) }.getOrNull()
    }

    /**
     * Builds the Bill Summary field list in the required order.
     * Round Off is included only when [includeRoundOff] is true (present on the bill).
     * Subtotal / CGST / SGST / Grand Total are always included.
     */
    fun buildSummaryFields(
        existing: List<ExtractedField>,
        subtotal: String,
        cgst: String,
        sgst: String,
        roundOff: String,
        grandTotal: String,
        includeRoundOff: Boolean,
        newFieldId: () -> String = { java.util.UUID.randomUUID().toString() },
    ): List<ExtractedField> {
        fun labelFor(type: ExtractedFieldType, fallback: String): String =
            existing.firstOrNull { it.type == type }?.label ?: fallback

        fun idFor(type: ExtractedFieldType): String =
            existing.firstOrNull { it.type == type }?.id ?: newFieldId()

        return buildList {
            add(
                ExtractedField(
                    id = idFor(ExtractedFieldType.SUBTOTAL),
                    type = ExtractedFieldType.SUBTOTAL,
                    label = labelFor(ExtractedFieldType.SUBTOTAL, "Subtotal"),
                    value = subtotal,
                ),
            )
            add(
                ExtractedField(
                    id = idFor(ExtractedFieldType.CGST),
                    type = ExtractedFieldType.CGST,
                    label = labelFor(ExtractedFieldType.CGST, "CGST"),
                    value = cgst,
                ),
            )
            add(
                ExtractedField(
                    id = idFor(ExtractedFieldType.SGST),
                    type = ExtractedFieldType.SGST,
                    label = labelFor(ExtractedFieldType.SGST, "SGST"),
                    value = sgst,
                ),
            )
            if (includeRoundOff) {
                add(
                    ExtractedField(
                        id = idFor(ExtractedFieldType.ROUND_OFF),
                        type = ExtractedFieldType.ROUND_OFF,
                        label = labelFor(ExtractedFieldType.ROUND_OFF, "Round Off"),
                        value = roundOff.ifBlank { "0.00" },
                    ),
                )
            }
            add(
                ExtractedField(
                    id = idFor(ExtractedFieldType.GRAND_TOTAL),
                    type = ExtractedFieldType.GRAND_TOTAL,
                    label = labelFor(ExtractedFieldType.GRAND_TOTAL, "Grand Total"),
                    value = grandTotal,
                ),
            )
        }
    }

    fun detailFields(fields: List<ExtractedField>): List<ExtractedField> =
        fields.filterNot { isSummaryType(it.type) }
}
