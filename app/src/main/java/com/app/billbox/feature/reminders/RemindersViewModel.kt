package com.app.billbox.feature.reminders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.billbox.data.repository.ProductRepository
import com.app.billbox.domain.model.Reminder
import com.app.billbox.domain.model.ReminderType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.ExperimentalCoroutinesApi

@OptIn(ExperimentalCoroutinesApi::class)
class RemindersViewModel(
    repository: ProductRepository,
) : ViewModel() {

    private val _selectedType = MutableStateFlow<ReminderType?>(null)
    val selectedType: StateFlow<ReminderType?> = _selectedType.asStateFlow()

    val reminders: StateFlow<List<Reminder>> = _selectedType
        .flatMapLatest { type ->
            if (type == null) repository.getAllReminders()
            else repository.getRemindersByType(type)
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun selectType(type: ReminderType?) {
        _selectedType.update { type }
    }
}
