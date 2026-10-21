package com.app.billbox.feature.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.billbox.data.repository.ProductRepository
import com.app.billbox.domain.model.DashboardStats
import com.app.billbox.domain.model.Product
import com.app.billbox.domain.model.Reminder
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

class HomeViewModel(
    repository: ProductRepository,
) : ViewModel() {
    val stats: StateFlow<DashboardStats> = repository.getDashboardStats()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DashboardStats())

    val recentProducts: StateFlow<List<Product>> = repository.getRecentProducts(3)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val upcomingReminders: StateFlow<List<Reminder>> = repository.getUpcomingReminders(3)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
}
