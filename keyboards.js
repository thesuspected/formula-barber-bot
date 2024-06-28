import { CMD, BACK_BUTTON, SHARE_CONTACT } from './const.js'
import { Markup } from 'telegraf'

export const getMainKeyboard = () => {
    return Markup.keyboard([
        [CMD.ADDRESS, CMD.SCHEDULE],
        [CMD.CONTACT, CMD.BONUS],
    ]).resize()
}

export const getPhoneKeyboard = () => {
    return Markup.keyboard([Markup.button.contactRequest(SHARE_CONTACT)]).resize()
}

export const getBackKeyboard = (text = BACK_BUTTON, action = BACK_BUTTON) => {
    return Markup.inlineKeyboard([Markup.button.callback(text, action)]).resize()
}

export const getAddressKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.url('🔴 Яндекс Карты', 'https://yandex.ru/maps/org/formula/106787443492'),
        Markup.button.url('🟢 2ГИС', 'https://2gis.ru/saratov/firm/70000001089511981'),
        Markup.button.url(
            '📹 Как пройти?',
            'https://www.instagram.com/s/aGlnaGxpZ2h0OjE3OTQ4Mjg1MjEwNjk2ODM4?story_media_id=3389435785817854881&igsh=eGNjNHNweXc5ZWc0'
        ),
    ]).resize()
}
