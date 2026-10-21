package com.app.billbox.feature.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.app.billbox.data.preferences.UserPreferencesRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn

class SplashViewModel(
    preferencesRepository: UserPreferencesRepository,
) : ViewModel() {
    val onboardingCompleted: StateFlow<Boolean?> = preferencesRepository.onboardingCompleted
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val isLoggedIn: StateFlow<Boolean?> = preferencesRepository.isLoggedIn
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)
}
