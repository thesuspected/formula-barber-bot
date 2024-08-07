import { Markup } from 'telegraf'
import { BONUS_REVIEW } from './bonus.const.js'
import { getUserLink } from '../utils/helpers.js'

export const REVIEW_WIZARD_SCENE = 'REVIEW_WIZARD_SCENE'
export const REVIEW_SCORE = {
    RATE_1: '1 😡',
    RATE_2: '2 🤨',
    RATE_3: '3 😕',
    RATE_4: '4 😄',
    RATE_5: '5 😁',
}
export const getRateKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback(REVIEW_SCORE.RATE_1, REVIEW_SCORE.RATE_1),
        Markup.button.callback(REVIEW_SCORE.RATE_2, REVIEW_SCORE.RATE_2),
        Markup.button.callback(REVIEW_SCORE.RATE_3, REVIEW_SCORE.RATE_3),
        Markup.button.callback(REVIEW_SCORE.RATE_4, REVIEW_SCORE.RATE_4),
        Markup.button.callback(REVIEW_SCORE.RATE_5, REVIEW_SCORE.RATE_5),
    ]).resize()
}
export const getReviewLinksKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.webApp(BONUS_REVIEW.YANDEX, 'https://yandex.ru/maps/org/formula/106787443492/reviews'),
        Markup.button.webApp(BONUS_REVIEW.GIS, 'https://2gis.ru/saratov/firm/70000001089511981/tab/reviews'),
        Markup.button.webApp(BONUS_REVIEW.YCLIENTS, 'https://n1149259.yclients.com/company/1057728/about'),
    ]).resize()
}

export const getAdminReviewMessage = (user, session, rate, reason = '-') => {
    return `<b>💬 Новый отзыв!</b>

<b>Аккаунт:</b> ${getUserLink(user)}
<b>id:</b> ${user.id}
<b>Номер:</b> ${session.phone.prefix}${session.phone.number}
<b>Имя:</b> ${user.first_name ?? ''} ${user.last_name ?? ''}

<b>Оценка:</b> ${rate}
<b>Отзыв:</b> ${reason}
`
}
