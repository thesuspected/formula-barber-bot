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
import { tryCatchWrapper } from '../barber.js'

const composer = new Composer()
composer.hears(CMD.BONUS, (ctx) => tryCatchWrapper(ctx.replyWithHTML(getBonusMessage(), getBonusKeyboard())))

composer.action(BONUS.INVITE_FRIEND, (ctx) =>
    tryCatchWrapper(
        ctx.editMessageText(getInviteFriendMessage(ctx), {
            parse_mode: 'HTML',
            ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
        })
    )
)
composer.action(BONUS.INVITE_FRIEND_FROM_SCHEDULE, async (ctx) => {
    ctx.answerCbQuery()
    await tryCatchWrapper(
        ctx.replyWithHTML(getInviteFriendMessage(ctx), {
            parse_mode: 'HTML',
            ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
        })
    )
})
composer.action(BONUS.PAIR_HAIR, (ctx) =>
    tryCatchWrapper(
        ctx.editMessageText(BONUS_TEXT.PAIR_HAIR, {
            parse_mode: 'HTML',
            ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
        })
    )
)
composer.action(BONUS.PAIR_HAIR_FROM_SCHEDULE, async (ctx) => {
    ctx.answerCbQuery()
    await tryCatchWrapper(
        ctx.replyWithHTML(BONUS_TEXT.PAIR_HAIR, {
            parse_mode: 'HTML',
            ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
        })
    )
})
composer.action(BONUS.BONUS_REVIEWS, (ctx) =>
    tryCatchWrapper(
        ctx.editMessageText(BONUS_TEXT.BONUS_REVIEWS, {
            parse_mode: 'HTML',
            link_preview_options: {
                is_disabled: true,
            },
            ...getReviewsKeyboard(BONUS.BACK, BONUS.BACK),
        })
    )
)
composer.action(BONUS.BONUS_REFERENCES, (ctx) =>
    tryCatchWrapper(
        ctx.editMessageText(BONUS_TEXT.BONUS_REFERENCES, {
            parse_mode: 'HTML',
            link_preview_options: {
                is_disabled: true,
            },
            ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
        })
    )
)
composer.action(BONUS.BACK, async (ctx) =>
    tryCatchWrapper(
        ctx.editMessageText(getBonusMessage(), {
            parse_mode: 'HTML',
            ...getBonusKeyboard(),
        })
    )
)

export default composer
