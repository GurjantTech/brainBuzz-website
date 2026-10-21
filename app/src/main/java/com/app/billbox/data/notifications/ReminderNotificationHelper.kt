package com.app.billbox.data.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import java.util.concurrent.TimeUnit

object ReminderNotificationHelper {
    const val CHANNEL_ID = "billbox_reminders"
    const val WORK_TAG = "billbox_reminder"

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "BillBox Reminders",
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply {
                description = "Warranty, return, and service reminders"
            }
            val manager = context.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    fun scheduleReminder(
        context: Context,
        reminderId: Long,
        productName: String,
        reminderType: String,
        dueDate: Long,
    ) {
        val delay = dueDate - System.currentTimeMillis()
        if (delay <= 0) return

        val workRequest = OneTimeWorkRequestBuilder<ReminderWorker>()
            .setInitialDelay(delay, TimeUnit.MILLISECONDS)
            .setInputData(
                workDataOf(
                    "reminderId" to reminderId,
                    "productName" to productName,
                    "reminderType" to reminderType,
                ),
            )
            .addTag(WORK_TAG)
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "reminder_$reminderId",
            ExistingWorkPolicy.REPLACE,
            workRequest,
        )
    }

    fun showNotification(context: Context, productName: String, reminderType: String) {
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("BillBox Reminder")
            .setContentText("$reminderType reminder for $productName")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        NotificationManagerCompat.from(context).notify(
            productName.hashCode(),
            notification,
        )
    }
}

class ReminderWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val productName = inputData.getString("productName") ?: return Result.failure()
        val reminderType = inputData.getString("reminderType") ?: return Result.failure()

        ReminderNotificationHelper.showNotification(
            applicationContext,
            productName,
            reminderType,
        )
        return Result.success()
    }
}
