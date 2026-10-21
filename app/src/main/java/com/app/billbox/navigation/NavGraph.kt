package com.app.billbox.navigation

import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.app.billbox.BillBoxApplication
import com.app.billbox.BillBoxViewModelFactory
import com.app.billbox.feature.auth.LoginScreen
import com.app.billbox.feature.auth.OtpVerificationScreen
import com.app.billbox.feature.home.HomeDashboardScreen
import com.app.billbox.feature.home.HomeViewModel
import com.app.billbox.feature.onboarding.OnboardingScreen
import com.app.billbox.feature.products.MyProductsScreen
import com.app.billbox.feature.products.ProductDetailScreen
import com.app.billbox.feature.products.ProductsViewModel
import com.app.billbox.feature.profile.ProfileSettingsScreen
import com.app.billbox.feature.profile.ProfileViewModel
import com.app.billbox.feature.reminders.RemindersScreen
import com.app.billbox.feature.reminders.RemindersViewModel
import com.app.billbox.feature.scan.AddWarrantyDetailsScreen
import com.app.billbox.feature.scan.CameraCaptureScreen
import com.app.billbox.feature.scan.ProductSavedScreen
import com.app.billbox.feature.scan.ReviewExtractedDataScreen
import com.app.billbox.feature.scan.ScanProcessingScreen
import com.app.billbox.feature.scan.ScanViewModel
import com.app.billbox.feature.scan.SetRemindersScreen
import com.app.billbox.feature.scan.SourcePickerSheet
import com.app.billbox.feature.splash.SplashScreen
import com.app.billbox.feature.splash.SplashViewModel
import com.app.billbox.ui.components.BillBoxBottomNav
import com.app.billbox.ui.components.BillBoxScaffold
import kotlinx.coroutines.launch

@Composable
fun BillBoxNavGraph(
    navController: NavHostController,
    viewModelFactory: BillBoxViewModelFactory,
) {
    NavHost(
        navController = navController,
        startDestination = NavRoutes.SPLASH,
    ) {
        composable(NavRoutes.SPLASH) {
            val viewModel: SplashViewModel = viewModel(factory = viewModelFactory)
            SplashScreen(
                viewModel = viewModel,
                onNavigateToOnboarding = {
                    navController.navigate(NavRoutes.ONBOARDING) {
                        popUpTo(NavRoutes.SPLASH) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.navigate(NavRoutes.LOGIN) {
                        popUpTo(NavRoutes.SPLASH) { inclusive = true }
                    }
                },
                onNavigateToMain = {
                    navController.navigate(NavRoutes.MAIN) {
                        popUpTo(NavRoutes.SPLASH) { inclusive = true }
                    }
                },
            )
        }

        composable(NavRoutes.ONBOARDING) {
            val scope = rememberCoroutineScope()
            val app = navController.context.applicationContext as BillBoxApplication
            OnboardingScreen(
                onComplete = {
                    scope.launch {
                        app.userPreferences.setOnboardingCompleted(true)
                        navController.navigate(NavRoutes.LOGIN) {
                            popUpTo(NavRoutes.ONBOARDING) { inclusive = true }
                        }
                    }
                },
            )
        }

        composable(NavRoutes.LOGIN) {
            val scope = rememberCoroutineScope()
            val app = navController.context.applicationContext as BillBoxApplication
            LoginScreen(
                onContinueWithMobile = { phoneNumber ->
                    navController.navigate(NavRoutes.otp(phoneNumber))
                },
                onContinueWithGoogle = {
                    scope.launch {
                        app.userPreferences.setLoggedIn(true)
                        navController.navigate(NavRoutes.MAIN) {
                            popUpTo(NavRoutes.LOGIN) { inclusive = true }
                        }
                    }
                },
            )
        }

        composable(
            route = NavRoutes.OTP,
            arguments = listOf(navArgument(NavRoutes.OTP_ARG) { type = NavType.StringType }),
        ) { backStackEntry ->
            val scope = rememberCoroutineScope()
            val app = navController.context.applicationContext as BillBoxApplication
            val phoneNumber = backStackEntry.arguments?.getString(NavRoutes.OTP_ARG).orEmpty()
            OtpVerificationScreen(
                phoneNumber = phoneNumber,
                onVerify = {
                    scope.launch {
                        app.userPreferences.setLoggedIn(true)
                        navController.navigate(NavRoutes.MAIN) {
                            popUpTo(NavRoutes.LOGIN) { inclusive = true }
                        }
                    }
                },
                onResendCode = { /* Mock resend — no backend yet */ },
            )
        }

        composable(NavRoutes.MAIN) {
            MainScreen(
                navController = navController,
                viewModelFactory = viewModelFactory,
            )
        }

        composable(
            route = NavRoutes.SCAN,
            arguments = listOf(
                navArgument(NavRoutes.SCAN_ARG) {
                    type = NavType.StringType
                    defaultValue = ""
                    nullable = true
                },
                navArgument(NavRoutes.SCAN_START_ARG) {
                    type = NavType.StringType
                    defaultValue = ""
                    nullable = true
                },
            ),
        ) { backStackEntry ->
            val imageUri = backStackEntry.arguments?.getString(NavRoutes.SCAN_ARG)?.takeIf { it.isNotBlank() }
            val startScreen = backStackEntry.arguments?.getString(NavRoutes.SCAN_START_ARG).orEmpty()
            ScanFlowNavHost(
                parentNavController = navController,
                viewModelFactory = viewModelFactory,
                initialImageUri = imageUri?.let { Uri.parse(it) },
                startScreen = startScreen,
            )
        }

        composable(
            route = NavRoutes.PRODUCT_DETAIL,
            arguments = listOf(navArgument(NavRoutes.PRODUCT_DETAIL_ARG) { type = NavType.LongType }),
        ) { backStackEntry ->
            val productId = backStackEntry.arguments?.getLong(NavRoutes.PRODUCT_DETAIL_ARG) ?: return@composable
            val viewModel = remember(productId) { viewModelFactory.productDetailViewModel(productId) }
            ProductDetailScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onDeleted = { navController.popBackStack() },
            )
        }
    }
}

