import 'dotenv/config'
import './config/dayjs.js'
import https from 'https'
import { Telegraf } from 'telegraf'
import { getAddressKeyboard, getSheduleKeyboard } from './keyboards.js'
import { CMD } from './const.js'
import { getAddressMessage, getSheduleMessage, getUnknownText } from './helpers.js'
import StartComposer from './composers/start.composer.js'
import BonusComposer from './composers/bonus.composer.js'
import BalanceComposer from './composers/balance.composer.js'
import ContactComposer from './composers/contact.composer.js'
import AdminComposer from './composers/admin.composer.js'
import ReviewComposer from './composers/review.composer.js'
import './utils/cron-ping.js'
import './utils/yclients-hook.js'
import { sendDebugMessage } from './utils/helpers.js'
import { formatTelegramError, withTelegramRetry } from './utils/telegram-retry.js'
import {
    enqueueTelegramError,
    formatBufferedErrorsMessage,
    getBufferedErrorsCount,
    markTelegramAvailable,
    setOnTelegramErrorBuffered,
    takeBufferedErrors,
    wasTelegramDown,
} from './utils/telegram-error-buffer.js'

const { BOT_TOKEN, DEBUG_CHAT_ID } = process.env

// Таймаут неактивного сокета к api.telegram.org (мс). 4 retry × 20с + паузы ≈ 92с, укладывается в handlerTimeout.
const TELEGRAM_SOCKET_TIMEOUT_MS = 20_000
const TELEGRAM_HANDLER_TIMEOUT_MS = 120_000
const HEALTH_CHECK_INTERVAL_MS = 120 * 1000

const bot = new Telegraf(BOT_TOKEN, {
    handlerTimeout: TELEGRAM_HANDLER_TIMEOUT_MS,
    telegram: {
        agent: new https.Agent({
            keepAlive: true,
            keepAliveMsecs: 10_000,
            timeout: TELEGRAM_SOCKET_TIMEOUT_MS,
        }),
    },
})
let isFlushingErrors = false
let healthCheckInterval = null

const stopHealthCheck = () => {
    if (!healthCheckInterval) {
        return
    }
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
    console.log('[telegram] Проверка доступности API остановлена')
}

const runHealthCheck = async () => {
    try {
        await withTelegramRetry(() => bot.telegram.getMe(), { label: 'healthCheck', retries: 2, delayMs: 3000 })
        await tryFlushBufferedErrors()
        if (!getBufferedErrorsCount()) {
            stopHealthCheck()
        }
    } catch (e) {
        console.warn(`[telegram] Health check failed: ${formatTelegramError(e)}`)
    }
}

const startHealthCheck = () => {
    if (healthCheckInterval) {
        return
    }
    console.log('[telegram] Запущена проверка доступности API (каждые 2 мин)')
    runHealthCheck()
    healthCheckInterval = setInterval(runHealthCheck, HEALTH_CHECK_INTERVAL_MS)
}

setOnTelegramErrorBuffered(startHealthCheck)

const tryFlushBufferedErrors = async () => {
    if (isFlushingErrors || !DEBUG_CHAT_ID || !getBufferedErrorsCount()) {
        return
    }

    isFlushingErrors = true
    const wasDown = wasTelegramDown()
    const errors = takeBufferedErrors()

    try {
        await withTelegramRetry(
            () =>
                bot.telegram.sendMessage(DEBUG_CHAT_ID, formatBufferedErrorsMessage(errors, wasDown), {
                    parse_mode: 'HTML',
                }),
            { label: 'flushErrors' }
        )
        markTelegramAvailable()
        stopHealthCheck()
        console.log(`[telegram] Отправлен буфер ошибок (${errors.length})`)
    } catch (e) {
        errors.forEach((entry) => enqueueTelegramError(entry.title, { message: entry.error }, entry.context))
        console.error(`[telegram] Не удалось отправить буфер ошибок: ${formatTelegramError(e)}`)
    } finally {
        isFlushingErrors = false
    }
}

const notifyTelegramError = async (title, error, context = {}) => {
    if (!DEBUG_CHAT_ID) {
        return
    }

    const sent = await sendDebugMessage(title, {
        error: formatTelegramError(error),
        ...context,
    })

    if (!sent) {
        enqueueTelegramError(title, error, context)
    }
}

