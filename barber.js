import 'dotenv/config'
import './config/dayjs.js'
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

const { BOT_TOKEN } = process.env
const bot = new Telegraf(BOT_TOKEN)

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
bot.hears(CMD.ADDRESS, (ctx) => {
    ctx.replyWithPhoto(
        { source: 'images/map.png' },
        {
            caption: getAddressMessage(),
            reply_markup: getAddressKeyboard().reply_markup,
            parse_mode: 'HTML',
        }
    )
})
// 📅 График работы
bot.hears(CMD.SCHEDULE, (ctx) => {
    ctx.replyWithPhoto(
        { source: 'images/friend.png' },
        {
            caption: getSheduleMessage(),
            reply_markup: getSheduleKeyboard().reply_markup,
            parse_mode: 'HTML',
        }
    )
})
// Обработка неизвестных запросов
bot.hears(/.+/, (ctx) =>
    ctx.replyWithHTML(getUnknownText(), {
        parse_mode: 'HTML',
        link_preview_options: {
            is_disabled: true,
        },
    })
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
        return true
    } catch (e) {
        console.error(
            `Ошибка отправки сообщения. chat_id: ${chatId}. ${formatTelegramError(e)}. Текст: ${text?.slice?.(0, 100) ?? text}`
        )
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
        return true
    } catch (e) {
        console.error(
            `Ошибка отправки фото. chat_id: ${chatId}. Путь: ${photoPath}. ${formatTelegramError(e)}`
        )
        return false
    }
}

// Try Catch
export async function tryCatchWrapper(fn) {
    try {
        await withTelegramRetry(async () => await fn, { label: 'handler' })
    } catch (e) {
        await sendDebugMessage('Ошибка: ', formatTelegramError(e))
        console.error(`Ошибка: ${formatTelegramError(e)}`)
    }
}

bot.catch(async (err, ctx) => {
    console.error(`Ошибка Telegraf [${ctx?.updateType ?? 'unknown'}]: ${formatTelegramError(err)}`)
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
        stopBotSafely()
        setTimeout(launchBot, 10000)
    }
}

launchBot()

// Остановка бота
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
