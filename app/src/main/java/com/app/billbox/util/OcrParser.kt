package com.app.billbox.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import com.app.billbox.domain.model.BillLineItem
import com.app.billbox.domain.model.ExtractedField
import com.app.billbox.domain.model.ExtractedFieldType
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.tasks.await
import java.util.UUID

data class OcrResult(
    val rawText: String,
    val merchant: String,
    val amount: String,
    val currencyCode: String,
    val subtotal: String,
    val cgst: String,
    val sgst: String,
    val date: String,
    val productName: String,
    val lineItems: List<BillLineItem>,
    val extractedFields: List<ExtractedField> = emptyList(),
    val ocrGrandTotal: String = "",
    val grandTotalRecalculated: Boolean = false,
    val roundOffPresent: Boolean = false,
)

object OcrParser {
    private val datePattern = Regex("""\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b""")
    private val timePattern = Regex("""\b([01]?\d|2[0-3]):[0-5]\d\b""")
    private val decimalPattern = Regex(
        """(?:₹|Rs\.?|INR|\$)?\s*(\d[\d,]*(?:\.\d{1,2})?)""",
        RegexOption.IGNORE_CASE,
    )
    private val currencyAmountPattern = Regex(
        """(?:₹|Rs\.?|INR|\$)\s*(\d[\d,]*(?:\.\d{1,2})?)""",
        RegexOption.IGNORE_CASE,
    )
    private val totalAmountPattern = Regex("""(\d{2,}(?:\.\d{1,2})?)""")
    private val percentRatePattern = Regex("""(\d+(?:\.\d+)?)\s*%""")
    private val atRatePattern = Regex("""@\s*(\d+(?:\.\d+)?)""")
    private val itemPattern = Regex(
        """^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d{1,2})?)\s+(\d+(?:\.\d{1,2})?)$""",
    )
    private val labeledValuePattern = Regex(
        """(?i)^(gst(?:in)?|fssai|bill\s*no\.?|token\s*no\.?|cashier|name)\s*:?\s*(.+)$""",
    )

    suspend fun recognizeText(context: Context, uri: Uri): OcrResult {
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        val inputImage = InputImage.fromFilePath(context, uri)
        val result = recognizer.process(inputImage).await()
        Log.e("OCR_Result1",result.text)
        return parseOcrText(result.text)
    }

    suspend fun recognizeTextFromBitmap(bitmap: Bitmap): OcrResult {
        val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
        val inputImage = InputImage.fromBitmap(bitmap, 0)
        val result = recognizer.process(inputImage).await()
        return parseOcrText(result.text)
    }

    fun loadBitmap(context: Context, uri: Uri): Bitmap? {
        return context.contentResolver.openInputStream(uri)?.use { stream ->
            BitmapFactory.decodeStream(stream)
        }
    }

    internal fun parseOcrText(rawText: String): OcrResult {
        val lines = rawText.lines().map { it.trim() }.filter { it.isNotBlank() }
        val extractedFields = extractOrderedFields(lines, rawText)

        val merchant = valueOf(extractedFields, ExtractedFieldType.VENDOR)
            .ifBlank { extractMerchant(lines) }
        val lineItems = extractedFields
            .filter { it.type == ExtractedFieldType.LINE_ITEM }
            .mapNotNull { field -> ScanDraftLineItem.parse(field.label, field.value) }
            .ifEmpty { extractLineItems(lines) }

        val roundOff = valueOf(extractedFields, ExtractedFieldType.ROUND_OFF)
            .ifBlank { extractRoundOff(lines) }
        val roundOffPresent = roundOff.isNotBlank() ||
            lines.any { it.contains(Regex("""round\s*off""", RegexOption.IGNORE_CASE)) }

        val explicitSubtotal = valueOf(extractedFields, ExtractedFieldType.SUBTOTAL)
            .ifBlank { extractSubtotal(lines) }
        val lineItemSubtotal = lineItems.sumOf { it.totalPrice ?: 0.0 }
        // Prefer explicit Sub Total from the receipt when present
        val subtotal = explicitSubtotal.ifBlank {
            if (lineItemSubtotal > 0.0) {
                BillSummaryMath.formatMoney(lineItemSubtotal)
            } else {
                ""
            }
        }

        var cgst = valueOf(extractedFields, ExtractedFieldType.CGST)
            .ifBlank { extractTaxAmount(lines, GstKind.CGST) }
            .ifBlank { extractGstAmountFromRawText(rawText, GstKind.CGST) }
        var sgst = valueOf(extractedFields, ExtractedFieldType.SGST)
            .ifBlank { extractTaxAmount(lines, GstKind.SGST) }
            .ifBlank { extractGstAmountFromRawText(rawText, GstKind.SGST) }

        // Never treat GST % rates as tax amounts
        if (isGstRateNotAmount(cgst)) cgst = ""
        if (isGstRateNotAmount(sgst)) sgst = ""

        val extractedGrandTotal = valueOf(extractedFields, ExtractedFieldType.GRAND_TOTAL)
            .ifBlank { extractGrandTotal(lines) }

        // Fill missing taxes from rate × subtotal, then from grand-total split
        if (cgst.isBlank() || sgst.isBlank()) {
            val filled = fillMissingGst(cgst, sgst, subtotal, extractedGrandTotal, roundOff, lines, rawText)
            cgst = filled.first
            sgst = filled.second
        }

        val calculatedGrandTotal = BillSummaryMath.calculateGrandTotal(subtotal, cgst, sgst, roundOff)
        val grandTotalMismatch = extractedGrandTotal.isNotBlank() &&
            calculatedGrandTotal.isNotBlank() &&
            !BillSummaryMath.amountsMatch(extractedGrandTotal, calculatedGrandTotal)

        // Prefer calculated total when OCR total is missing or clearly wrong
        val grandTotal = when {
            calculatedGrandTotal.isNotBlank() &&
                (extractedGrandTotal.isBlank() || grandTotalMismatch) -> calculatedGrandTotal
            extractedGrandTotal.isNotBlank() -> extractedGrandTotal
            calculatedGrandTotal.isNotBlank() -> calculatedGrandTotal
            else -> extractLastAmount(rawText)
        }

        val date = valueOf(extractedFields, ExtractedFieldType.DATE)
            .ifBlank { datePattern.find(rawText)?.groupValues?.getOrNull(1).orEmpty() }
        val productName = lineItems.firstOrNull()?.name
            ?: merchant.takeIf { it.isNotBlank() }
            ?: "Receipt"
        val currencyCode = CurrencyUtils.detectCurrencyCode(rawText)

        val reconciledFields = reconcileFields(
            fields = extractedFields,
            merchant = merchant,
            date = date,
            lineItems = lineItems,
            subtotal = subtotal,
            cgst = cgst,
            sgst = sgst,
            roundOff = roundOff,
            grandTotal = grandTotal,
            roundOffPresent = roundOffPresent,
        )

        return OcrResult(
            rawText = rawText,
            merchant = merchant,
            amount = grandTotal,
            currencyCode = currencyCode,
            subtotal = subtotal,
            cgst = cgst,
            sgst = sgst,
            date = date,
            productName = productName,
            lineItems = lineItems,
            extractedFields = reconciledFields,
            ocrGrandTotal = extractedGrandTotal,
            grandTotalRecalculated = grandTotalMismatch ||
                (extractedGrandTotal.isBlank() && calculatedGrandTotal.isNotBlank()),
            roundOffPresent = roundOffPresent,
        )
    }

