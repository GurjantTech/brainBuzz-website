package com.app.billbox.util

import com.app.billbox.domain.model.ReminderType
import com.app.billbox.domain.model.WarrantyStatus
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

object DateUtils {
    private val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())

    fun formatDate(timestamp: Long): String = dateFormat.format(Date(timestamp))

    fun formatAmount(amount: Double?, currencyCode: String? = CurrencyUtils.DEFAULT_CURRENCY): String =
        CurrencyUtils.formatAmount(amount, currencyCode)

    fun daysUntil(timestamp: Long): Long =
        TimeUnit.MILLISECONDS.toDays(timestamp - System.currentTimeMillis())

    fun warrantyStatusLabel(status: WarrantyStatus): String = when (status) {
        WarrantyStatus.Active -> "Active"
        WarrantyStatus.Expiring -> "Expiring Soon"
        WarrantyStatus.Expired -> "Expired"
        WarrantyStatus.None -> "No Warranty"
    }

    fun reminderTypeLabel(type: ReminderType): String = type.name
}
