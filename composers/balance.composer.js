import { db } from '../config/firebase.js'
import { Composer, Markup } from 'telegraf'
import QRCode from 'qrcode'
import { CMD } from '../const.js'
import _ from 'lodash'
import { getUserLink } from '../utils/helpers.js'
import { tryCatchWrapper } from '../barber.js'

const composer = new Composer()

const BALANCE_REFRESH = '🔄 Обновить информацию'
const QR_CODE_OPTIONS = {
    type: 'png',
    margin: 2,
    width: 600,
    color: {
        dark: '#FFFFFF',
        light: '#181818',
    },
}

const getUserData = async (ctx) => {
    const userId = String(ctx.from.id)
    return (await db.collection('barber-users').doc(userId).get()).data()
}

const getBalanceMessage = (user) => {
    return `<blockquote>Покажите этот QR-код администратору для списания</blockquote>
    
${CMD.BALANCE}: <b>${user.balance} ₽</b>

<blockquote>- Получай <b>5% кэшбек</b> с каждой оплаты
- Оплачивай <b>до 30% стоимости</b> услуг
- Бонусы не сгорают со временем
</blockquote>`
}

const getReferralsMessage = (user) => {
    let invited = '<u><b>Рефералы:</b></u>\n'
    if (user.invited.length) {
        user.invited.forEach((value) => {
            invited += `${getUserLink(value)} - ${value.used_services ? `✅ Вознаграждение получено (${value.bonus_reward} ₽)` : '⏳ Ожидаем посещения'}\n`
        })
        invited += '\n'
    } else {
        invited += '<blockquote>Здесь появятся приглашенные тобой люди</blockquote>\n'
    }
    return `\n${invited}Реферальная ссылка:
<code>https://t.me/FormulaBarberBot?start=${user.id}</code>`
}

const getBalanceReply = (user) => {
    const balanceMessage = getBalanceMessage(user)
    const referralsMessage = getReferralsMessage(user)
    return balanceMessage + referralsMessage
}

const getBalanceKeyboard = () => {
    return Markup.inlineKeyboard([Markup.button.callback(BALANCE_REFRESH, BALANCE_REFRESH)]).resize()
}

const getBalanceQrDeepLink = (user) => {
    // Используем user.id из базы, который совпадает с Telegram userId
    return `https://t.me/FormulaBarberBot?start=bonus_${user.id}`
}

composer.hears(CMD.BALANCE, async (ctx) => {
    const user = await getUserData(ctx)
    ctx.session.last_balance = user.balance
    ctx.session.last_invited = user.invited
    const deepLink = getBalanceQrDeepLink(user)
    const qrBuffer = await QRCode.toBuffer(deepLink, QR_CODE_OPTIONS)
    await tryCatchWrapper(
        ctx.replyWithPhoto(
            { source: qrBuffer },
            {
                caption: getBalanceReply(user),
                parse_mode: 'HTML',
                ...getBalanceKeyboard(),
            }
        )
    )
})
composer.command('balance', async (ctx) => {
    const user = await getUserData(ctx)
    ctx.session.last_balance = user.balance
    ctx.session.last_invited = user.invited
    const deepLink = getBalanceQrDeepLink(user)
    const qrBuffer = await QRCode.toBuffer(deepLink, QR_CODE_OPTIONS)
    await tryCatchWrapper(
        ctx.replyWithPhoto(
            { source: qrBuffer },
            {
                caption: getBalanceReply(user),
                parse_mode: 'HTML',
                ...getBalanceKeyboard(),
            }
        )
    )
})
composer.action(BALANCE_REFRESH, async (ctx) => {
    const user = await getUserData(ctx)
    const { last_balance, last_invited } = ctx.session
    // Если баланс или приглашенные обновились
    if (
        last_balance &&
        last_invited &&
        (!_.isEqual(last_balance, user.balance) || !_.isEqual(last_invited, user.invited))
    ) {
        await tryCatchWrapper(
            ctx.editMessageText(getBalanceReply(user), {
                parse_mode: 'HTML',
                ...getBalanceKeyboard(),
            })
        )
    }
    ctx.session.last_balance = user.balance
    ctx.session.last_invited = user.invited
    setTimeout(() => {
        ctx.answerCbQuery('Информация обновлена')
    }, 500)
})

export default composer
