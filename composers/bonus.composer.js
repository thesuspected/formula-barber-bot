import { Composer } from 'telegraf'
import { CMD } from '../const.js'
import { getBackKeyboard } from '../keyboards.js'
import { getBonusMessage, getBonusKeyboard, BONUS_TEXT, BONUS, getReviewsKeyboard } from './bonus.const.js'

const composer = new Composer()

composer.hears(CMD.BONUS, (ctx) => ctx.replyWithHTML(getBonusMessage(), getBonusKeyboard()))

composer.action(BONUS.INVITE_FRIEND, (ctx) =>
    ctx.editMessageText(BONUS_TEXT.INVITE_FRIEND, {
        parse_mode: 'HTML',
        ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
    })
)
composer.action(BONUS.PAIR_HAIR, (ctx) =>
    ctx.editMessageText(BONUS_TEXT.PAIR_HAIR, {
        parse_mode: 'HTML',
        ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
    })
)
composer.action(BONUS.BONUS_REVIEWS, (ctx) =>
    ctx.editMessageText(BONUS_TEXT.BONUS_REVIEWS, {
        parse_mode: 'HTML',
        ...getReviewsKeyboard(BONUS.BACK, BONUS.BACK),
    })
)
composer.action(BONUS.BONUS_REFERENCES, (ctx) =>
    ctx.editMessageText(BONUS_TEXT.BONUS_REFERENCES, {
        parse_mode: 'HTML',
        ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
    })
)
composer.action(BONUS.BACK, (ctx) => ctx.editMessageText(getBonusMessage(), getBonusKeyboard()))

export default composer
