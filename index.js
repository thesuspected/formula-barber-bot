import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { getContactKeyboard, getMainKeyboard } from './keyboards.js'
import { CMD, FB_BUTTONS } from './const.js'
import { getAdminMessage, getContactMessage, getContactPleasureMessage } from './helpers.js'
import BonusComposer from './composers/bonus.composer.js'

dotenv.config()
const { BOT_TOKEN } = process.env
const bot = new Telegraf(BOT_TOKEN)

// Middleware
bot.use(async (ctx, next) => {
    console.log(ctx)
    await next()
})

// 🎁 Акции и бонусы
bot.use(BonusComposer)
// start
bot.start((ctx) => {
    if (true) {
        ctx.replyWithHTML(getContactMessage(ctx.from.first_name), getContactKeyboard())
    }
})
bot.on('contact', (ctx) => {
    const contact = ctx.message.contact.phone_number
    console.log('Hello Contact', contact)
    ctx.replyWithHTML(getContactPleasureMessage(), {
        link_preview_options: {
            is_disabled: true,
        },
        ...getMainKeyboard(),
    })
})
// 📍 Наш адрес
bot.hears(CMD.ADDRESS, (ctx) => {
    ctx.replyWithHTML(`Мы располагаемся по адресу <a href="https://yandex.ru/maps/-/CDrTB2Ll">Чернышевского 52Б</a>`)
})
// 👩🏼‍💼 Администратор
bot.hears(CMD.ADMIN, (ctx) => ctx.replyWithHTML(getAdminMessage()))

// Оставить отзыв - Нажатие кнопки "Анонимно"
bot.action(FB_BUTTONS.ANONIM, (ctx) =>
    ctx.replyWithHTML(
        'Напишите ответом на это сообщение ваше обращение, оно будет отправлено анонимно, мы учтем все ваши пожелания и замечания'
    )
)

bot.launch()
console.log('бот запущен')

// Остановка бота
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
