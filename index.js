import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { getMainKeyboard, getFeedbackKeyboard, getstockskeyboard } from './keyboards.js'
import { CMD, FB_BUTTONS, LARGE_TEXT, STOCKS } from './const.js'
import { getStartMessage } from './helpers.js'

dotenv.config()
const { BOT_TOKEN } = process.env
const bot = new Telegraf(BOT_TOKEN)

// Сообщение от бота по команде Start
bot.start((ctx) => ctx.replyWithHTML(getStartMessage(ctx.from.first_name), getMainKeyboard()))

bot.hears(CMD.BONUS, (ctx) =>
    ctx.replyWithHTML(`Бонусы можно копить и оплачивать до 50% стоимости услуг в «Формуле»`, getstockskeyboard())
)

bot.hears(STOCKS.INVITE_FR, (ctx) => ctx.replyWithHTML(LARGE_TEXT.FRIENDS))

bot.hears(STOCKS.PAIR_HAIR, (ctx) => ctx.replyWithHTML(LARGE_TEXT.DOUBLE_HAIR))

bot.hears(STOCKS.BONUS_REVIEWS, (ctx) => ctx.replyWithHTML(LARGE_TEXT.GIFT_REVIEWS))

bot.hears(STOCKS.BONUS_REFERENCES, (ctx) => ctx.replyWithHTML(LARGE_TEXT.GIFT_REFERENCES))

// Ссылка на рабочий акк админа
bot.hears(CMD.ADMIN, (ctx) =>
    ctx.replyWithHTML(
        `По вопросам записи и работы барбершопа обращайтесь в аккаунт <a href="https://t.me/formula_barber">formula_barber</a>`
    )
)

// Адрес
bot.hears(CMD.ADDRESS, (ctx) =>
    ctx.replyWithHTML(`Мы располагаемся по адресу <a href="https://yandex.ru/maps/-/CDrTB2Ll">Чернышевского 52Б</a>`)
)

// Оставить отзыв - Возврат клавиатуры
bot.hears(CMD.FEEDBACK, (ctx) =>
    ctx.replyWithHTML('Оставьте отзыв о нас по одной из ссылок или анонимно по кнопке', getFeedbackKeyboard())
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
