import 'dotenv/config'
import { Telegraf } from 'telegraf'
import { getAddressKeyboard, getSheduleKeyboard } from './keyboards.js'
import { CMD } from './const.js'
import { getAddressMessage, getSheduleMessage } from './helpers.js'
import StartComposer from './composers/start.composer.js'
import BonusComposer from './composers/bonus.composer.js'
import ContactComposer from './composers/contact.composer.js'
import app from './config/express.js'

const { BOT_TOKEN } = process.env
const bot = new Telegraf(BOT_TOKEN)

// Авторизация, Получение контакта, Старт бота
bot.use(StartComposer)
// 🎁 Предложения и бонусы
bot.use(BonusComposer)
// 👥 Контакты
bot.use(ContactComposer)
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

export async function sendBotMessage(chatId, text) {
    await bot.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        link_preview_options: {
            is_disabled: true,
        },
    })
}

bot.launch()
console.log('🤖 bot start')

app.post('/hook', (req, res) => {
    console.log(req.body) // Call your action on the request here
    res.status(200).end() // Responding is important
})

// Остановка бота
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
