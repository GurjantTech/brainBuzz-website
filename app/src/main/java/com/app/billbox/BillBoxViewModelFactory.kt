package com.app.billbox

import android.app.Application
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.app.billbox.data.preferences.UserPreferencesRepository
import com.app.billbox.data.repository.ProductRepository
import com.app.billbox.feature.home.HomeViewModel
import com.app.billbox.feature.products.ProductDetailViewModel
import com.app.billbox.feature.products.ProductsViewModel
import com.app.billbox.feature.profile.ProfileViewModel
import com.app.billbox.feature.reminders.RemindersViewModel
import com.app.billbox.feature.scan.ScanViewModel
import com.app.billbox.feature.splash.SplashViewModel

class BillBoxViewModelFactory(
    private val application: Application,
) : ViewModelProvider.Factory {

    private val app get() = application as BillBoxApplication
    private val productRepository: ProductRepository get() = app.productRepository
    private val userPreferences: UserPreferencesRepository get() = app.userPreferences

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(SplashViewModel::class.java) ->
                SplashViewModel(userPreferences) as T
            modelClass.isAssignableFrom(HomeViewModel::class.java) ->
                HomeViewModel(productRepository) as T
            modelClass.isAssignableFrom(ProductsViewModel::class.java) ->
                ProductsViewModel(productRepository) as T
            modelClass.isAssignableFrom(RemindersViewModel::class.java) ->
                RemindersViewModel(productRepository) as T
            modelClass.isAssignableFrom(ProfileViewModel::class.java) ->
                ProfileViewModel(userPreferences, productRepository, application) as T
            modelClass.isAssignableFrom(ScanViewModel::class.java) ->
                ScanViewModel(productRepository, application) as T
            modelClass.isAssignableFrom(ProductDetailViewModel::class.java) ->
                throw IllegalArgumentException("Use productDetailViewModel(productId)")
            else -> throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
        }
    }

    fun productDetailViewModel(productId: Long): ProductDetailViewModel =
        ProductDetailViewModel(productRepository, productId)
}
