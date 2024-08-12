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
export const getRateMessage = () => {
    return `Спасибо, что доверяете нам свой образ! 💇 
Мы хотели бы узнать ваше мнение о нашем сервисе! 🧐 
<blockquote>Пожалуйста, оцените последний визит в барбершоп от 1 до 5 🖐</blockquote>`
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

export const getHighRateMessage = (rate_text) => {
    return `${rate_text} 

Благодарим вас за высокую оценку! 😊 
Мы будем признательны, если вы оставите отзыв о нас на одном из сервисов ниже 🙏 
<blockquote>1️⃣ Сделайте скриншот отзыва 
2️⃣ Отправьте его 👩🏼‍💼 <a href="https://t.me/formula_barber">Администратору</a> или покажите при следующем посещении 
3️⃣ Получите 100 бонусных рублей за каждый отзыв 💸</blockquote>`
}

export const getMiddleRateMessage = (rate_text) => {
    return `${rate_text} 
    
Спасибо за честную оценку! 🍀 
Подскажите, как мы можем улучшить наш сервис? 🧐
<blockquote>Напишите что испортило вам впечатление:</blockquote>`
}
export const getMiddleRateMessageNextStep = () => {
    return `Благодарим за отзыв! 💬 
Мы обязательно учтем ваши пожелания, чтобы стать лучше! ⭐️`
}

export const getLowRateMessage = (rate_text) => {
    return `${rate_text} 

Сожалеем, что у вас возникли проблемы во время посещения барбершопа 😔 
Мы бы хотели разобраться в ситуации 🙏 
<blockquote>Пожалуйста, напишите более подробную информацию о произошедшем:</blockquote>`
}
export const getLowRateMessageNextStep = (isBonusesSend) => {
    const bonus_text = isBonusesSend
        ? '<blockquote>Мы начислили на ваш счет 300 бонусных рублей в качестве извинений за предоставленные неудобства 🥺</blockquote>'
        : ''
    return `Благодарим Вас за сообщение о возникшей проблеме 🙌 
Мы очень ценим ваше мнение, информация будет передана руководству ✅ 
${bonus_text}`
}
