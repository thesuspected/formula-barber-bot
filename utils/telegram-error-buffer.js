import dayjs from 'dayjs'
import { formatTelegramError, isRetryableNetworkError } from './telegram-retry.js'

const MAX_BUFFER_SIZE = 50
const buffer = []
let telegramWasDown = false
let onBuffered = null

export const setOnTelegramErrorBuffered = (callback) => {
    onBuffered = callback
}

export const wasTelegramDown = () => telegramWasDown

export const getBufferedErrorsCount = () => buffer.length

export const enqueueTelegramError = (title, error, context = {}) => {
    const entry = {
        title,
        error: formatTelegramError(error),
        context,
        at: dayjs().format('DD.MM.YYYY HH:mm:ss'),
    }

    buffer.push(entry)
    if (buffer.length > MAX_BUFFER_SIZE) {
        buffer.shift()
    }

    if (isRetryableNetworkError(error)) {
        telegramWasDown = true
    }

    console.warn(`[telegram] Ошибка в буфере (${buffer.length}): ${entry.title} — ${entry.error}`)
    onBuffered?.()
}

export const takeBufferedErrors = () => {
    const errors = [...buffer]
    buffer.length = 0
    return errors
}

export const markTelegramAvailable = () => {
    telegramWasDown = false
}

export const formatBufferedErrorsMessage = (errors, wasDown) => {
    const header = wasDown
        ? `✅ <b>Telegram API снова доступен</b>\n\n📋 Ошибки за время недоступности (${errors.length}):\n\n`
        : `📋 <b>Пропущенные ошибки (${errors.length})</b>\n\n`

    const lines = errors.map((entry, index) => {
        const contextText = Object.keys(entry.context).length
            ? `\n   ${JSON.stringify(entry.context)}`
            : ''
        return `${index + 1}. [${entry.at}] <b>${entry.title}</b>\n   ${entry.error}${contextText}`
    })

    return header + lines.join('\n\n')
}
