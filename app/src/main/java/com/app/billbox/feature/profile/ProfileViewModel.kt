package com.app.billbox.feature.profile

import android.content.Context
import android.os.Environment
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.billbox.data.preferences.UserPreferencesRepository
import com.app.billbox.data.repository.ProductRepository
import com.app.billbox.ui.theme.ThemeMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class ProfileUiState(
    val themeMode: ThemeMode = ThemeMode.System,
    val notificationsEnabled: Boolean = true,
    val exportMessage: String? = null,
    val isExporting: Boolean = false,
)

class ProfileViewModel(
    private val preferencesRepository: UserPreferencesRepository,
    private val productRepository: ProductRepository,
    private val appContext: Context,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    val themeMode: StateFlow<ThemeMode> = preferencesRepository.themeMode
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), ThemeMode.System)

    init {
        viewModelScope.launch {
            preferencesRepository.themeMode.collect { mode ->
                _uiState.update { it.copy(themeMode = mode) }
            }
        }
        viewModelScope.launch {
            preferencesRepository.notificationsEnabled.collect { enabled ->
                _uiState.update { it.copy(notificationsEnabled = enabled) }
            }
        }
    }

    fun setThemeMode(mode: ThemeMode) {
        viewModelScope.launch {
            preferencesRepository.setThemeMode(mode)
        }
    }

    fun setNotificationsEnabled(enabled: Boolean) {
        viewModelScope.launch {
            preferencesRepository.setNotificationsEnabled(enabled)
        }
    }

    fun exportBackup() {
        viewModelScope.launch {
            _uiState.update { it.copy(isExporting = true, exportMessage = null) }
            try {
                val products = productRepository.getAllProductsForExport()
                val reminders = productRepository.getAllRemindersForExport()

                val json = JSONObject().apply {
                    put("exportedAt", System.currentTimeMillis())
                    put("products", JSONArray().apply {
                        products.forEach { p ->
                            put(
                                JSONObject().apply {
                                    put("id", p.id)
                                    put("name", p.name)
                                    put("merchant", p.merchant)
                                    put("purchaseDate", p.purchaseDate)
                                    put("amount", p.amount)
                                    put("currencyCode", p.currencyCode)
                                    put("subtotal", p.subtotal)
                                    put("cgst", p.cgst)
                                    put("sgst", p.sgst)
                                    put("category", p.category)
                                    put("warrantyExpiry", p.warrantyExpiry)
                                    put("warrantyStatus", p.warrantyStatus.name)
                                },
                            )
                        }
                    })
                    put("reminders", JSONArray().apply {
                        reminders.forEach { r ->
                            put(
                                JSONObject().apply {
                                    put("id", r.id)
                                    put("productId", r.productId)
                                    put("productName", r.productName)
                                    put("type", r.type.name)
                                    put("dueDate", r.dueDate)
                                    put("isEnabled", r.isEnabled)
                                },
                            )
                        }
                    })
                }

                val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
                val fileName = "billbox_backup_$timestamp.json"
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val file = File(downloadsDir, fileName)
                file.writeText(json.toString(2))

                _uiState.update {
                    it.copy(
                        isExporting = false,
                        exportMessage = "Backup saved to Downloads/$fileName",
                    )
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isExporting = false,
                        exportMessage = "Export failed: ${e.message}",
                    )
                }
            }
        }
    }
}
