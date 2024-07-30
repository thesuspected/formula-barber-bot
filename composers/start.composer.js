import { Composer, session } from 'telegraf'
import { getPhoneMessage, getPhonePleasureMessage, getStartMessage } from '../helpers.js'
import { getMainKeyboard, getPhoneKeyboard } from '../keyboards.js'
import { db } from '../config/firebase.js'
import { sendBotMessage } from '../barber.js'
import { getUserById, getUserLink } from '../utils/helpers.js'
import axios from 'axios'

const composer = new Composer()
const { ADMIN_CHAT_ID, YCLIENTS_AUTH } = process.env

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
    const log = `<a href="tg://user?id=${ctx.from.id}">${ctx.from.username ?? ctx.from.first_name}</a>: ${text}`
    console.log(log, `(chat_id: ${ctx.chat.id})`)
    await sendBotMessage(ADMIN_CHAT_ID, log)
    // console.log(ctx) // uncomment for log ctx
    await next()
})
// Auth Middleware
composer.use(async (ctx, next) => {
    if (!ctx.session) {
        ctx.session = {
            auth: false,
            invited_from: undefined,
            invite_rewarded: undefined,
            last_balance: undefined,
            last_invited: undefined,
            admin_edited_user: undefined,
        }
    }
    // Get phone_number
    if (ctx.message && ctx.message.contact) {
        await writeNewUser(ctx)
        await ctx.replyWithHTML(getPhonePleasureMessage(ctx), {
            link_preview_options: {
                is_disabled: true,
            },
            ...getMainKeyboard(),
        })
    }
    if (!ctx.session.auth) {
        const isUserExist = await checkUserAuth(ctx)
        if (isUserExist) {
            ctx.session.auth = true
        } else {
            ctx.session.invited_from = await checkInvitedFromAccount(ctx)
            await ctx.replyWithHTML(getPhoneMessage(ctx.from.first_name, ctx.session.invited_from), {
                link_preview_options: {
                    is_disabled: true,
                },
                ...getPhoneKeyboard(),
            })
            return
        }
    }
    await next()
})
// Check invited from account
const checkInvitedFromAccount = async (ctx) => {
    const message = ctx.message.text.split(' ')
    const command = message[0]
    const id = message[1]
    // Если /start username
    if (command === '/start' && id) {
        const user = await getUserById(id)
        console.log(`Пользователь ${ctx.from.username} приглашен в бота от ${user.username ?? user.first_name}`)
        return user
    }
    return undefined
}
// Check User Auth
const checkUserAuth = async (ctx) => {
    const userId = String(ctx.from.id)
    const userRef = db.collection('barber-users').doc(userId)
    const userData = (await userRef.get()).data()
    if (userData) {
        // Обновляем поля юзера тг
        await userRef.update({ ...ctx.from })
    }
    return !!userData
}
const getNewReferralUserMessage = (ctx) => {
    return `По твоей реферальной ссылке зарегистрировался ${getUserLink(ctx.from)}!
Баллы начислятся после посещения барбершопа приглашенным 💸`
}
const getReferralFromYclientsMessage = (ctx) => {
    return `По твоей реферальной ссылке зарегистрировался ${getUserLink(ctx.from)}!
К сожалению, он уже пользовался услугами барбершопа, 
бонусы за его приглашение не будут начислены :с`
}
const getNewClientMessage = (ctx, phone_number, isRegisteredYclients) => {
    let invited_text = ''
    if (ctx.session.invited_from) {
        invited_text = `
<b>Приглашен:</b> ${getUserLink(ctx.session.invited_from)}`
    }
    let registered_text = ''
    if (isRegisteredYclients) {
        registered_text = `
<b>🟡 Есть в базе YCLIENTS 🟡</b>`
    }
    return `<b>✅ Новый клиент!</b>

<b>Аккаунт:</b> ${getUserLink(ctx.from)}
<b>Номер:</b> ${phone_number}
<b>Имя:</b> ${ctx.from.first_name ?? ''} ${ctx.from.last_name ?? ''}${invited_text}${registered_text}`
}
const pushUserToInvitedArray = async (user, invited_user) => {
    // Добавляем в массив приглашенных
    let invited = user.invited
    const findUser = invited.find((invited_user) => invited_user.id === String(invited_user.id))
    if (findUser) {
        console.log(
            `Пользователь ${invited_user.username ?? invited_user.first_name} уже в списке приглашенных у ${user.username}`
        )
    } else {
        invited.push({
            id: String(invited_user.id),
            username: invited_user.username,
            first_name: invited_user.first_name,
            used_services: false,
        })
    }
    await db.collection('barber-users').doc(String(user.id)).update({ invited })
}

const isRegisteredInYclients = async (phone) => {
    const res = await axios.post(
        'https://api.yclients.com/api/v1/company/1057728/clients/search',
        {
            fields: ['id', 'phone', 'name'],
            filters: [
                {
                    type: 'quick_search',
                    state: {
                        value: phone,
                    },
                },
            ],
        },
        {
            headers: {
                Accept: 'application/vnd.api.v2+json',
                Authorization: YCLIENTS_AUTH,
            },
        }
    )
    console.log(res.data)
    if (res.data.data.length) {
        console.log(`Клиент с номером ${phone} уже зарегистрирован в базе YClients`)
        return true
    } else {
        console.log(`Клиент с номером ${phone} не найден в базе YClients`)
        return false
    }
}

const writeNewUser = async (ctx) => {
    const userId = String(ctx.from.id)
    const { phone_number } = ctx.message.contact
    const number = phone_number.slice(phone_number.length - 10)
    const prefix = phone_number.substring(0, phone_number.length - 10)

    // Ищем юзера yclients
    const isRegisteredYclients = await isRegisteredInYclients(number)
    ctx.session.invite_rewarded = ctx.session.invited_from && !isRegisteredYclients

    const userRef = db.collection('barber-users').doc(userId)
    const res = await userRef.set({
        phone: {
            number,
            prefix,
        },
        ...ctx.from,
        invited: [], // Список приглашенных
        invited_from: ctx.session.invited_from ? ctx.session.invited_from.id : null,
        balance: ctx.session.invite_rewarded ? 200 : 0,
        used_services: isRegisteredYclients, // Оплачивал ли услуги в барбершопе
    })

    // Если приглашен кем-то, добавляем инфу об этом
    if (ctx.session.invited_from) {
        const user = ctx.session.invited_from
        // Если уже есть в базе yclients, оповещаем
        if (isRegisteredYclients) {
            await sendBotMessage(user.id, getReferralFromYclientsMessage(ctx))
        } else {
            await pushUserToInvitedArray(user, ctx.from)
            await sendBotMessage(user.id, getNewReferralUserMessage(ctx))
        }
    }

    if (res) {
        ctx.session.auth = true
        const log = getNewClientMessage(ctx, phone_number, isRegisteredYclients)
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
