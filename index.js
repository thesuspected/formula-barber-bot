import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { getMainKeyboard, getFeedbackKeyboard } from './keyboards.js'
import { CMD, FB_BUTTONS } from './const.js'

dotenv.config()
const { BOT_TOKEN } = process.env
const bot = new Telegraf(BOT_TOKEN)

bot.start((ctx) => ctx.replyWithHTML('Добро пожаловать!', getMainKeyboard()))

bot.hears(CMD.FEEDBACK, (ctx) =>
    ctx.replyWithHTML('Оставьте отзыв о нас по одной из ссылок или анонимно по кнопке', getFeedbackKeyboard())
)

bot.action(FB_BUTTONS.ANONIM, (ctx) =>
    ctx.replyWithHTML(
        'Напишите ответом на это сообщение ваше обращение, оно будет отправлено анонимно, мы учтем все ваши пожелания и замечания'
    )
)

bot.launch()
console.log('бот запущен')

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