    private fun extractOrderedFields(lines: List<String>, rawText: String): List<ExtractedField> {
        if (lines.isEmpty()) return emptyList()
        val fields = mutableListOf<ExtractedField>()
        val consumed = BooleanArray(lines.size)

        // Header / vendor block (before item table or metadata-heavy lines)
        val headerEnd = lines.indexOfFirst { isItemHeader(it) }
            .takeIf { it >= 0 }
            ?: lines.indexOfFirst {
                it.contains(Regex("""\b(sub\s*total|cgst|sgst|grand\s*total)\b""", RegexOption.IGNORE_CASE))
            }.takeIf { it >= 0 }
            ?: minOf(lines.size, 12)

        extractHeaderFields(lines.take(headerEnd), fields, consumed)

        // Metadata lines anywhere before items (date, cashier, bill no, etc.)
        extractMetadataFields(lines, fields, consumed, until = headerEnd)

        // Line items
        val headerIndex = lines.indexOfFirst { isItemHeader(it) }
        if (headerIndex >= 0) {
            consumed[headerIndex] = true
            var i = headerIndex + 1
            while (i < lines.size) {
                val line = lines[i]
                if (isTotalsBoundary(line)) break
                val item = parseItemLine(line)
                if (item != null) {
                    fields += field(
                        ExtractedFieldType.LINE_ITEM,
                        item.name,
                        formatLineItemValue(item),
                    )
                    consumed[i] = true
                }
                i++
            }
        }

        // Totals / tax / payment in receipt order
        extractSummaryFields(lines, fields, consumed)

        // Any leftover labeled lines → OTHER (preserve receipt extras)
        lines.forEachIndexed { index, line ->
            if (consumed[index]) return@forEachIndexed
            if (isNoiseLine(line)) return@forEachIndexed
            val leftover = extractGenericLabeledValue(line) ?: return@forEachIndexed
            fields += field(ExtractedFieldType.OTHER, leftover.first, leftover.second)
            consumed[index] = true
        }

        // Ensure date exists if present in raw text but missed line-by-line
        if (fields.none { it.type == ExtractedFieldType.DATE }) {
            datePattern.find(rawText)?.groupValues?.getOrNull(1)?.let { date ->
                fields.add(
                    index = fields.indexOfFirst {
                        it.type == ExtractedFieldType.LINE_ITEM ||
                            it.type == ExtractedFieldType.SUBTOTAL ||
                            it.type == ExtractedFieldType.GRAND_TOTAL
                    }.takeIf { it >= 0 } ?: fields.size,
                    element = field(ExtractedFieldType.DATE, "Date", date),
                )
            }
        }

        return fields
    }

