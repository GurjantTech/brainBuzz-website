package com.app.billbox.data.local

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

object ReceiptImageStore {
    suspend fun persist(context: Context, source: Uri): String = withContext(Dispatchers.IO) {
        val receiptsDirectory = File(context.filesDir, "receipts").apply { mkdirs() }
        val extension = context.contentResolver.getType(source)
            ?.substringAfterLast('/')
            ?.takeIf { it.matches(Regex("""[a-zA-Z0-9]+""")) }
            ?: source.lastPathSegment
                ?.substringAfterLast('.', "")
                ?.takeIf { it.matches(Regex("""[a-zA-Z0-9]+""")) }
            ?: "jpg"
        val destination = File(receiptsDirectory, "receipt_${System.currentTimeMillis()}.$extension")

        context.contentResolver.openInputStream(source).use { input ->
            requireNotNull(input) { "Unable to read selected bill image" }
            destination.outputStream().use(input::copyTo)
        }
        Uri.fromFile(destination).toString()
    }

    fun delete(uriString: String?) {
        if (uriString.isNullOrBlank()) return
        runCatching {
            val uri = Uri.parse(uriString)
            if (uri.scheme == "file") File(requireNotNull(uri.path)).delete()
        }
    }
}
