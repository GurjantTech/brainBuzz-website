package com.app.billbox.navigation

import android.net.Uri

object NavRoutes {
    const val SPLASH = "splash"
    const val ONBOARDING = "onboarding"
    const val LOGIN = "login"
    const val OTP = "otp/{phoneNumber}"
    const val OTP_ARG = "phoneNumber"
    const val MAIN = "main"
    const val SCAN = "scan?imageUri={imageUri}&startScreen={startScreen}"
    const val SCAN_ARG = "imageUri"
    const val SCAN_START_ARG = "startScreen"
    const val SCAN_SOURCE = "scan/source"
    const val SCAN_CAMERA = "scan/camera"
    const val SCAN_PROCESSING = "scan/processing"
    const val SCAN_REVIEW = "scan/review"
    const val SCAN_WARRANTY = "scan/warranty"
    const val SCAN_REMINDERS = "scan/reminders"
    const val SCAN_SUCCESS = "scan/success"
    const val PRODUCT_DETAIL = "product/{productId}"
    const val PRODUCT_DETAIL_ARG = "productId"

    fun productDetail(productId: Long) = "product/$productId"

    fun otp(phoneNumber: String) = "otp/${Uri.encode(phoneNumber)}"

    fun scan(imageUri: String? = null, startScreen: String = ""): String {
        val encodedUri = if (imageUri.isNullOrBlank()) "" else Uri.encode(imageUri)
        return "scan?imageUri=$encodedUri&startScreen=$startScreen"
    }
}

enum class MainTab {
    Home,
    Products,
    Reminders,
    Profile,
}
