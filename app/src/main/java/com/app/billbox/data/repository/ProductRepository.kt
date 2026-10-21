package com.app.billbox.data.repository

import com.app.billbox.data.local.ProductDao
import com.app.billbox.data.local.ReceiptImageStore
import com.app.billbox.data.local.ReminderDao
import com.app.billbox.data.local.toDomain
import com.app.billbox.data.local.toEntity
import com.app.billbox.domain.model.DashboardStats
import com.app.billbox.domain.model.Product
import com.app.billbox.domain.model.Reminder
import com.app.billbox.domain.model.ReminderType
import com.app.billbox.domain.model.ScanDraft
import com.app.billbox.domain.model.WarrantyStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import java.util.Calendar
import java.util.concurrent.TimeUnit

class ProductRepository(
    private val productDao: ProductDao,
    private val reminderDao: ReminderDao,
) {
    fun getAllProducts(): Flow<List<Product>> =
        productDao.getAllProducts().mapEntities()

    fun getRecentProducts(limit: Int = 3): Flow<List<Product>> =
        productDao.getRecentProducts(limit).mapEntities()

    fun searchProducts(query: String): Flow<List<Product>> =
        productDao.searchProducts(query).mapEntities()

    fun getProductsByCategory(category: String): Flow<List<Product>> =
        productDao.getProductsByCategory(category).mapEntities()

    fun getCategories(): Flow<List<String>> = productDao.getCategories()

    suspend fun getProductById(id: Long): Product? =
        productDao.getProductById(id)?.toDomain()

    fun getDashboardStats(): Flow<DashboardStats> = combine(
        productDao.getProductCount(),
        productDao.getExpiringCount(),
        reminderDao.getActiveReminderCount(),
    ) { total, expiring, reminders ->
        DashboardStats(
            totalProducts = total,
            expiringSoon = expiring,
            activeReminders = reminders,
        )
    }

    fun getUpcomingReminders(limit: Int = 3): Flow<List<Reminder>> =
        reminderDao.getUpcomingReminders(limit).map { list -> list.map { it.toDomain() } }

    fun getAllReminders(): Flow<List<Reminder>> =
        reminderDao.getAllReminders().map { list -> list.map { it.toDomain() } }

    fun getRemindersByType(type: ReminderType): Flow<List<Reminder>> =
        reminderDao.getRemindersByType(type.name).map { list -> list.map { it.toDomain() } }

    suspend fun saveProductFromScan(draft: ScanDraft): Long {
        val amount = draft.amount.toDoubleOrNull()
        val warrantyExpiry = draft.warrantyExpiry ?: calculateWarrantyExpiry(
            draft.purchaseDate,
            draft.warrantyDurationMonths,
        )
        val warrantyStatus = computeWarrantyStatus(warrantyExpiry)

        val product = Product(
            name = draft.productName.ifBlank { "Unnamed Product" },
            merchant = draft.merchant.ifBlank { null },
            purchaseDate = draft.purchaseDate,
            amount = amount,
            currencyCode = draft.currencyCode.ifBlank { "INR" },
            subtotal = draft.subtotal.toDoubleOrNull(),
            cgst = draft.cgst.toDoubleOrNull(),
            sgst = draft.sgst.toDoubleOrNull(),
            lineItems = draft.lineItems,
            extractedFields = draft.extractedFields,
            rawOcrText = draft.rawOcrText,
            category = draft.category,
            billImageUri = draft.billImageUri,
            warrantyExpiry = warrantyExpiry,
            warrantyStatus = warrantyStatus,
        )

        val productId = productDao.insert(product.toEntity())
        val reminders = buildRemindersFromDraft(
            productId = productId,
            productName = product.merchant ?: product.name,
            draft = draft,
            warrantyExpiry = warrantyExpiry,
        )
        if (reminders.isNotEmpty()) {
            reminderDao.insertAll(reminders)
        }
        return productId
    }

    suspend fun updateProduct(product: Product) {
        productDao.update(product.toEntity())
    }

    suspend fun deleteProduct(id: Long) {
        val product = productDao.getProductById(id)
        reminderDao.deleteByProductId(id)
        productDao.deleteById(id)
        ReceiptImageStore.delete(product?.billImageUri)
    }

    suspend fun getAllProductsForExport(): List<Product> =
        productDao.getAllProducts().first().map { it.toDomain() }

    suspend fun getAllRemindersForExport(): List<Reminder> =
        reminderDao.getAllReminders().first().map { it.toDomain() }

    private fun buildRemindersFromDraft(
        productId: Long,
        productName: String,
        draft: ScanDraft,
        warrantyExpiry: Long?,
    ) = buildList {
        if (draft.enableWarrantyReminder && warrantyExpiry != null) {
            add(
                Reminder(
                    productId = productId,
                    productName = productName,
                    type = ReminderType.Warranty,
                    dueDate = warrantyExpiry,
                ).toEntity(),
            )
        }
        if (draft.enableReturnReminder && draft.returnReminderDate != null) {
            add(
                Reminder(
                    productId = productId,
                    productName = productName,
                    type = ReminderType.Return,
                    dueDate = draft.returnReminderDate,
                ).toEntity(),
            )
        }
        if (draft.enableServiceReminder && draft.serviceReminderDate != null) {
            add(
                Reminder(
                    productId = productId,
                    productName = productName,
                    type = ReminderType.Service,
                    dueDate = draft.serviceReminderDate,
                ).toEntity(),
            )
        }
    }

    private fun Flow<List<com.app.billbox.data.local.ProductEntity>>.mapEntities(): Flow<List<Product>> =
        map { list -> list.map { it.toDomain() } }

    companion object {
        fun calculateWarrantyExpiry(purchaseDate: Long, months: Int): Long {
            val calendar = Calendar.getInstance().apply {
                timeInMillis = purchaseDate
                add(Calendar.MONTH, months)
            }
            return calendar.timeInMillis
        }

        fun computeWarrantyStatus(warrantyExpiry: Long?): WarrantyStatus {
            if (warrantyExpiry == null) return WarrantyStatus.None
            val now = System.currentTimeMillis()
            val daysRemaining = TimeUnit.MILLISECONDS.toDays(warrantyExpiry - now)
            return when {
                daysRemaining < 0 -> WarrantyStatus.Expired
                daysRemaining <= 30 -> WarrantyStatus.Expiring
                else -> WarrantyStatus.Active
            }
        }
    }
}
