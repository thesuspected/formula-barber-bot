import { Composer, Markup } from 'telegraf'
import { getUserById, getUserByPhone, getUserByUsername, getUserLink } from '../utils/helpers.js'
import { getBackKeyboard } from '../keyboards.js'

const composer = new Composer()
const ADMIN_ARRAY = ['zuspect', 'Smnv3798', 'Lissssa_27']
const ADMIN_ACTIONS = {
    ADD_BONUS: '➕ Начислить',
    REMOVE_BONUS: '➖ Списать',
    GO_BACK_CLIENT: 'Назад к клиенту',
}

const getUserInfoMessage = (user) => {
    return `<b>Аккаунт:</b> ${getUserLink(user)}
<b>id:</b> ${user.id}
<b>Номер:</b> ${user.phone.prefix}${user.phone.number}
<b>Имя:</b> ${user.first_name ?? ''} ${user.last_name ?? ''}
<b>Бонусы:</b> ${user.balance} ₽`
}

const getUserInfoKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback(ADMIN_ACTIONS.ADD_BONUS, ADMIN_ACTIONS.ADD_BONUS),
        Markup.button.callback(ADMIN_ACTIONS.REMOVE_BONUS, ADMIN_ACTIONS.REMOVE_BONUS),
    ]).resize()
}

composer.action(ADMIN_ACTIONS.ADD_BONUS, (ctx) =>
    ctx.editMessageText(`Введите кол-во к начислению ${getUserLink(ctx.session.admin_edited_user)}:`, {
        parse_mode: 'HTML',
        ...getBackKeyboard(ADMIN_ACTIONS.GO_BACK_CLIENT, ADMIN_ACTIONS.GO_BACK_CLIENT),
    })
)

composer.action(ADMIN_ACTIONS.REMOVE_BONUS, (ctx) =>
    ctx.editMessageText(`Введите кол-во к списанию ${getUserLink(ctx.session.admin_edited_user)}:`, {
        parse_mode: 'HTML',
        ...getBackKeyboard(ADMIN_ACTIONS.GO_BACK_CLIENT, ADMIN_ACTIONS.GO_BACK_CLIENT),
    })
)

composer.action(ADMIN_ACTIONS.GO_BACK_CLIENT, (ctx) =>
    ctx.editMessageText(getUserInfoMessage(ctx.session.admin_edited_user), {
        link_preview_options: {
            is_disabled: true,
        },
        parse_mode: 'HTML',
        ...getUserInfoKeyboard(),
    })
)

composer.command('user', async (ctx) => {
    // Проверяем на админа
    if (!ADMIN_ARRAY.includes(ctx.from.username)) {
        ctx.replyWithHTML('Эта команда вам недоступна.')
        return
    }
    // Если не ввел payload
    if (!ctx.payload) {
        ctx.replyWithHTML('Введите команду в формате: <code>/user nickname</code>')
        return
    }
    const user = await getUserByUsername(ctx.payload)
    ctx.session.admin_edited_user = user
    if (user) {
        ctx.replyWithHTML(getUserInfoMessage(user), {
            link_preview_options: {
                is_disabled: true,
            },
            ...getUserInfoKeyboard(),
        })
    } else {
        ctx.replyWithHTML(`Клиент с никнеймом "${ctx.payload}" не найден`)
    }
})

composer.command('id', async (ctx) => {
    // Проверяем на админа
    if (!ADMIN_ARRAY.includes(ctx.from.username)) {
        ctx.replyWithHTML('Эта команда вам недоступна.')
        return
    }
    // Если не ввел payload
    if (!ctx.payload) {
        ctx.replyWithHTML('Введите команду в формате: <code>/id 1234567890</code>')
        return
    }
    const user = await getUserById(ctx.payload)
    ctx.session.admin_edited_user = user
    if (user) {
        ctx.replyWithHTML(getUserInfoMessage(user), {
            link_preview_options: {
                is_disabled: true,
            },
            ...getUserInfoKeyboard(),
        })
    } else {
        ctx.replyWithHTML(`Клиент с id "${ctx.payload}" не найден`)
    }
})

composer.command('phone', async (ctx) => {
    // Проверяем на админа
    if (!ADMIN_ARRAY.includes(ctx.from.username)) {
        ctx.replyWithHTML('Эта команда вам недоступна.')
        return
    }
    // Если не ввел payload
    if (!ctx.payload) {
        ctx.replyWithHTML('Введите команду в формате: <code>/phone 9876543210 (10 цифр номера)</code>')
        return
    }
    const user = await getUserByPhone(ctx.payload)
    ctx.session.admin_edited_user = user
    if (user) {
        ctx.replyWithHTML(getUserInfoMessage(user), {
            link_preview_options: {
                is_disabled: true,
            },
            ...getUserInfoKeyboard(),
        })
    } else {
        ctx.replyWithHTML(`Клиент с номером телефона "${ctx.payload}" не найден`)
    }
})
export default composer