    private fun extractHeaderFields(
        headerLines: List<String>,
        fields: MutableList<ExtractedField>,
        consumed: BooleanArray,
    ) {
        headerLines.forEachIndexed { index, line ->
            when {
                looksLikeGstin(line) -> {
                    fields += field(ExtractedFieldType.GSTIN, "GST", stripLabel(line, "gst"))
                    consumed[index] = true
                }
                looksLikeFssai(line) -> {
                    fields += field(ExtractedFieldType.FSSAI, "FSSAI", stripLabel(line, "fssai"))
                    consumed[index] = true
                }
                index == 0 && line.any(Char::isLetter) && !isMetadataLine(line) -> {
                    fields += field(ExtractedFieldType.VENDOR, "Vendor", line.take(80))
                    consumed[index] = true
                }
                index == 1 &&
                    line.any(Char::isLetter) &&
                    !isMetadataLine(line) &&
                    line.length >= 3 &&
                    !line.contains(Regex("""\d{5,}""")) &&
                    fields.none { it.type == ExtractedFieldType.LEGAL_ENTITY } -> {
                    // Second letter line often legal entity (e.g. "Ristara Foods Pvt Ltd")
                    if (!line.contains(Regex("""(?i)\b(road|layout|bangalore|street|main)\b"""))) {
                        fields += field(ExtractedFieldType.LEGAL_ENTITY, "Legal entity", line.take(80))
                        consumed[index] = true
                    } else {
                        fields += field(ExtractedFieldType.ADDRESS, "Address", line.take(120))
                        consumed[index] = true
                    }
                }
                looksLikeAddress(line) -> {
                    fields += field(ExtractedFieldType.ADDRESS, "Address", line.take(120))
                    consumed[index] = true
                }
            }
        }
    }

    private fun extractMetadataFields(
        lines: List<String>,
        fields: MutableList<ExtractedField>,
        consumed: BooleanArray,
        until: Int,
    ) {
        for (index in 0 until until.coerceAtMost(lines.size)) {
            if (consumed[index]) continue
            val line = lines[index]
            val lower = line.lowercase()

            datePattern.find(line)?.groupValues?.getOrNull(1)?.let { date ->
                if (fields.none { it.type == ExtractedFieldType.DATE }) {
                    fields += field(ExtractedFieldType.DATE, "Date", date)
                }
            }
            timePattern.find(line)?.value?.let { time ->
                if (fields.none { it.type == ExtractedFieldType.TIME }) {
                    fields += field(ExtractedFieldType.TIME, "Time", time)
                }
            }

            when {
                lower.contains("cashier") -> {
                    fields += field(
                        ExtractedFieldType.CASHIER,
                        "Cashier",
                        extractAfterLabel(line, listOf("cashier")).ifBlank { line },
                    )
                    consumed[index] = true
                }
                lower.contains("bill no") || lower.contains("bill no.") -> {
                    fields += field(
                        ExtractedFieldType.BILL_NUMBER,
                        "Bill No.",
                        extractAfterLabel(line, listOf("bill no.", "bill no", "bill number")),
                    )
                    consumed[index] = true
                }
                lower.contains("token no") || lower.contains("token no.") -> {
                    fields += field(
                        ExtractedFieldType.TOKEN_NUMBER,
                        "Token No.",
                        extractAfterLabel(line, listOf("token no.", "token no", "token number")),
                    )
                    consumed[index] = true
                }
                lower.contains("self service") || lower.contains("pick up") ||
                    lower.contains("dine in") || lower.contains("takeaway") -> {
                    val service = when {
                        lower.contains("self service") -> "Self service"
                        lower.contains("pick up") -> "Pick Up"
                        lower.contains("dine in") -> "Dine in"
                        else -> "Takeaway"
                    }
                    fields += field(ExtractedFieldType.SERVICE_TYPE, "Service", service)
                }
                lower.startsWith("name:") || lower.startsWith("name ") -> {
                    val name = extractAfterLabel(line, listOf("name"))
                    if (name.isNotBlank()) {
                        fields += field(ExtractedFieldType.CUSTOMER_NAME, "Name", name)
                        consumed[index] = true
                    }
                }
            }
        }
    }

