import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { getContactKeyboard, getMainKeyboard } from './keyboards.js'
import { CMD, FB_BUTTONS } from './const.js'
import { getStartMessage } from './helpers.js'
import BonusComposer from './composers/bonus.composer.js'

dotenv.config()
const { BOT_TOKEN } = process.env
const bot = new Telegraf(BOT_TOKEN)

// 🎁 Акции и бонусы
bot.use(BonusComposer)
//ctx.replyWithHTML(getStartMessage(ctx.from.first_name), getMainKeyboard())
// start
bot.start((ctx) => {
    ctx.replyWithHTML(getStartMessage(ctx.from.first_name), getMainKeyboard())
    if (true) {
        ctx.replyWithHTML('Для участия в бонусной системе поделись с нами контактом', getContactKeyboard())
    }
})
bot.on('contact', (ctx) => {
    const contact = ctx.message.contact.phone_number
    console.log('Hello Contact', contact)
    ctx.replyWithHTML(getStartMessage(ctx.from.first_name), getMainKeyboard())
})
// 📍 Наш адрес
bot.hears(CMD.ADDRESS, (ctx) => {
    ctx.replyWithHTML(`Мы располагаемся по адресу <a href="https://yandex.ru/maps/-/CDrTB2Ll">Чернышевского 52Б</a>`)
    if (true) {
    }
})
// 👩🏼‍💼 Администратор
bot.hears(CMD.ADMIN, (ctx) =>
    ctx.replyWithHTML(
        `По вопросам записи и работы барбершопа обращайтесь в аккаунт <a href="https://t.me/formula_barber">formula_barber</a>`
    )
)

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
