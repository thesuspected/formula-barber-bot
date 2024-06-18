import { CMD, FB_BUTTONS, STOCKS } from './const.js'
import { Markup } from 'telegraf'

export const getMainKeyboard = () => {
    return Markup.keyboard([
        [CMD.ADDRESS, CMD.ADMIN],
        [CMD.FEEDBACK, CMD.INVITE, CMD.BONUS],
    ]).resize()
}

export const getFeedbackKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.url(FB_BUTTONS.YANDEX, 'https://yandex.ru/maps/-/CDrTB2Ll'),
        Markup.button.url(FB_BUTTONS.TWOGIS, 'https://go.2gis.com/uya3h'),
        Markup.button.url(FB_BUTTONS.GOOGLE, 'https://maps.app.goo.gl/Pwoua7kTQLERttjP9'),
        Markup.button.callback(FB_BUTTONS.ANONIM, FB_BUTTONS.ANONIM),
    ])
}

export const getstockskeyboard = () => {
    return Markup.keyboard([
        [STOCKS.INVITE_FR, STOCKS.PAIR_HAIR],
        [STOCKS.BONUS_REVIEWS, STOCKS.BONUS_REFERENCES],
    ]).resize()
}