    private fun extractSummaryFields(
        lines: List<String>,
        fields: MutableList<ExtractedField>,
        consumed: BooleanArray,
    ) {
        lines.forEachIndexed { index, line ->
            if (consumed[index]) return@forEachIndexed
            val lower = line.lowercase()

            when {
                lower.contains("total qty") -> {
                    val qty = Regex("""(?i)total\s*qty\s*:?\s*(\d+(?:\.\d+)?)""")
                        .find(line)?.groupValues?.getOrNull(1)
                        ?: amountsIn(line).lastOrNull().orEmpty()
                    if (qty.isNotBlank()) {
                        fields += field(ExtractedFieldType.TOTAL_QTY, "Total Qty", qty)
                        consumed[index] = true
                    }
                }
                lower.contains("sub total") || lower.contains("subtotal") -> {
                    val amount = extractAmountNear(lines, index) ?: return@forEachIndexed
                    fields += field(ExtractedFieldType.SUBTOTAL, "Subtotal", amount)
                    consumed[index] = true
                }
                lower.contains("discount") -> {
                    val amount = extractAmountNear(lines, index) ?: return@forEachIndexed
                    fields += field(ExtractedFieldType.DISCOUNT, "Discount", amount)
                    consumed[index] = true
                }
                matchesGstKind(line, GstKind.CGST) -> {
                    val amount = extractTaxAmountNear(lines, index, GstKind.CGST)
                    val label = taxLabelFromLine(line, "CGST")
                    if (amount.isNotBlank()) {
                        fields += field(ExtractedFieldType.CGST, label, amount)
                        consumed[index] = true
                    }
                }
                matchesGstKind(line, GstKind.SGST) -> {
                    val amount = extractTaxAmountNear(lines, index, GstKind.SGST)
                    val label = taxLabelFromLine(line, "SGST")
                    if (amount.isNotBlank()) {
                        fields += field(ExtractedFieldType.SGST, label, amount)
                        consumed[index] = true
                    }
                }
                matchesGstKind(line, GstKind.IGST) -> {
                    val amount = extractTaxAmountNear(lines, index, GstKind.IGST)
                    val label = taxLabelFromLine(line, "IGST")
                    if (amount.isNotBlank()) {
                        fields += field(ExtractedFieldType.IGST, label, amount)
                        consumed[index] = true
                    }
                }
                lower.contains("service charge") || lower.contains("service tax") -> {
                    val amount = extractAmountNear(lines, index) ?: return@forEachIndexed
                    fields += field(ExtractedFieldType.SERVICE_CHARGE, "Service charge", amount)
                    consumed[index] = true
                }
                lower.contains("round off") || lower.contains("roundoff") -> {
                    val amount = extractRoundOff(lines)
                    if (amount.isNotBlank()) {
                        fields += field(ExtractedFieldType.ROUND_OFF, "Round off", amount)
                        consumed[index] = true
                    }
                }
                lower.contains("grand total") ||
                    (lower.contains("total") && !lower.contains("sub") && !lower.contains("qty") &&
                        !lower.contains("item") && !lower.contains("cgst") && !lower.contains("sgst")) -> {
                    // Prefer explicit "grand total"; generic "total" only if no grand total later
                    val isGrand = lower.contains("grand total")
                    val amount = extractAmountNear(lines, index, preferTotals = true)
                    if (amount != null && (isGrand || fields.none { it.type == ExtractedFieldType.GRAND_TOTAL })) {
                        if (isGrand || !lines.drop(index + 1).any { it.contains("grand total", true) }) {
                            // Replace weaker generic total if grand total arrives later
                            fields.removeAll { it.type == ExtractedFieldType.GRAND_TOTAL && !isGrand }
                            if (fields.none { it.type == ExtractedFieldType.GRAND_TOTAL } || isGrand) {
                                fields.removeAll { it.type == ExtractedFieldType.GRAND_TOTAL }
                                fields += field(ExtractedFieldType.GRAND_TOTAL, "Grand Total", amount)
                                consumed[index] = true
                            }
                        }
                    }
                }
                lower.contains("paid via") || lower.contains("payment") ||
                    lower.contains("paid by") || lower.startsWith("paid ") -> {
                    val method = line.substringAfter(":").trim().ifBlank {
                        line.replace(Regex("""(?i)paid\s*(via|by)?\s*:?"""), "").trim()
                    }.ifBlank { line }
                    fields += field(ExtractedFieldType.PAYMENT_METHOD, "Payment", method)
                    consumed[index] = true
                }
            }
        }
    }

    private fun reconcileFields(
        fields: List<ExtractedField>,
        merchant: String,
        date: String,
        lineItems: List<BillLineItem>,
        subtotal: String,
        cgst: String,
        sgst: String,
        roundOff: String,
        grandTotal: String,
        roundOffPresent: Boolean,
    ): List<ExtractedField> {
        val details = fields
            .filterNot { BillSummaryMath.isSummaryType(it.type) }
            .toMutableList()

        fun upsertDetail(type: ExtractedFieldType, label: String, value: String) {
            if (value.isBlank()) return
            val index = details.indexOfFirst { it.type == type }
            if (index >= 0) {
                details[index] = details[index].copy(value = value, label = label.ifBlank { details[index].label })
            } else {
                details += field(type, label, value)
            }
        }

        upsertDetail(ExtractedFieldType.VENDOR, "Vendor", merchant)
        upsertDetail(ExtractedFieldType.DATE, "Date", date)

        if (details.none { it.type == ExtractedFieldType.LINE_ITEM } && lineItems.isNotEmpty()) {
            lineItems.forEach { item ->
                details += field(ExtractedFieldType.LINE_ITEM, item.name, formatLineItemValue(item))
            }
        }

        val cgstLabel = fields.firstOrNull { it.type == ExtractedFieldType.CGST }?.label ?: "CGST"
        val sgstLabel = fields.firstOrNull { it.type == ExtractedFieldType.SGST }?.label ?: "SGST"
        val summaryExisting = fields.filter { BillSummaryMath.isSummaryType(it.type) }.map { existing ->
            when (existing.type) {
                ExtractedFieldType.CGST -> existing.copy(label = cgstLabel)
                ExtractedFieldType.SGST -> existing.copy(label = sgstLabel)
                else -> existing
            }
        }

        val summary = BillSummaryMath.buildSummaryFields(
            existing = summaryExisting,
            subtotal = subtotal,
            cgst = cgst,
            sgst = sgst,
            roundOff = roundOff,
            grandTotal = grandTotal,
            includeRoundOff = roundOffPresent,
            newFieldId = { UUID.randomUUID().toString() },
        )

        // Details first (receipt order), Bill Summary fields always last in fixed order
        return details.filter { it.value.isNotBlank() } + summary.filter {
            // Keep Subtotal / CGST / SGST / Grand Total even if blank so the form can show them;
            // Round Off already gated by roundOffPresent.
            when (it.type) {
                ExtractedFieldType.SUBTOTAL,
                ExtractedFieldType.CGST,
                ExtractedFieldType.SGST,
                ExtractedFieldType.GRAND_TOTAL,
                ExtractedFieldType.ROUND_OFF,
                -> true
                else -> it.value.isNotBlank()
            }
        }
    }

