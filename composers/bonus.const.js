import { Markup } from 'telegraf'

export const BONUS = {
    INVITE_FRIEND: '🤝🏻 Пригласи друга',
    PAIR_HAIR: '💇🏼💇🏽Парная стрижка',
    BONUS_REVIEWS: '💰 Бонусы за отзывы',
    BONUS_REFERENCES: '📸 Бонусы за упоминания',
    BACK: '⬅️ Назад к акциям',
}
export const BONUS_TEXT = {
    INVITE_FRIEND: `<b>${BONUS.INVITE_FRIEND}</b> и получи бонусные рубли на счет 💸

Сколько начисляем?
1-2 друга - 100 бонусов за каждого 
3-5 друзей - 150 бонусов за каждого
От 5 и выше - 200 бонусов за каждого

<blockquote expandable>Учитываются новые клиенты, которые ранее не пользовались нашими услугами. Бонусы зачисляются на ваш счет в момент предоставления приглашенным реферального кода администратору</blockquote>`,

    PAIR_HAIR: `<b>${BONUS.PAIR_HAIR}</b>

Приходи с любыми людьми (будь то друг, брат, сын, отец и тд) на стрижку в ОДИН ДЕНЬ, не важно идёте ли Вы к одному мастеру или разным, также можно записаться в любое рабочее время. 
Предложение распространяется на количество человек от двух и выше. 
❗️Главное условие❗️ -  одна дата стрижки🗓 
Получите скидку 200₽ на каждую оказанную услугу💸`,

    BONUS_REVIEWS: `<b>${BONUS.BONUS_REVIEWS}</b>
    
Оставь его в любых сетях: 2ГИС, Яндекс Карты, Yclients ✍🏻
Просто покажите отзывы нашему администратору, он зафиксирует скидку 100 бонусов за каждый отзыв💸`,

    BONUS_REFERENCES: `<b>${BONUS.BONUS_REFERENCES}</b>

Также в социальных сетях с отметкой нашего барбершопа: ВКонтакте, Инстаграм, Телеграм.✍🏻
Мы также отреагируем на отметку и свяжемся с вами в этот день для того, чтобы зафиксировать за Вами скидку💸
За каждую отметку начисляем 50 бонусных рублей💰`,
}

export const getBonusMessage = () =>
    `🎁 Акции и бонусы
    
Бонусы можно копить и оплачивать до 50% стоимости услуг в «Формуле»`

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