@Composable
private fun MainScreen(
    navController: NavHostController,
    viewModelFactory: BillBoxViewModelFactory,
) {
    var currentTab by remember { mutableStateOf(MainTab.Home) }
    var showSourcePicker by remember { mutableStateOf(false) }

    BillBoxScaffold(
        bottomBar = {
            BillBoxBottomNav(
                currentTab = currentTab,
                onTabSelected = { currentTab = it },
                onScanClick = { showSourcePicker = true },
            )
        },
    ) {
        when (currentTab) {
            MainTab.Home -> {
                val viewModel: HomeViewModel = viewModel(factory = viewModelFactory)
                HomeDashboardScreen(
                    viewModel = viewModel,
                    onScanBill = { showSourcePicker = true },
                    onProductClick = { id -> navController.navigate(NavRoutes.productDetail(id)) },
                    onViewAllProducts = { currentTab = MainTab.Products },
                )
            }
            MainTab.Products -> {
                val viewModel: ProductsViewModel = viewModel(factory = viewModelFactory)
                MyProductsScreen(
                    viewModel = viewModel,
                    onProductClick = { id -> navController.navigate(NavRoutes.productDetail(id)) },
                )
            }
            MainTab.Reminders -> {
                val viewModel: RemindersViewModel = viewModel(factory = viewModelFactory)
                RemindersScreen(viewModel = viewModel)
            }
            MainTab.Profile -> {
                val viewModel: ProfileViewModel = viewModel(factory = viewModelFactory)
                ProfileSettingsScreen(viewModel = viewModel)
            }
        }
    }

    if (showSourcePicker) {
        SourcePickerSheet(
            onDismiss = { showSourcePicker = false },
            onCameraSelected = {
                showSourcePicker = false
                navController.navigate(NavRoutes.scan(startScreen = "camera"))
            },
            onGallerySelected = { uri ->
                showSourcePicker = false
                navController.navigate(NavRoutes.scan(uri.toString()))
            },
            onPdfSelected = { uri ->
                showSourcePicker = false
                navController.navigate(NavRoutes.scan(uri.toString()))
            },
        )
    }
}