    private fun shouldPrefer(type: ExtractedFieldType, candidate: String, existing: String): Boolean {
        if (type != ExtractedFieldType.CGST && type != ExtractedFieldType.SGST && type != ExtractedFieldType.IGST) {
            return candidate.toMoney() != null && existing.toMoney() == null
        }
        // Prefer real tax amounts over rates (e.g. 2.02 over 2.5)
        val c = candidate.toMoney() ?: return false
        val e = existing.toMoney() ?: return true
        val looksLikeRate = { v: Double -> v in setOf(2.5, 5.0, 6.0, 9.0, 12.0, 18.0, 28.0) || v < 30.0 && v == v.toInt().toDouble() }
        if (looksLikeRate(e) && !looksLikeRate(c)) return true
        return false
    }

    private fun extractTaxAmount(lines: List<String>, kind: GstKind): String {
        val index = lines.indexOfFirst { matchesGstKind(it, kind) }
        if (index == -1) return ""
        return extractTaxAmountNear(lines, index, kind)
    }

    /**
     * Picks the monetary tax amount on a GST line, never the percentage rate.
     * Example: "CGST@2.5 2.5% 2.02" → "2.02"
     */
    private fun extractTaxAmountNear(lines: List<String>, index: Int, kind: GstKind): String {
        val primary = lines.getOrNull(index).orEmpty()
        pickTaxAmountFromLine(primary)?.let { return it }

        // Only look a few lines forward (never backward — that steals Subtotal amounts)
        for (offset in 1..3) {
            val current = lines.getOrNull(index + offset).orEmpty()
            if (current.isBlank()) continue
            if (isOtherGstOrTotalsBoundary(current, kind)) break

            pickTaxAmountFromLine(current)?.let { amount ->
                val value = amount.toMoney() ?: return@let
                // Tax amounts are typically small vs item/subtotal prices
                if (value in 0.01..500.0) return amount
            }

            val bare = current.trim().replace(",", "")
            if (Regex("""^[+-]?\d+\.\d{1,2}$""").matches(bare)) {
                val value = bare.toMoney() ?: continue
                if (value in 0.01..500.0) return bare
            }
        }

        val rate = percentRatePattern.find(primary)?.groupValues?.getOrNull(1)?.toMoney()
            ?: atRatePattern.find(primary)?.groupValues?.getOrNull(1)?.toMoney()
        val subtotal = resolveSubtotalForTax(lines)
        if (rate != null && subtotal != null && rate in 0.01..40.0) {
            return BillSummaryMath.formatMoney(subtotal * rate / 100.0)
        }

        return ""
    }

    /**
     * Pulls CGST/SGST amounts from the full OCR blob when line-splitting fails.
     */
    private fun extractGstAmountFromRawText(rawText: String, kind: GstKind): String {
        val label = when (kind) {
            GstKind.CGST -> """c\s*g\s*s\s*t"""
            GstKind.SGST -> """s\s*g\s*s\s*t"""
            GstKind.IGST -> """i\s*g\s*s\s*t"""
        }
        val windowPattern = Regex("""(?i)$label([\s\S]{0,120})""")
        val match = windowPattern.find(rawText) ?: return ""
        val window = match.groupValues[1].let { text ->
            val stop = when (kind) {
                GstKind.CGST -> Regex("""(?i)s\s*g\s*s\s*t""")
                else -> Regex("""(?i)(?:round\s*off|grand\s*total)""")
            }
            stop.find(text)?.let { text.substring(0, it.range.first) } ?: text
        }
        pickTaxAmountFromLine("${kind.name} $window")?.let { return it }

        val rates = taxRatesIn(window)
        return amountsIn(window).lastOrNull { amount ->
            val value = amount.toMoney() ?: return@lastOrNull false
            rates.none { kotlin.math.abs(it - value) < 0.001 } && value in 0.01..500.0
        }.orEmpty()
    }

    private fun isGstRateNotAmount(value: String): Boolean {
        val v = value.toMoney() ?: return false
        return v in setOf(2.5, 5.0, 6.0, 9.0, 12.0, 14.0, 18.0, 28.0)
    }

