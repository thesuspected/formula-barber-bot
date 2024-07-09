import { Markup } from 'telegraf'
import { BACK_BUTTON, CMD } from '../const.js'

export const BONUS = {
    INVITE_FRIEND: '🤝🏻 Пригласи друга',
    PAIR_HAIR: '💇🏼💇🏽 Парная стрижка',
    BONUS_REVIEWS: '💰 Бонусы за отзывы',
    BONUS_REFERENCES: '📸 Бонусы за упоминания',
    BACK: '⬅️ Назад к акциям',
    INVITE_FRIEND_FROM_SHEDULE: 'INVITE_FRIEND_FROM_SHEDULE',
    PAIR_HAIR_FROM_SHEDULE: 'INVITE_FRIEND_FROM_SHEDULE',
}
export const BONUS_TEXT = {
    PAIR_HAIR: `<u><b>${BONUS.PAIR_HAIR}</b></u>

Приходи с любыми людьми (будь то друг, брат, сын, отец и тд) на стрижку в ОДИН ДЕНЬ 🗓
Неважно, идёте ли вы к одному мастеру или к разным, можно записаться в любое рабочее время. 

<blockquote>❗️Главное условие — одна дата стрижки
Предложение распространяется на количество человек от двух и выше.</blockquote>

Получи скидку 200₽ на каждую оказанную услугу 💸`,

    BONUS_REVIEWS: `<u><b>${BONUS.BONUS_REVIEWS}</b></u>
    
Оставь отзыв в любых сетях: 2ГИС, Яндекс Карты, Yclients ✍🏻
Покажи его администратору, он начислит 100 бонусов за каждый отзыв 💸`,

    BONUS_REFERENCES: `<u><b>${BONUS.BONUS_REFERENCES}</b></u>

Отмечай нас в социальный сетях: 
<a href="https://www.instagram.com/formula_barbershop">Инстаграм*</a>, <a href="https://vk.com/formulabarbershop">ВКонтакте</a>, <a href="https://t.me/formulabarber">Телеграм</a> ✍🏻
<blockquote>*Признан экстремистской организацией и запрещен на территории РФ</blockquote>

Мы отреагируем на отметку и свяжемся с тобой, чтобы зафиксировать скидку 💸
За каждую отметку начисляем 50 бонусных рублей 💰`,
}

export const getBonusMessage = (bonus_balance = 0) =>
    `<u><b>${CMD.BONUS}</b></u>

<b>Текущий баланс:</b> ${bonus_balance} ₽

Выполняй действия по кнопкам внизу ⬇️
И получай бонусные рубли на счет! 💸

<blockquote>Бонусы не сгорают со временем, ими можно оплачивать до 50% стоимости услуг в «Формуле»</blockquote>`

export const getInviteFriendMessage = (ctx) => {
    return `<u><b>${BONUS.INVITE_FRIEND}</b></u> и получи бонусные рубли на счет 💸

<b>Начислим тебе:</b>
1-2 друга - 200 бонусов за каждого 
3-5 друзей - 300 бонусов за каждого
От 6 и выше - 500 бонусов за каждого

<b>Твоему другу:</b> 200 бонусов

<blockquote expandable>❗️Учитываются новые клиенты, которые ранее не пользовались нашими услугами. Бонусы зачислятся на счет автоматически после первого посещения барбершопа приглашенным :)</blockquote>

Пригласительная ссылка:
<code>https://t.me/FormulaBarberBot?start=${ctx.from.username}</code>`
}

export const getBonusKeyboard = () => {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback(BONUS.INVITE_FRIEND, BONUS.INVITE_FRIEND),
            Markup.button.callback(BONUS.PAIR_HAIR, BONUS.PAIR_HAIR),
        ],
        [
            Markup.button.callback(BONUS.BONUS_REVIEWS, BONUS.BONUS_REVIEWS),
            Markup.button.callback(BONUS.BONUS_REFERENCES, BONUS.BONUS_REFERENCES),
        ],
    ]).resize()
}

export const getReviewsKeyboard = (text = BACK_BUTTON, action = BACK_BUTTON) => {
    return Markup.inlineKeyboard([
        [
            Markup.button.webApp('🔴 Яндекс Карты', 'https://yandex.ru/maps/org/formula/106787443492/reviews'),
            Markup.button.webApp('🟢 2ГИС', 'https://2gis.ru/saratov/firm/70000001089511981/tab/reviews'),
            Markup.button.webApp('🟡 YCLIENTS', 'https://n1149259.yclients.com/company/1057728/about'),
        ],
        [Markup.button.callback(text, action)],
    ]).resize()
}
