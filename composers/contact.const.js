import { CMD } from '../const.js'
import { Markup } from 'telegraf'

export const CONTACT = {
    ADMIN: '👩🏼‍💼 Администратор',
    PARTNER: '🤝 Сотрудничество',
}

export const SOCIAL = {
    INST: {
        name: 'Инстаграм',
        url: 'https://www.instagram.com/formula_barbershop',
    },
    VK: {
        name: 'Вконтакте',
        url: 'https://vk.com/formulabarbershop',
    },
    TG: {
        name: 'Телеграм',
        url: 'https://t.me/formulabarber',
    },
}

export const getContactMessage = () =>
    `<u><b>${CMD.CONTACT}</b></u>

<b>По вопросам работы барбершопа:</b>
👩🏼‍💼 <a href="https://t.me/formula_barber">Администратор</a> 
📞 +7(908)554-14-14

<b>По вопросам рекламы и сотрудничества:</b>
🙎🏻‍ <a href="https://t.me/Smnv3798">Владелец</a>

<b>Подписывайся на соцсети:</b>
✍🏻 <a href="${SOCIAL.INST.url}">${SOCIAL.INST.name}*</a>, <a href="${SOCIAL.VK.url}">${SOCIAL.VK.name}</a>, <a href="${SOCIAL.TG.url}">${SOCIAL.TG.name}</a>
<blockquote>*Признан экстремистской организацией и запрещен на территории РФ</blockquote>`

export const getContactKeyboard = () => {
    return Markup.inlineKeyboard([
        [
            Markup.button.url(CONTACT.ADMIN, 'https://t.me/formula_barber'),
            Markup.button.url(CONTACT.PARTNER, 'https://t.me/Smnv3798'),
        ],
        [
            Markup.button.url(SOCIAL.INST.name, SOCIAL.INST.url),
            Markup.button.url(SOCIAL.VK.name, SOCIAL.VK.url),
            Markup.button.url(SOCIAL.TG.name, SOCIAL.TG.url),
        ],
    ]).resize()
}
