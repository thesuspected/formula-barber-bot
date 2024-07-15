import { Composer } from 'telegraf'
import { CMD } from '../const.js'
import { getBackKeyboard } from '../keyboards.js'
import {
    getBonusMessage,
    getBonusKeyboard,
    BONUS_TEXT,
    BONUS,
    getReviewsKeyboard,
    getInviteFriendMessage,
} from './bonus.const.js'

const composer = new Composer()
composer.hears(CMD.BONUS, (ctx) => ctx.replyWithHTML(getBonusMessage(), getBonusKeyboard()))

composer.action(BONUS.INVITE_FRIEND, (ctx) =>
    ctx.editMessageText(getInviteFriendMessage(ctx), {
        parse_mode: 'HTML',
        ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
    })
)
composer.action(BONUS.INVITE_FRIEND_FROM_SCHEDULE, (ctx) => {
    ctx.answerCbQuery()
    ctx.replyWithHTML(getInviteFriendMessage(ctx), {
        parse_mode: 'HTML',
        ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
    })
})
composer.action(BONUS.PAIR_HAIR, (ctx) =>
    ctx.editMessageText(BONUS_TEXT.PAIR_HAIR, {
        parse_mode: 'HTML',
        ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
    })
)
composer.action(BONUS.PAIR_HAIR_FROM_SCHEDULE, (ctx) => {
    ctx.answerCbQuery()
    ctx.replyWithHTML(BONUS_TEXT.PAIR_HAIR, {
        parse_mode: 'HTML',
        ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
    })
})
composer.action(BONUS.BONUS_REVIEWS, (ctx) =>
    ctx.editMessageText(BONUS_TEXT.BONUS_REVIEWS, {
        parse_mode: 'HTML',
        ...getReviewsKeyboard(BONUS.BACK, BONUS.BACK),
    })
)
composer.action(BONUS.BONUS_REFERENCES, (ctx) =>
    ctx.editMessageText(BONUS_TEXT.BONUS_REFERENCES, {
        parse_mode: 'HTML',
        link_preview_options: {
            is_disabled: true,
        },
        ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
    })
)
composer.action(BONUS.BACK, async (ctx) =>
    ctx.editMessageText(getBonusMessage(), {
        parse_mode: 'HTML',
        ...getBonusKeyboard(),
    })
)

export default composer