    private fun fillMissingGst(
        cgst: String,
        sgst: String,
        subtotal: String,
        grandTotal: String,
        roundOff: String,
        lines: List<String>,
        rawText: String,
    ): Pair<String, String> {
        var resolvedCgst = cgst
        var resolvedSgst = sgst
        val sub = BillSummaryMath.parseMoney(subtotal)
        val grand = BillSummaryMath.parseMoney(grandTotal)
        val round = BillSummaryMath.parseMoney(roundOff.replace("+", "")) ?: 0.0

        // 1) rate × subtotal from GST lines
        if (sub != null) {
            val rate = lines.firstNotNullOfOrNull { line ->
                if (!matchesAnyGst(line)) return@firstNotNullOfOrNull null
                percentRatePattern.find(line)?.groupValues?.getOrNull(1)?.toMoney()
                    ?: atRatePattern.find(line)?.groupValues?.getOrNull(1)?.toMoney()
            }
            if (rate != null && rate in 0.01..40.0) {
                val amount = BillSummaryMath.formatMoney(sub * rate / 100.0)
                if (resolvedCgst.isBlank()) resolvedCgst = amount
                if (resolvedSgst.isBlank()) resolvedSgst = amount
            }
        }

        // 2) Split (Grand − Sub − Round) equally for missing CGST/SGST
        if (sub != null && grand != null) {
            val taxTotal = grand - sub - round
            if (taxTotal > 0.005 && taxTotal < grand) {
                when {
                    resolvedCgst.isBlank() && resolvedSgst.isBlank() -> {
                        val half = BillSummaryMath.formatMoney(taxTotal / 2.0)
                        resolvedCgst = half
                        resolvedSgst = half
                    }
                    resolvedCgst.isBlank() -> {
                        val other = BillSummaryMath.parseMoney(resolvedSgst) ?: 0.0
                        val rem = taxTotal - other
                        if (rem > 0.005) resolvedCgst = BillSummaryMath.formatMoney(rem)
                    }
                    resolvedSgst.isBlank() -> {
                        val other = BillSummaryMath.parseMoney(resolvedCgst) ?: 0.0
                        val rem = taxTotal - other
                        if (rem > 0.005) resolvedSgst = BillSummaryMath.formatMoney(rem)
                    }
                }
            }
        }

        // 3) Default 2.5% only when this looks like an Indian GST bill and taxes still missing
        if ((resolvedCgst.isBlank() || resolvedSgst.isBlank()) &&
            sub != null &&
            (rawText.contains("gst", ignoreCase = true) || lines.any { matchesAnyGst(it) })
        ) {
            val amount = BillSummaryMath.formatMoney(sub * 0.025)
            if (resolvedCgst.isBlank()) resolvedCgst = amount
            if (resolvedSgst.isBlank()) resolvedSgst = amount
        }

        return resolvedCgst to resolvedSgst
    }

    private enum class GstKind { CGST, SGST, IGST }

    private fun matchesGstKind(line: String, kind: GstKind): Boolean {
        val compact = line.lowercase()
            .replace(" ", "")
            .replace(".", "")
            .replace("-", "")
            .replace("_", "")
        return when (kind) {
            GstKind.CGST -> compact.contains("cgst") ||
                compact.contains("cgsi") ||
                compact.contains("ogst") ||
                Regex("""(?i)c\s*g\s*s\s*t""").containsMatchIn(line) ||
                Regex("""(?i)central\s*gst""").containsMatchIn(line)
            GstKind.SGST -> compact.contains("sgst") ||
                compact.contains("sgsi") ||
                compact.contains("5gst") ||
                Regex("""(?i)s\s*g\s*s\s*t""").containsMatchIn(line) ||
                Regex("""(?i)state\s*gst""").containsMatchIn(line)
            GstKind.IGST -> compact.contains("igst") ||
                compact.contains("igsi") ||
                Regex("""(?i)i\s*g\s*s\s*t""").containsMatchIn(line) ||
                Regex("""(?i)integrated\s*gst""").containsMatchIn(line)
        }
    }

    private fun matchesAnyGst(line: String): Boolean =
        matchesGstKind(line, GstKind.CGST) ||
            matchesGstKind(line, GstKind.SGST) ||
            matchesGstKind(line, GstKind.IGST)

    private fun isOtherGstOrTotalsBoundary(line: String, current: GstKind): Boolean {
        val otherKinds = GstKind.entries.filter { it != current }
        if (otherKinds.any { matchesGstKind(line, it) }) return true
        return line.contains(Regex("""(?i)round\s*off|grand\s*total|sub\s*total"""))
    }

    private fun resolveSubtotalForTax(lines: List<String>): Double? {
        extractSubtotal(lines).toMoney()?.let { return it }
        val itemTotal = extractLineItems(lines).sumOf { it.totalPrice ?: 0.0 }
        return itemTotal.takeIf { it > 0.0 }
    }

    private fun pickTaxAmountFromLine(line: String): String? {
        val rates = taxRatesIn(line)
        val afterPercent = line.substringAfter("%", missingDelimiterValue = "")
        val currencyAmounts = currencyAmountPattern.findAll(line)
            .map { it.groupValues[1].replace(",", "") }
            .toList()
        if (currencyAmounts.isNotEmpty()) {
            return currencyAmounts.last()
        }

        val candidates = amountsIn(line).filter { amount ->
            val value = amount.toMoney() ?: return@filter false
            val isRate = rates.any { kotlin.math.abs(it - value) < 0.001 }
            !isRate
        }

        if (candidates.isNotEmpty()) {
            if (afterPercent.isNotBlank()) {
                amountsIn(afterPercent).lastOrNull { candidate ->
                    candidates.contains(candidate)
                }?.let { return it }
            }
            return candidates.last()
        }

        return null
    }

    private fun taxRatesIn(line: String): Set<Double> {
        val rates = mutableSetOf<Double>()
        percentRatePattern.findAll(line).forEach { match ->
            match.groupValues[1].toMoney()?.let { rates += it }
        }
        atRatePattern.findAll(line).forEach { match ->
            match.groupValues[1].toMoney()?.let { rates += it }
        }
        return rates
    }

    private fun taxLabelFromLine(line: String, fallback: String): String {
        val rate = percentRatePattern.find(line)?.groupValues?.getOrNull(1)
            ?: atRatePattern.find(line)?.groupValues?.getOrNull(1)
        return if (rate != null) "$fallback @$rate%" else fallback
    }

