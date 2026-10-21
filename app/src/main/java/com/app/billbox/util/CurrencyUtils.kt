package com.app.billbox.util

import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

object CurrencyUtils {
    const val DEFAULT_CURRENCY = "INR"

    private val currencyPatterns = listOf(
        Regex("""₹|Rs\.?|INR|Indian\s+Rupee""", RegexOption.IGNORE_CASE) to "INR",
        Regex("""\$|USD|US\s*\$""", RegexOption.IGNORE_CASE) to "USD",
        Regex("""€|EUR""", RegexOption.IGNORE_CASE) to "EUR",
        Regex("""£|GBP""", RegexOption.IGNORE_CASE) to "GBP",
        Regex("""¥|JPY""", RegexOption.IGNORE_CASE) to "JPY",
        Regex("""AED|د\.إ""", RegexOption.IGNORE_CASE) to "AED",
        Regex("""CAD""", RegexOption.IGNORE_CASE) to "CAD",
        Regex("""AUD""", RegexOption.IGNORE_CASE) to "AUD",
        Regex("""SGD""", RegexOption.IGNORE_CASE) to "SGD",
    )

    private val localeByCurrency = mapOf(
        "INR" to Locale.forLanguageTag("en-IN"),
        "USD" to Locale.US,
        "EUR" to Locale.GERMANY,
        "GBP" to Locale.UK,
        "JPY" to Locale.JAPAN,
        "AED" to Locale.forLanguageTag("en-AE"),
        "CAD" to Locale.CANADA,
        "AUD" to Locale.forLanguageTag("en-AU"),
        "SGD" to Locale.forLanguageTag("en-SG"),
    )

    fun detectCurrencyCode(text: String): String {
        for ((pattern, code) in currencyPatterns) {
            if (pattern.containsMatchIn(text)) return code
        }
        return DEFAULT_CURRENCY
    }

    fun formatAmount(amount: Double?, currencyCode: String? = DEFAULT_CURRENCY): String {
        if (amount == null) return "—"
        val code = currencyCode?.takeIf { it.isNotBlank() } ?: DEFAULT_CURRENCY
        return runCatching {
            val currency = Currency.getInstance(code)
            val locale = localeByCurrency[code] ?: Locale.getDefault()
            NumberFormat.getCurrencyInstance(locale).apply {
                this.currency = currency
            }.format(amount)
        }.getOrElse {
            "$code ${"%.2f".format(Locale.US, amount)}"
        }
    }

    fun currencyLabel(currencyCode: String?): String {
        val code = currencyCode?.takeIf { it.isNotBlank() } ?: DEFAULT_CURRENCY
        return runCatching {
            val currency = Currency.getInstance(code)
            "${currency.symbol} ($code)"
        }.getOrElse { code }
    }
}
