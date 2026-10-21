package com.app.billbox.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY createdAt DESC")
    fun getAllProducts(): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE id = :id")
    suspend fun getProductById(id: Long): ProductEntity?

    @Query("SELECT * FROM products ORDER BY createdAt DESC LIMIT :limit")
    fun getRecentProducts(limit: Int): Flow<List<ProductEntity>>

    @Query("SELECT COUNT(*) FROM products")
    fun getProductCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM products WHERE warrantyStatus = 'Expiring'")
    fun getExpiringCount(): Flow<Int>

    @Query("SELECT * FROM products WHERE name LIKE '%' || :query || '%' OR merchant LIKE '%' || :query || '%' ORDER BY createdAt DESC")
    fun searchProducts(query: String): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE category = :category ORDER BY createdAt DESC")
    fun getProductsByCategory(category: String): Flow<List<ProductEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(product: ProductEntity): Long

    @Update
    suspend fun update(product: ProductEntity)

    @Query("DELETE FROM products WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("SELECT DISTINCT category FROM products ORDER BY category ASC")
    fun getCategories(): Flow<List<String>>
}

@Dao
interface ReminderDao {
    @Query("SELECT * FROM reminders WHERE isEnabled = 1 ORDER BY dueDate ASC")
    fun getAllReminders(): Flow<List<ReminderEntity>>

    @Query("SELECT * FROM reminders WHERE isEnabled = 1 ORDER BY dueDate ASC LIMIT :limit")
    fun getUpcomingReminders(limit: Int): Flow<List<ReminderEntity>>

    @Query("SELECT COUNT(*) FROM reminders WHERE isEnabled = 1")
    fun getActiveReminderCount(): Flow<Int>

    @Query("SELECT * FROM reminders WHERE type = :type AND isEnabled = 1 ORDER BY dueDate ASC")
    fun getRemindersByType(type: String): Flow<List<ReminderEntity>>

    @Query("SELECT * FROM reminders WHERE productId = :productId")
    suspend fun getRemindersForProduct(productId: Long): List<ReminderEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(reminder: ReminderEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(reminders: List<ReminderEntity>)

    @Query("DELETE FROM reminders WHERE productId = :productId")
    suspend fun deleteByProductId(productId: Long)

    @Query("DELETE FROM reminders WHERE id = :id")
    suspend fun deleteById(id: Long)
}