    private fun extractAmountNear(
        lines: List<String>,
        index: Int,
        preferTotals: Boolean = false,
    ): String? {

        // Current line + next 8 lines
        for (offset in 0..8) {

            val line = lines.getOrNull(index + offset) ?: continue

            extractAmountFromLine(line, preferTotals)?.let {
                return it
            }
        }

        return null
    }

    private fun extractMerchant(lines: List<String>): String {
        return lines
            .take(8)
            .firstOrNull { line ->
                line.length >= 3 &&
                    line.any(Char::isLetter) &&
                    !line.contains(Regex("""\b(date|phone|ph|gstin|bill|invoice|name)\b""", RegexOption.IGNORE_CASE)) &&
                    !line.matches(Regex("""^[\d\s,./:#-]+$"""))
            }
            ?.take(80)
            .orEmpty()
    }

    private fun extractLineItems(lines: List<String>): List<BillLineItem> {
        val headerIndex = lines.indexOfFirst { isItemHeader(it) }
        if (headerIndex == -1) return emptyList()

        return lines
            .drop(headerIndex + 1)
            .takeWhile { line -> !isTotalsBoundary(line) }
            .mapNotNull { parseItemLine(it) }
    }

    private fun parseItemLine(line: String): BillLineItem? {
        val match = itemPattern.matchEntire(line) ?: return null
        val name = match.groupValues[1].trim(' ', '-', ':')
        if (name.isBlank()) return null
        return BillLineItem(
            name = name,
            quantity = match.groupValues[2].toDoubleOrNull() ?: 1.0,
            unitPrice = match.groupValues[3].toMoney(),
            totalPrice = match.groupValues[4].toMoney(),
        )
    }

    private fun extractGrandTotal(lines: List<String>): String {

        val index = lines.indexOfFirst {
            it.contains(
                Regex("""grand\s*total""", RegexOption.IGNORE_CASE)
            )
        }

        if (index == -1) return ""

        for (offset in 0..8) {

            val line = lines.getOrNull(index + offset).orEmpty()

            extractAmountFromLine(line, preferTotals = true)?.let {
                return it
            }
        }

        return ""
    }

    private fun extractSubtotal(lines: List<String>): String {

        val index = lines.indexOfFirst {
            it.contains(
                Regex("""sub\s*total|subtotal""", RegexOption.IGNORE_CASE)
            )
        }

        if (index == -1) return ""

        for (offset in 0..8) {

            val line = lines.getOrNull(index + offset).orEmpty()

            extractAmountFromLine(line)?.let {
                return it
            }
        }

        return ""
    }

    private fun extractRoundOff(lines: List<String>): String {
        val index = lines.indexOfFirst {
            it.contains("round", ignoreCase = true) &&
                    it.contains("off", ignoreCase = true)
        }

        if (index == -1) return ""

        val amountRegex = Regex("""[+-]?\d+\.\d{1,2}""")

        // OCR may place the amount several lines later.
        for (i in index until minOf(index + 8, lines.size)) {
            val line = lines[i]

            amountRegex.find(line)?.value?.let {
                return it
            }
        }

        return ""
    }

    private fun resolveGrandTotal(
        extracted: String,
        computed: String,
        subtotal: String,
        fallbackText: String,
    ): String {
        val extractedValue = extracted.toMoney()
        val computedValue = computed.toMoney()
        val subtotalValue = subtotal.toMoney()

        if (extracted.isBlank()) {
            return computed.ifBlank { extractLastAmount(fallbackText) }
        }

        if (computedValue != null && subtotalValue != null) {
            val matchesSubtotal = extractedValue != null &&
                kotlin.math.abs(extractedValue - subtotalValue) < 0.01
            val lowerThanExpected = extractedValue != null && extractedValue + 0.01 < computedValue
            if (matchesSubtotal || lowerThanExpected) {
                return computed
            }
        }

        return extracted
    }

    private fun subtotalForGrandTotal(explicitSubtotal: String, lineItemSubtotal: Double): String {
        val explicitValue = explicitSubtotal.toMoney()
        if (lineItemSubtotal <= 0.0) {
            return explicitSubtotal
        }
        if (explicitValue == null) {
            return "%.2f".format(java.util.Locale.US, lineItemSubtotal)
        }
        return if (kotlin.math.abs(explicitValue - lineItemSubtotal) > 0.05) {
            "%.2f".format(java.util.Locale.US, lineItemSubtotal)
        } else {
            explicitSubtotal
        }
    }

    private fun computeGrandTotal(subtotal: String, cgst: String, sgst: String, roundOff: String): String {
        val base = subtotal.toMoney() ?: return ""
        val tax = (cgst.toMoney() ?: 0.0) + (sgst.toMoney() ?: 0.0)
        val round = roundOff.replace("+", "").trim().toMoney() ?: 0.0
        return "%.2f".format(java.util.Locale.US, base + tax + round)
    }

    private fun extractAmountFromLine(
        line: String,
        preferTotals: Boolean = false,
    ): String? {

        // Currency values first
        currencyAmountPattern.findAll(line)
            .map { it.groupValues[1].replace(",", "") }
            .lastOrNull()
            ?.let { return it }

        // Ignore percentages
        val cleanedLine = line.replace(
            Regex("""\d+(\.\d+)?%"""),
            ""
        )

        amountsIn(cleanedLine)
            .lastOrNull()
            ?.let {
                return it
            }

        if (preferTotals) {
            totalAmountPattern.find(cleanedLine)
                ?.groupValues
                ?.get(1)
                ?.replace(",", "")
                ?.let {
                    return it
                }
        }

        return null
    }

