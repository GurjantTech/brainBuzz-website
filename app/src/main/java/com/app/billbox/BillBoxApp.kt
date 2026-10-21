package com.app.billbox

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.rememberNavController
import com.app.billbox.navigation.BillBoxNavGraph
import com.app.billbox.ui.theme.BillboxTheme
import com.app.billbox.ui.theme.ThemeMode

@Composable
fun BillBoxApp(
    themeMode: ThemeMode,
    viewModelFactory: BillBoxViewModelFactory,
) {
    val navController = rememberNavController()

    BillboxTheme(themeMode = themeMode) {
        BillBoxNavGraph(
            navController = navController,
            viewModelFactory = viewModelFactory,
        )
    }
}

@Composable
fun BillBoxAppWithTheme(
    viewModelFactory: BillBoxViewModelFactory,
    preferencesRepository: com.app.billbox.data.preferences.UserPreferencesRepository,
) {
    val themeMode by preferencesRepository.themeMode.collectAsStateWithLifecycle(initialValue = ThemeMode.System)

    BillBoxApp(
        themeMode = themeMode,
        viewModelFactory = viewModelFactory,
    )
}
