import { Composer } from 'telegraf'
import { CMD } from '../const.js'
import { getBackKeyboard } from '../keyboards.js'
import { getBonusMessage, getBonusKeyboard, BONUS_TEXT, BONUS, getReviewsKeyboard } from './bonus.const.js'
import { db } from '../config/firebase.js'

const composer = new Composer()

const getBonusCommand = async (ctx) => {
    const userId = String(ctx.from.id)
    const user = (await db.collection('barber-users').doc(userId).get()).data()
    return getBonusMessage(user.bonus_balance)
}
composer.hears(CMD.BONUS, async (ctx) => ctx.replyWithHTML(await getBonusCommand(ctx), getBonusKeyboard()))

composer.action(BONUS.INVITE_FRIEND, (ctx) =>
    ctx.editMessageText(BONUS_TEXT.INVITE_FRIEND, {
        parse_mode: 'HTML',
        ...getBackKeyboard(BONUS.BACK, BONUS.BACK),
    })
)
composer.action(BONUS.INVITE_FRIEND_FROM_SHEDULE, (ctx) => {
    ctx.answerCbQuery()
    ctx.replyWithHTML(BONUS_TEXT.INVITE_FRIEND, {
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
composer.action(BONUS.PAIR_HAIR_FROM_SHEDULE, (ctx) => {
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
composer.action(BONUS.BACK, (ctx) =>
    ctx.editMessageText(getBonusMessage(), {
        parse_mode: 'HTML',
        ...getBonusKeyboard(),
    })
)

export default composer