    private fun calculateSubtotal(total: String, cgst: String, sgst: String): String {
        val totalValue = total.toMoney() ?: return ""
        val tax = (cgst.toMoney() ?: 0.0) + (sgst.toMoney() ?: 0.0)
        return "%.2f".format(java.util.Locale.US, totalValue - tax)
    }

    private fun extractLastAmount(text: String): String {
        return amountsIn(text).lastOrNull().orEmpty()
    }

    private fun amountsIn(text: String): List<String> =
        decimalPattern.findAll(text)
            .map { it.groupValues[1].replace(",", "") }
            .filter { it.contains('.') }
            .toList()

    private fun valueOf(fields: List<ExtractedField>, type: ExtractedFieldType): String =
        fields.firstOrNull { it.type == type }?.value.orEmpty()

    private fun field(type: ExtractedFieldType, label: String, value: String): ExtractedField =
        ExtractedField(
            id = UUID.randomUUID().toString(),
            type = type,
            label = label,
            value = value.trim(),
        )

    private fun formatLineItemValue(item: BillLineItem): String {
        val qty = item.quantity.let {
            if (it % 1.0 == 0.0) it.toInt().toString() else it.toString()
        }
        val unit = item.unitPrice?.let { "%.2f".format(java.util.Locale.US, it) }.orEmpty()
        val total = item.totalPrice?.let { "%.2f".format(java.util.Locale.US, it) }.orEmpty()
        return listOf(qty, unit, total).joinToString("|")
    }

    private fun isItemHeader(line: String): Boolean =
        line.contains("item", ignoreCase = true) &&
            (line.contains("qty", ignoreCase = true) || line.contains("price", ignoreCase = true))

    private fun isTotalsBoundary(line: String): Boolean =
        line.contains(
            Regex("""\b(sub\s*total|total\s*qty|grand\s*total|round\s*off|discount|service\s*charge)\b""", RegexOption.IGNORE_CASE),
        ) || matchesAnyGst(line)

    private fun isMetadataLine(line: String): Boolean =
        line.contains(
            Regex("""\b(date|phone|ph|gstin|gst|fssai|bill|invoice|name|cashier|token)\b""", RegexOption.IGNORE_CASE),
        )

    private fun isNoiseLine(line: String): Boolean {
        val lower = line.lowercase()
        return lower == "thanks" ||
            lower.contains("thank you") ||
            lower.contains("visit again") ||
            line.matches(Regex("""^[\-_=.*]+$""")) ||
            isItemHeader(line)
    }

    private fun looksLikeGstin(line: String): Boolean =
        line.contains(Regex("""(?i)\bgst(?:in)?\b""")) ||
            line.matches(Regex("""(?i).*?\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]\b.*"""))

    private fun looksLikeFssai(line: String): Boolean =
        line.contains("fssai", ignoreCase = true)

    private fun looksLikeAddress(line: String): Boolean =
        line.contains(
            Regex("""(?i)\b(road|layout|street|bangalore|bengaluru|mumbai|delhi|block|main|nagar|sector)\b"""),
        ) || line.contains(Regex("""\b\d{6}\b"""))

    private fun stripLabel(line: String, label: String): String =
        line.replace(Regex("""(?i)$label\s*:?\s*"""), "").trim()

    private fun extractAfterLabel(line: String, labels: List<String>): String {
        for (label in labels) {
            val idx = line.indexOf(label, ignoreCase = true)
            if (idx >= 0) {
                var value = line.substring(idx + label.length).trim(' ', ':', '-', '.')
                val stop = Regex("""\b(bill\s*no|token\s*no|cashier|date|time|self\s*service)\b""", RegexOption.IGNORE_CASE)
                    .find(value)
                if (stop != null) {
                    value = value.substring(0, stop.range.first).trim(' ', ':', '-', '.')
                }
                if (value.isNotBlank()) return value
            }
        }
        return ""
    }

    private fun extractGenericLabeledValue(line: String): Pair<String, String>? {
        val match = labeledValuePattern.find(line) ?: return null
        val label = match.groupValues[1].trim().replaceFirstChar { it.uppercase() }
        val value = match.groupValues[2].trim()
        if (value.isBlank()) return null
        return label to value
    }

    private fun String.toMoney(): Double? = replace(",", "").toDoubleOrNull()
}

/** Local helper so OcrParser does not depend on ScanDraft companion at parse time. */
private object ScanDraftLineItem {
    fun parse(label: String, value: String): BillLineItem? {
        val parts = value.split("|").map { it.trim() }
        if (parts.size < 3) {
            val amount = value.replace(",", "").toDoubleOrNull()
            return BillLineItem(name = label.ifBlank { "Item" }, totalPrice = amount)
        }
        return BillLineItem(
            name = label.ifBlank { "Item" },
            quantity = parts[0].toDoubleOrNull() ?: 1.0,
            unitPrice = parts.getOrNull(1)?.toDoubleOrNull(),
            totalPrice = parts.getOrNull(2)?.toDoubleOrNull(),
        )
    }
}
