import { Composer, Markup, Scenes } from 'telegraf'
import { getUserById, getUserByPhone, getUserByUsername, getUserLink } from '../utils/helpers.js'
import { BONUS_REVIEW } from './bonus.const.js'
import { db } from '../config/firebase.js'
import { sendBotMessage } from '../barber.js'

const { ADMIN_CHAT_ID } = process.env

const composer = new Composer()
const ADMIN_ARRAY = ['zuspect', 'Smnv3798', 'Lissssa_27', 'formula_barber']
const ADMIN_ACTIONS = {
    ADD_BONUS: '➕ Начислить',
    REMOVE_BONUS: '➖ Списать',
    GO_BACK_CLIENT: 'Назад к клиенту',
}
const ADMIN_WIZARD = {
    ADD_BONUS: 'ADD_BONUS',
    REMOVE_BONUS: 'REMOVE_BONUS',
}
const BONUS_REASON = {
    REVIEW: '💬 Отзыв',
    MARK: '📌 Отметка',
    OTHER: '📢 Другое',
}
const MARK_REASON = {
    VK: 'Вконтакте',
    INST: 'Инстаграм',
    TG: 'Телеграм',
}

const getUserInfoMessage = (user) => {
    let bonus_text = ''
    if (user.bonusState) {
        const { MARK, REVIEW } = user.bonusState
        bonus_text += '\n\n<b>Отзывы:</b>'
        for (const key in REVIEW) {
            bonus_text += `\n${BONUS_REVIEW[key]}: ${REVIEW[key] ? '✅' : '❌'}`
        }
        bonus_text += '\n\n<b>Отметки:</b>'
        for (const key in MARK) {
            bonus_text += `\n${MARK_REASON[key]}: ${MARK[key] ? '✅' : '❌'}`
        }
    }
    return `<b>Аккаунт:</b> ${getUserLink(user)}
<b>id:</b> ${user.id}
<b>Номер:</b> ${user.phone.prefix}${user.phone.number}
<b>Имя:</b> ${user.first_name ?? ''} ${user.last_name ?? ''}
<b>Баланс:</b> ${user.balance} ₽${bonus_text}`
}

const getUserInfoKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback(ADMIN_ACTIONS.ADD_BONUS, ADMIN_ACTIONS.ADD_BONUS),
        Markup.button.callback(ADMIN_ACTIONS.REMOVE_BONUS, ADMIN_ACTIONS.REMOVE_BONUS),
    ]).resize()
}

const getBonusReasonKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback(BONUS_REASON.REVIEW, BONUS_REASON.REVIEW),
        Markup.button.callback(BONUS_REASON.MARK, BONUS_REASON.MARK),
        Markup.button.callback(BONUS_REASON.OTHER, BONUS_REASON.OTHER),
    ]).resize()
}

const getReviewReasonKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback(BONUS_REVIEW.YANDEX, BONUS_REVIEW.YANDEX),
        Markup.button.callback(BONUS_REVIEW.GIS, BONUS_REVIEW.GIS),
        Markup.button.callback(BONUS_REVIEW.YCLIENTS, BONUS_REVIEW.YCLIENTS),
    ]).resize()
}

const getMarkReasonKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback(MARK_REASON.VK, MARK_REASON.VK),
        Markup.button.callback(MARK_REASON.INST, MARK_REASON.INST),
        Markup.button.callback(MARK_REASON.TG, MARK_REASON.TG),
    ]).resize()
}

const getObjectKey = (obj, value) => {
    return Object.keys(obj).find((key) => obj[key] === value)
}

const addBonusToClient = async (user, payload, reason_text) => {
    const { count, main_reason, main_reason_key, sub_reason_key } = payload
    let bonusState = user.bonusState ?? {
        REVIEW: {
            YANDEX: false,
            GIS: false,
            YCLIENTS: false,
        },
        MARK: {
            INST: false,
            VK: false,
            TG: false,
        },
    }
    console.log(main_reason_key, sub_reason_key)
    if (main_reason !== BONUS_REASON.OTHER) {
        bonusState[main_reason_key][sub_reason_key] = true
    }
    const userRef = db.collection('barber-users').doc(String(user.id))
    await userRef.update({ balance: user.balance + count, bonusState })
    // Оповещаем клиента
    const message_text = `Вам начислено ${count} бонусов за ${reason_text}`
    await sendBotMessage(user.id, message_text)
}

const removeBonusFromClient = async (user, count) => {
    const userRef = db.collection('barber-users').doc(String(user.id))
    // Если бонусов меньше, чем запросили
    if (user.balance < count) {
        return
    }
    await userRef.update({ balance: user.balance - count })
    // Оповещаем клиента
    const message_text = `С вашего баланса списано ${count} бонусов в счет услуг барбершопа 💸`
    await sendBotMessage(user.id, message_text)
    return true
}

