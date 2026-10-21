package com.app.billbox.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.migration.Migration
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [ProductEntity::class, ReminderEntity::class],
    version = 4,
    exportSchema = false,
)
abstract class BillBoxDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun reminderDao(): ReminderDao

    companion object {
        @Volatile
        private var INSTANCE: BillBoxDatabase? = null

        fun getInstance(context: Context): BillBoxDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: buildDatabase(context.applicationContext).also { INSTANCE = it }
            }
        }

        private fun buildDatabase(context: Context): BillBoxDatabase {
            return Room.databaseBuilder(
                context,
                BillBoxDatabase::class.java,
                "billbox.db",
            )
                .addMigrations(MIGRATION_1_2, MIGRATION_2_3, MIGRATION_3_4)
                .addCallback(SeedCallback())
                .build()
        }

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE products ADD COLUMN subtotal REAL")
                db.execSQL("ALTER TABLE products ADD COLUMN cgst REAL")
                db.execSQL("ALTER TABLE products ADD COLUMN sgst REAL")
                db.execSQL("ALTER TABLE products ADD COLUMN lineItemsJson TEXT NOT NULL DEFAULT '[]'")
                db.execSQL("ALTER TABLE products ADD COLUMN rawOcrText TEXT NOT NULL DEFAULT ''")
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE products ADD COLUMN currencyCode TEXT NOT NULL DEFAULT 'INR'")
            }
        }

        private val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE products ADD COLUMN extractedFieldsJson TEXT NOT NULL DEFAULT '[]'")
            }
        }
    }

    private class SeedCallback : Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                CoroutineScope(Dispatchers.IO).launch {
                    seedDatabase(database)
                }
            }
        }
    }
}

private suspend fun seedDatabase(database: BillBoxDatabase) {
    val productDao = database.productDao()
    val reminderDao = database.reminderDao()

    val now = System.currentTimeMillis()
    val dayMs = 24 * 60 * 60 * 1000L

    val laptopId = productDao.insert(
        ProductEntity(
            name = "MacBook Pro 14\"",
            merchant = "Apple Store",
            purchaseDate = now - 30 * dayMs,
            amount = 1999.99,
            currencyCode = "USD",
            category = "Electronics",
            billImageUri = null,
            warrantyExpiry = now + 335 * dayMs,
            warrantyStatus = "Active",
            createdAt = now - 30 * dayMs,
        ),
    )
    val phoneId = productDao.insert(
        ProductEntity(
            name = "iPhone 15",
            merchant = "Best Buy",
            purchaseDate = now - 300 * dayMs,
            amount = 999.00,
            currencyCode = "USD",
            category = "Electronics",
            billImageUri = null,
            warrantyExpiry = now + 15 * dayMs,
            warrantyStatus = "Expiring",
            createdAt = now - 300 * dayMs,
        ),
    )
    val fridgeId = productDao.insert(
        ProductEntity(
            name = "Samsung Refrigerator",
            merchant = "Home Depot",
            purchaseDate = now - 400 * dayMs,
            amount = 1299.00,
            currencyCode = "USD",
            category = "Appliances",
            billImageUri = null,
            warrantyExpiry = now - 10 * dayMs,
            warrantyStatus = "Expired",
            createdAt = now - 400 * dayMs,
        ),
    )

    reminderDao.insertAll(
        listOf(
            ReminderEntity(
                productId = laptopId,
                productName = "MacBook Pro 14\"",
                type = "Warranty",
                dueDate = now + 335 * dayMs,
                isEnabled = true,
            ),
            ReminderEntity(
                productId = phoneId,
                productName = "iPhone 15",
                type = "Warranty",
                dueDate = now + 15 * dayMs,
                isEnabled = true,
            ),
            ReminderEntity(
                productId = phoneId,
                productName = "iPhone 15",
                type = "Return",
                dueDate = now + 5 * dayMs,
                isEnabled = true,
            ),
            ReminderEntity(
                productId = fridgeId,
                productName = "Samsung Refrigerator",
                type = "Service",
                dueDate = now + 60 * dayMs,
                isEnabled = true,
            ),
        ),
    )
}
