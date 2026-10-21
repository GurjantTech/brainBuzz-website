package com.app.billbox.feature.products

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.billbox.data.repository.ProductRepository
import com.app.billbox.domain.model.Product
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class ProductSort {
    Date,
    Name,
    Expiry,
}

data class ProductsUiState(
    val searchQuery: String = "",
    val selectedCategory: String? = null,
    val sort: ProductSort = ProductSort.Date,
    val categories: List<String> = emptyList(),
)

@OptIn(ExperimentalCoroutinesApi::class)
class ProductsViewModel(
    private val repository: ProductRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProductsUiState())
    val uiState: StateFlow<ProductsUiState> = _uiState.asStateFlow()

    val products: StateFlow<List<Product>> = combine(
        _uiState,
    ) { states ->
        val state = states[0]
        when {
            state.searchQuery.isNotBlank() -> repository.searchProducts(state.searchQuery)
            state.selectedCategory != null -> repository.getProductsByCategory(state.selectedCategory)
            else -> repository.getAllProducts()
        }
    }.flatMapLatest { it }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        viewModelScope.launch {
            repository.getCategories().collect { categories ->
                _uiState.update { it.copy(categories = categories) }
            }
        }
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun selectCategory(category: String?) {
        _uiState.update {
            it.copy(selectedCategory = category?.takeIf { c -> c.isNotBlank() })
        }
    }

    fun setSort(sort: ProductSort) {
        _uiState.update { it.copy(sort = sort) }
    }

    fun sortedProducts(products: List<Product>): List<Product> {
        return when (_uiState.value.sort) {
            ProductSort.Date -> products.sortedByDescending { it.createdAt }
            ProductSort.Name -> products.sortedBy { it.name }
            ProductSort.Expiry -> products.sortedBy { it.warrantyExpiry ?: Long.MAX_VALUE }
        }
    }
}

class ProductDetailViewModel(
    private val repository: ProductRepository,
    private val productId: Long,
) : ViewModel() {

    private val _product = MutableStateFlow<Product?>(null)
    val product: StateFlow<Product?> = _product.asStateFlow()

    init {
        viewModelScope.launch {
            _product.value = repository.getProductById(productId)
        }
    }

    fun deleteProduct(onDeleted: () -> Unit) {
        viewModelScope.launch {
            repository.deleteProduct(productId)
            onDeleted()
        }
    }

    fun updateProduct(name: String, merchant: String, category: String, amount: String) {
        val current = _product.value ?: return
        val updated = current.copy(
            name = name.trim().ifBlank { current.name },
            merchant = merchant.trim().ifBlank { null },
            category = category.trim().ifBlank { current.category },
            amount = amount.trim().replace(",", "").toDoubleOrNull() ?: current.amount,
        )
        viewModelScope.launch {
            repository.updateProduct(updated)
            _product.value = repository.getProductById(productId)
        }
    }
}