@Composable
private fun ScanFlowNavHost(
    parentNavController: NavHostController,
    viewModelFactory: BillBoxViewModelFactory,
    initialImageUri: Uri?,
    startScreen: String = "",
) {
    val scanNavController = rememberNavController()
    val scanViewModel: ScanViewModel = viewModel(factory = viewModelFactory)
    val uiState by scanViewModel.uiState.collectAsStateWithLifecycle()
    var hasStartedProcessing by remember(initialImageUri) { mutableStateOf(false) }

    val startDestination = when {
        initialImageUri != null -> NavRoutes.SCAN_PROCESSING
        startScreen == "camera" -> NavRoutes.SCAN_CAMERA
        else -> NavRoutes.SCAN_SOURCE
    }

    if (initialImageUri != null && !hasStartedProcessing) {
        scanViewModel.processImage(initialImageUri)
        hasStartedProcessing = true
    }

    NavHost(
        navController = scanNavController,
        startDestination = startDestination,
    ) {
        composable(NavRoutes.SCAN_SOURCE) {
            SourcePickerSheet(
                onDismiss = { parentNavController.popBackStack() },
                onCameraSelected = { scanNavController.navigate(NavRoutes.SCAN_CAMERA) },
                onGallerySelected = { uri ->
                    scanViewModel.processImage(uri)
                    scanNavController.navigate(NavRoutes.SCAN_PROCESSING)
                },
                onPdfSelected = { uri ->
                    scanViewModel.processImage(uri)
                    scanNavController.navigate(NavRoutes.SCAN_PROCESSING)
                },
            )
        }

        composable(NavRoutes.SCAN_CAMERA) {
            CameraCaptureScreen(
                onImageCaptured = { uri ->
                    scanViewModel.processImage(uri)
                    scanNavController.navigate(NavRoutes.SCAN_PROCESSING)
                },
                onBack = { scanNavController.popBackStack() },
            )
        }

        composable(NavRoutes.SCAN_PROCESSING) {
            ScanProcessingScreen(
                viewModel = scanViewModel,
                onComplete = {
                    scanNavController.navigate(NavRoutes.SCAN_REVIEW) {
                        popUpTo(NavRoutes.SCAN_PROCESSING) { inclusive = true }
                    }
                },
                onBack = { parentNavController.popBackStack() },
            )
        }

        composable(NavRoutes.SCAN_REVIEW) {
            ReviewExtractedDataScreen(
                viewModel = scanViewModel,
                onContinue = { scanNavController.navigate(NavRoutes.SCAN_WARRANTY) },
                onBack = { parentNavController.popBackStack() },
            )
        }

        composable(NavRoutes.SCAN_WARRANTY) {
            AddWarrantyDetailsScreen(
                viewModel = scanViewModel,
                onContinue = { scanNavController.navigate(NavRoutes.SCAN_REMINDERS) },
                onBack = { scanNavController.popBackStack() },
            )
        }

        composable(NavRoutes.SCAN_REMINDERS) {
            SetRemindersScreen(
                viewModel = scanViewModel,
                onSave = {
                    scanViewModel.saveProduct {
                        scanNavController.navigate(NavRoutes.SCAN_SUCCESS) {
                            popUpTo(NavRoutes.SCAN_SOURCE) { inclusive = true }
                        }
                    }
                },
                onBack = { scanNavController.popBackStack() },
            )
        }

        composable(NavRoutes.SCAN_SUCCESS) {
            ProductSavedScreen(
                onViewProduct = {
                    uiState.savedProductId?.let { id ->
                        parentNavController.navigate(NavRoutes.productDetail(id)) {
                            popUpTo(NavRoutes.MAIN) { inclusive = false }
                        }
                    }
                },
                onDone = {
                    scanViewModel.reset()
                    parentNavController.popBackStack(NavRoutes.MAIN, false)
                },
            )
        }
    }
}
