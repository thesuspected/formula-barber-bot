import { CMD, FB_BUTTONS, BACK_BUTTON, SHARE } from './const.js'
import { Markup } from 'telegraf'

export const getMainKeyboard = () => {
    return Markup.keyboard([
        [CMD.ADDRESS, CMD.SCHEDULE],
        [CMD.ADMIN, CMD.BONUS],
    ]).resize()
}

export const getContactKeyboard = () => {
    return Markup.keyboard([Markup.button.contactRequest(SHARE.CONTACT)]).resize()
}

export const getFeedbackKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.url(FB_BUTTONS.YANDEX, 'https://yandex.ru/maps/-/CDrTB2Ll'),
        Markup.button.url(FB_BUTTONS.TWOGIS, 'https://go.2gis.com/uya3h'),
        Markup.button.url(FB_BUTTONS.GOOGLE, 'https://maps.app.goo.gl/Pwoua7kTQLERttjP9'),
        Markup.button.callback(FB_BUTTONS.ANONIM, FB_BUTTONS.ANONIM),
    ])
}

export const getBackKeyboard = (text = BACK_BUTTON, action = BACK_BUTTON) => {
    return Markup.inlineKeyboard([Markup.button.callback(text, action)]).resize()
}