const addBonusWizardScene = new Scenes.WizardScene(
    ADMIN_WIZARD.ADD_BONUS,
    // Начало сцены
    async (ctx) => {
        ctx.wizard.state.bonus = {}
        await ctx.replyWithHTML(`Введите кол-во к начислению ${getUserLink(ctx.session.admin_edited_user)}:`, {
            link_preview_options: {
                is_disabled: true,
            },
        })
        return ctx.wizard.next()
    },
    // Получаем число бонусов
    async (ctx) => {
        const count = Number(ctx.message.text)
        // validation
        if (!count || count < 1) {
            await ctx.replyWithHTML('Введите валидное число!')
            return
        }
        ctx.wizard.state.bonus.count = count
        await ctx.replyWithHTML('Выберите причину начисления', getBonusReasonKeyboard())
        return ctx.wizard.next()
    },
    // Обрабатываем коллбэк причины начисления
    async (ctx) => {
        if (!ctx.update?.callback_query) {
            await ctx.replyWithHTML('Нажмите на кнопку выбора причины начисления')
            return
        }
        await ctx.answerCbQuery()
        const main_reason = ctx.update.callback_query.data
        ctx.wizard.state.bonus.main_reason = main_reason
        ctx.wizard.state.bonus.main_reason_key = getObjectKey(BONUS_REASON, main_reason)
        switch (main_reason) {
            // За отзывы
            case BONUS_REASON.REVIEW:
                await ctx.replyWithHTML('Выберите платформу, на которой оставили отзыв', getReviewReasonKeyboard())
                break
            // За отметку
            case BONUS_REASON.MARK:
                await ctx.replyWithHTML('Выберите платформу, на которой оставили отметку', getMarkReasonKeyboard())
                break
            // Другое
            case BONUS_REASON.OTHER:
            default:
                await ctx.replyWithHTML(
                    `<b>Продолжите фразу на месте троеточия:</b> \nВам начислено ${ctx.wizard.state.bonus.count} бонусов за <code>...</code>`
                )
                break
        }
        return ctx.wizard.next()
    },
    // Получаем подпричину, начисляем бонусы, уведомляем
    async (ctx) => {
        let sub_reason = '...'
        if (ctx.update?.callback_query) {
            await ctx.answerCbQuery()
            sub_reason = ctx.update.callback_query.data
        } else {
            sub_reason = ctx.message.text
        }
        ctx.wizard.state.bonus.sub_reason = sub_reason

        const { main_reason } = ctx.wizard.state.bonus
        if (main_reason === BONUS_REASON.REVIEW) {
            ctx.wizard.state.bonus.sub_reason_key = getObjectKey(BONUS_REVIEW, sub_reason)
        }
        if (main_reason === BONUS_REASON.MARK) {
            ctx.wizard.state.bonus.sub_reason_key = getObjectKey(MARK_REASON, sub_reason)
        }

        let reason_text = ''
        if (main_reason === BONUS_REASON.OTHER) {
            reason_text = sub_reason
        } else {
            reason_text = `<b>${main_reason}</b> на платформе <b>${sub_reason}</b>`
        }
        // Начисляем бонусы
        await addBonusToClient(ctx.session.admin_edited_user, ctx.wizard.state.bonus, reason_text)
        // Оповещаем админа
        const message_text = `➕ Начисление\n\nКлиенту ${getUserLink(ctx.session.admin_edited_user)} начислено ${ctx.wizard.state.bonus.count} бонусов за ${reason_text}`
        await ctx.replyWithHTML(message_text, {
            link_preview_options: {
                is_disabled: true,
            },
        })
        await sendBotMessage(ADMIN_CHAT_ID, message_text)
        ctx.wizard.state.bonus = {}
        return ctx.scene.leave()
    }
)

const removeBonusWizardScene = new Scenes.WizardScene(
    ADMIN_WIZARD.REMOVE_BONUS,
    // Начало сцены
    async (ctx) => {
        ctx.wizard.state.bonus = {}
        await ctx.replyWithHTML(`Введите кол-во к списанию ${getUserLink(ctx.session.admin_edited_user)}:`, {
            link_preview_options: {
                is_disabled: true,
            },
        })
        return ctx.wizard.next()
    },
    // Получаем число бонусов
    async (ctx) => {
        const count = Number(ctx.message.text)
        // validation
        if (!count || count < 1) {
            await ctx.replyWithHTML('Введите валидное число!')
            return
        }
        // Списываем бонусы
        const success = await removeBonusFromClient(ctx.session.admin_edited_user, count)
        if (!success) {
            await ctx.replyWithHTML('Введенное кол-во меньше баланса клиента!')
            return
        }
        // Оповещаем админа
        const message_text = `➖ Списание\n\nУ клиента ${getUserLink(ctx.session.admin_edited_user)} списано ${count} бонусов`
        await ctx.replyWithHTML(message_text, {
            link_preview_options: {
                is_disabled: true,
            },
        })
        await sendBotMessage(ADMIN_CHAT_ID, message_text)
        ctx.wizard.state.bonus = {}
        return ctx.scene.leave()
    }
)

const stage = new Scenes.Stage([addBonusWizardScene, removeBonusWizardScene])
composer.use(stage.middleware())

composer.action(ADMIN_ACTIONS.ADD_BONUS, async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.scene.enter(ADMIN_WIZARD.ADD_BONUS)
})

composer.action(ADMIN_ACTIONS.REMOVE_BONUS, async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.scene.enter(ADMIN_WIZARD.REMOVE_BONUS)
})

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
