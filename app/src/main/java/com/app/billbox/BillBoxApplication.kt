package com.app.billbox

import android.app.Application
import com.app.billbox.data.local.BillBoxDatabase
import com.app.billbox.data.preferences.UserPreferencesRepository
import com.app.billbox.data.repository.ProductRepository

class BillBoxApplication : Application() {
    val database by lazy { BillBoxDatabase.getInstance(this) }
    val productRepository by lazy {
        ProductRepository(database.productDao(), database.reminderDao())
    }
    val userPreferences by lazy { UserPreferencesRepository(this) }
}
