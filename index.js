import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { getMainKeyboard, getFeedbackKeyboard } from './keyboards.js'
import { CMD, FB_BUTTONS } from './const.js'

dotenv.config()
const { BOT_TOKEN } = process.env
const bot = new Telegraf(BOT_TOKEN)

bot.start((ctx) =>
    ctx.replyWithHTML(
        `Привет, ${ctx.from.first_name}!

На связи Формула Барбершоп💈— твой проводник в мир стильных стрижек 💇‍♂️

В боте ты можешь записаться к любимому мастеру, копить бонусы, получать напоминания и еще много чего полезного по кнопкам внизу ⬇️

Мы очень рады новым гостям, приглашай друзей и получай скидку 🎁

Также подписывайся на наши соцсети, чтобы быть в курсе всех акций и событий: inst, tg`,
        getMainKeyboard()
    )
)

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
