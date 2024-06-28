import 'dotenv/config'
import { Telegraf, session } from 'telegraf'
import { getPhoneKeyboard, getMainKeyboard, getAddressKeyboard, getSheduleKeyboard } from './keyboards.js'
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

const { BOT_TOKEN, ADMIN_CHAT_ID } = process.env
const bot = new Telegraf(BOT_TOKEN)

export async function sendBotMessage(chatId, text) {
    await bot.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        link_preview_options: {
            is_disabled: true,
        },
    })
}

// Session Middleware
bot.use(session())
// Logger Middleware
bot.use(async (ctx, next) => {
    const log = `<a href="https://t.me/${ctx.from.username}">${ctx.from.username}</a>: ${ctx.message ? ctx.message.text ?? '-' : ctx}`
    console.log(log, `(chat_id: ${ctx.chat.id})`)
    await sendBotMessage(ADMIN_CHAT_ID, log)
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
const getNewClientMessage = (ctx, phone_number) => {
    return `<b>✅ Новый клиент!</b>

<b>Аккаунт:</b> <a href="https://t.me/${ctx.from.username}">${ctx.from.username}</a>
<b>Номер:</b> ${phone_number}
<b>Имя Фамилия:</b> ${ctx.from.first_name ?? ''} ${ctx.from.last_name ?? ''}`
}
const writeNewUser = async (ctx) => {
    const userId = String(ctx.from.id)
    const { phone_number } = ctx.message.contact

    const res = await db
        .collection('barber-users')
        .doc(userId)
        .set({ phone_number, ...ctx.from })

    if (res) {
        ctx.session.auth = true
        const log = getNewClientMessage(ctx, phone_number)
        await sendBotMessage(ADMIN_CHAT_ID, log)
    }
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
    ctx.replyWithPhoto(
        { source: 'images/friend.png' },
        {
            caption: getSheduleMessage(),
            reply_markup: getSheduleKeyboard().reply_markup,
            parse_mode: 'HTML',
        }
    )
})

bot.launch()
console.log('bot start')

// Остановка бота
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
