import { Composer, session } from 'telegraf'
import { getPhoneMessage, getPhonePleasureMessage, getStartMessage } from '../helpers.js'
import { getMainKeyboard, getPhoneKeyboard } from '../keyboards.js'
import { db } from '../config/firebase.js'
import { sendBotMessage } from '../barber.js'
import { getUserByUsername } from '../utils/helpers.js'

const composer = new Composer()
const { ADMIN_CHAT_ID } = process.env

// Session Middleware
composer.use(session())
// Logger Middleware
composer.use(async (ctx, next) => {
    let text = 'Неизвестная команда'
    if (ctx.message?.text) {
        text = ctx.message.text
    }
    if (ctx.message?.contact) {
        text = `📢 Поделиться контактом ${ctx.message.contact.phone_number}`
    }
    if (ctx.update?.callback_query) {
        text = ctx.update.callback_query.data
    }
    const log = `<a href="https://t.me/${ctx.from.username}">${ctx.from.username}</a>: ${text}`
    console.log(log, `(chat_id: ${ctx.chat.id})`)
    await sendBotMessage(ADMIN_CHAT_ID, log)
    // console.log(ctx) // uncomment for log ctx
    await next()
})
// Auth Middleware
composer.use(async (ctx, next) => {
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
            invited_from: undefined,
            last_balance: undefined,
            last_invited: undefined,
        }
    }
    if (!ctx.session.auth) {
        const isUserExist = await checkUserAuth(ctx)
        if (isUserExist) {
            ctx.session.auth = true
        } else {
            ctx.session.invited_from = checkInvitedFromAccount(ctx)
            await ctx.replyWithHTML(getPhoneMessage(ctx.from.first_name, ctx.session.invited_from), getPhoneKeyboard())
            return
        }
    }
    await next()
})
// Check invited from account
const checkInvitedFromAccount = (ctx) => {
    const message = ctx.message.text.split(' ')
    const command = message[0]
    const username = message[1]
    // Если /start username
    if (command === '/start' && username) {
        console.log(`Пользователь ${ctx.from.username} приглашен в бота от ${username}`)
        return username
    }
    return undefined
}
// Check User Auth
const checkUserAuth = async (ctx) => {
    const userId = String(ctx.from.id)
    const user = (await db.collection('barber-users').doc(userId).get()).data()
    return !!user
}
const getNewReferalUserMessage = (ctx) => {
    return `По твоей реферальной ссылке зарегистрировался @${ctx.from.username}!
Баллы начислятся после посещения барбершопа приглашенным 💸`
}
const getNewClientMessage = (ctx, phone_number) => {
    let invited_text = ''
    if (ctx.session.invited_from) {
        invited_text = `
<b>Приглашен:</b> <a href="https://t.me/${ctx.session.invited_from}">${ctx.session.invited_from}</a>`
    }
    return `<b>✅ Новый клиент!</b>

<b>Аккаунт:</b> <a href="https://t.me/${ctx.from.username}">${ctx.from.username}</a>
<b>Номер:</b> ${phone_number}
<b>Имя:</b> ${ctx.from.first_name ?? ''} ${ctx.from.last_name ?? ''}${invited_text}`
}
const pushUserToInvitedArray = async (user, ref_id, ref_username) => {
    // Добавляем в массив приглашенных
    let invited = user.invited
    const findUser = invited.find((invited_user) => invited_user.user_id === ref_id)
    if (findUser) {
        console.log(`Пользователь ${ref_username} уже в списке приглашенных у ${user.username}`)
    } else {
        invited.push({
            user_id: ref_id,
            username: ref_username,
            used_services: false,
        })
    }
    await db.collection('barber-users').doc(String(user.id)).update({ invited })
}

const writeNewUser = async (ctx) => {
    const userId = String(ctx.from.id)
    const { phone_number } = ctx.message.contact
    const number = phone_number.slice(phone_number.length - 10)
    const prefix = phone_number.substring(0, phone_number.length - 10)

    const userRef = db.collection('barber-users').doc(userId)
    const res = await userRef.set({
        phone: {
            number,
            prefix,
        },
        ...ctx.from,
        invited: [], // Список приглашенных
        invited_from: ctx.session.invited_from ?? null,
        balance: ctx.session.invited_from ? 200 : 0,
        used_services: false, // Оплачивал ли услуги в барбершопе
    })

    // Если приглашен кем-то, добавляем инфу об этом
    if (ctx.session.invited_from) {
        const user = await getUserByUsername(ctx.session.invited_from)
        if (user) {
            await pushUserToInvitedArray(user, userId, ctx.from.username)
            await sendBotMessage(user.id, getNewReferalUserMessage(ctx))
        }
    }

    if (res) {
        ctx.session.auth = true
        const log = getNewClientMessage(ctx, phone_number)
        console.log(log)
        await sendBotMessage(ADMIN_CHAT_ID, log)
    }
}

// start
composer.start(async (ctx) => {
    if (ctx.payload) {
        // TODO: Добавить проверку на привязку к аккаунту пригласившему этот
        console.log(`${ctx.from.username} перешел по приглашению от ${ctx.payload}`)
    }
    ctx.replyWithHTML(getStartMessage(ctx.from.first_name), {
        link_preview_options: {
            is_disabled: true,
        },
        ...getMainKeyboard(),
    })
})

export default composer
