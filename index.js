import 'dotenv/config'
import { Telegraf, session } from 'telegraf'
import { getPhoneKeyboard, getMainKeyboard, getAddressKeyboard } from './keyboards.js'
import { CMD } from './const.js'
import {
    getAddressMessage,
    getPhoneMessage,
    getPhonePleasureMessage,
    getSheduleMessage,
    getStartMessage,
} from './helpers.js'
import BonusComposer from './composers/bonus.composer.js'
import ContactComposer from './composers/contact.composer.js'
import db from './config/firebase.js'

const { BOT_TOKEN } = process.env
const bot = new Telegraf(BOT_TOKEN)

// Session Middleware
bot.use(session())
// Logger Middleware
bot.use(async (ctx, next) => {
    console.log(`@${ctx.from.username}: ${ctx.message ? ctx.message.text : ctx}`)
    // console.log(ctx) // uncomment for log ctx
    await next()
})
// Auth Middleware
bot.use(async (ctx, next) => {
    // Get phone_number
    if (ctx.message && ctx.message.contact) {
        await writeNewUser(ctx)
        await ctx.replyWithHTML(getPhonePleasureMessage(), {
            link_preview_options: {
                is_disabled: true,
            },
            ...getMainKeyboard(),
        })
    }
    if (!ctx.session) {
        ctx.session = {
            auth: false,
        }
    }
    if (!ctx.session.auth) {
        const isUserExist = await checkUserAuth(ctx)
        if (isUserExist) {
            ctx.session.auth = true
        } else {
            await ctx.replyWithHTML(getPhoneMessage(ctx.from.first_name), getPhoneKeyboard())
            return
        }
    }
    await next()
})
// Check User Auth
const checkUserAuth = async (ctx) => {
    const userId = String(ctx.from.id)
    const user = (await db.collection('barber-users').doc(userId).get()).data()
    return !!user
}
const writeNewUser = async (ctx) => {
    const userId = String(ctx.from.id)
    const { phone_number } = ctx.message.contact

    const newUser = await db
        .collection('barber-users')
        .doc(userId)
        .set({ phone_number, ...ctx.from })

    ctx.session.auth = true
    console.log(newUser, `new User ${ctx.from.username}, ${phone_number}`)
}

// 🎁 Предложения и бонусы
bot.use(BonusComposer)
// 👥 Контакты
bot.use(ContactComposer)
// start
bot.start(async (ctx) => {
    ctx.replyWithHTML(getStartMessage(ctx.from.first_name), {
        link_preview_options: {
            is_disabled: true,
        },
        ...getMainKeyboard(),
    })
})
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
    ctx.replyWithHTML(getSheduleMessage())
})

bot.launch()
console.log('bot start')

// Остановка бота
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
