package com.app.billbox.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.app.billbox.domain.model.BillLineItem
import com.app.billbox.domain.model.ExtractedField
import com.app.billbox.domain.model.ExtractedFieldType
import com.app.billbox.domain.model.Product
import com.app.billbox.domain.model.Reminder
import com.app.billbox.domain.model.ReminderType
import com.app.billbox.domain.model.WarrantyStatus
import org.json.JSONArray
import org.json.JSONObject

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val merchant: String?,
    val purchaseDate: Long,
    val amount: Double?,
    val currencyCode: String = "INR",
    val subtotal: Double? = null,
    val cgst: Double? = null,
    val sgst: Double? = null,
    val lineItemsJson: String = "[]",
    val extractedFieldsJson: String = "[]",
    val rawOcrText: String = "",
    val category: String,
    val billImageUri: String?,
    val warrantyExpiry: Long?,
    val warrantyStatus: String,
    val createdAt: Long,
)

@Entity(tableName = "reminders")
data class ReminderEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val productId: Long,
    val productName: String,
    val type: String,
    val dueDate: Long,
    val isEnabled: Boolean,
)

fun ProductEntity.toDomain(): Product = Product(
    id = id,
    name = name,
    merchant = merchant,
    purchaseDate = purchaseDate,
    amount = amount,
    currencyCode = currencyCode,
    subtotal = subtotal,
    cgst = cgst,
    sgst = sgst,
    lineItems = decodeLineItems(lineItemsJson),
    extractedFields = decodeExtractedFields(extractedFieldsJson),
    rawOcrText = rawOcrText,
    category = category,
    billImageUri = billImageUri,
    warrantyExpiry = warrantyExpiry,
    warrantyStatus = WarrantyStatus.valueOf(warrantyStatus),
    createdAt = createdAt,
)

fun Product.toEntity(): ProductEntity = ProductEntity(
    id = id,
    name = name,
    merchant = merchant,
    purchaseDate = purchaseDate,
    amount = amount,
    currencyCode = currencyCode,
    subtotal = subtotal,
    cgst = cgst,
    sgst = sgst,
    lineItemsJson = encodeLineItems(lineItems),
    extractedFieldsJson = encodeExtractedFields(extractedFields),
    rawOcrText = rawOcrText,
    category = category,
    billImageUri = billImageUri,
    warrantyExpiry = warrantyExpiry,
    warrantyStatus = warrantyStatus.name,
    createdAt = createdAt,
)

fun ReminderEntity.toDomain(): Reminder = Reminder(
    id = id,
    productId = productId,
    productName = productName,
    type = ReminderType.valueOf(type),
    dueDate = dueDate,
    isEnabled = isEnabled,
)

fun Reminder.toEntity(): ReminderEntity = ReminderEntity(
    id = id,
    productId = productId,
    productName = productName,
    type = type.name,
    dueDate = dueDate,
    isEnabled = isEnabled,
)

private fun encodeLineItems(items: List<BillLineItem>): String =
    JSONArray().apply {
        items.forEach { item ->
            put(
                JSONObject().apply {
                    put("name", item.name)
                    put("quantity", item.quantity)
                    item.unitPrice?.let { put("unitPrice", it) }
                    item.totalPrice?.let { put("totalPrice", it) }
                },
            )
        }
    }.toString()

private fun decodeLineItems(value: String): List<BillLineItem> = runCatching {
    val array = JSONArray(value)
    buildList {
        repeat(array.length()) { index ->
            val item = array.getJSONObject(index)
            add(
                BillLineItem(
                    name = item.optString("name"),
                    quantity = item.optDouble("quantity", 1.0),
                    unitPrice = item.optNullableDouble("unitPrice"),
                    totalPrice = item.optNullableDouble("totalPrice"),
                ),
            )
        }
    }
}.getOrDefault(emptyList())

private fun encodeExtractedFields(fields: List<ExtractedField>): String =
    JSONArray().apply {
        fields.forEach { field ->
            put(
                JSONObject().apply {
                    put("id", field.id)
                    put("type", field.type.name)
                    put("label", field.label)
                    put("value", field.value)
                },
            )
        }
    }.toString()

private fun decodeExtractedFields(value: String): List<ExtractedField> = runCatching {
    val array = JSONArray(value)
    buildList {
        repeat(array.length()) { index ->
            val item = array.getJSONObject(index)
            val type = runCatching {
                ExtractedFieldType.valueOf(item.optString("type"))
            }.getOrDefault(ExtractedFieldType.OTHER)
            add(
                ExtractedField(
                    id = item.optString("id").ifBlank { "field-$index" },
                    type = type,
                    label = item.optString("label"),
                    value = item.optString("value"),
                ),
            )
        }
    }
}.getOrDefault(emptyList())

private fun JSONObject.optNullableDouble(key: String): Double? =
    if (has(key) && !isNull(key)) optDouble(key) else null