// Авторизация, Получение контакта, Старт бота
bot.use(StartComposer)
// 🎁 Предложения
bot.use(BonusComposer)
// 💸 Бонусный баланс
bot.use(BalanceComposer)
// 👥 Контакты
bot.use(ContactComposer)
// Админка
bot.use(AdminComposer)
// Отзыв
bot.use(ReviewComposer)
// 📍 Наш адрес
bot.hears(CMD.ADDRESS, (ctx) =>
    tryCatchWrapper(
        ctx.replyWithPhoto(
            { source: 'images/map.png' },
            {
                caption: getAddressMessage(),
                reply_markup: getAddressKeyboard().reply_markup,
                parse_mode: 'HTML',
            }
        )
    )
)
// 📅 График работы
bot.hears(CMD.SCHEDULE, (ctx) =>
    tryCatchWrapper(
        ctx.replyWithPhoto(
            { source: 'images/friend.png' },
            {
                caption: getSheduleMessage(),
                reply_markup: getSheduleKeyboard().reply_markup,
                parse_mode: 'HTML',
            }
        )
    )
)
// Обработка неизвестных запросов
bot.hears(/.+/, (ctx) =>
    tryCatchWrapper(
        ctx.replyWithHTML(getUnknownText(), {
            parse_mode: 'HTML',
            link_preview_options: {
                is_disabled: true,
            },
        })
    )
)

// Send message
export async function sendBotMessage(chatId, text, extra) {
    try {
        await withTelegramRetry(
            () =>
                bot.telegram.sendMessage(chatId, text, {
                    parse_mode: 'HTML',
                    link_preview_options: {
                        is_disabled: true,
                    },
                    ...extra,
                }),
            { label: `sendMessage:${chatId}` }
        )
        await tryFlushBufferedErrors()
        return true
    } catch (e) {
        console.error(
            `Ошибка отправки сообщения. chat_id: ${chatId}. ${formatTelegramError(e)}. Текст: ${text?.slice?.(0, 100) ?? text}`
        )
        if (String(chatId) !== String(DEBUG_CHAT_ID)) {
            await notifyTelegramError('⚠️ Ошибка отправки сообщения', e, {
                chatId,
                text: text?.slice?.(0, 200) ?? text,
            })
        }
        return false
    }
}

// Send photo with caption
export async function sendBotPhoto(chatId, photoPath, caption, extra) {
    try {
        const sourcePath = photoPath.replace(/^\//, '')
        await withTelegramRetry(
            () =>
                bot.telegram.sendPhoto(
                    chatId,
                    { source: sourcePath },
                    {
                        caption,
                        parse_mode: 'HTML',
                        ...extra,
                    }
                ),
            { label: `sendPhoto:${chatId}` }
        )
        await tryFlushBufferedErrors()
        return true
    } catch (e) {
        console.error(
            `Ошибка отправки фото. chat_id: ${chatId}. Путь: ${photoPath}. ${formatTelegramError(e)}`
        )
        if (String(chatId) !== String(DEBUG_CHAT_ID)) {
            await notifyTelegramError('⚠️ Ошибка отправки фото', e, { chatId, photoPath })
        }
        return false
    }
}

// Try Catch
export async function tryCatchWrapper(fn) {
    try {
        await withTelegramRetry(async () => await fn, { label: 'handler' })
    } catch (e) {
        await notifyTelegramError('⚠️ Ошибка обработчика', e)
        console.error(`Ошибка: ${formatTelegramError(e)}`)
    }
}

bot.catch(async (err, ctx) => {
    console.error(`Ошибка Telegraf [${ctx?.updateType ?? 'unknown'}]: ${formatTelegramError(err)}`)
    await notifyTelegramError('⚠️ Ошибка Telegraf', err, { updateType: ctx?.updateType ?? 'unknown' })
})

const stopBotSafely = () => {
    try {
        bot.stop('RELAUNCH')
    } catch {
        // бот уже остановлен
    }
}

const launchBot = async () => {
    try {
        await withTelegramRetry(() => bot.launch(), {
            retries: 10,
            delayMs: 5000,
            label: 'bot.launch',
        })
        console.log('🤖 Bot running')
    } catch (e) {
        console.error(`Бот остановился: ${formatTelegramError(e)}. Перезапуск через 10с`)
        await notifyTelegramError('⚠️ Бот остановился, перезапуск через 10с', e)
        stopBotSafely()
        setTimeout(launchBot, 10000)
    }
}

launchBot()

// Остановка бота
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
