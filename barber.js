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
        await bot.telegram.sendMessage(chatId, text, {
            parse_mode: 'HTML',
            link_preview_options: {
                is_disabled: true,
            },
            ...extra,
        })
        return true
    } catch (e) {
        console.error(`Ошибка: ${e}. При отправке сообщения: ${text}. chat_id: ${chatId}`)
        return false
    }
}

// Try Catch
export async function tryCatchWrapper(fn) {
    try {
        await fn
    } catch (e) {
        await sendDebugMessage('Ошибка: ', e)
        console.error(`Ошибка: ${e}`)
    }
}

bot.launch()
console.log('🤖 Bot running')

// Остановка бота
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
