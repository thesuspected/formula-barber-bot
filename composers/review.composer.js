import { Composer, Scenes } from 'telegraf'
import {
    getAdminReviewMessage,
    getHighRateMessage,
    getLowRateMessage,
    getLowRateMessageNextStep,
    getMiddleRateMessage,
    getMiddleRateMessageNextStep,
    getRateKeyboard,
    getRateMessage,
    getReviewLinksKeyboard,
    REVIEW_SCORE,
    REVIEW_WIZARD_SCENE,
} from './review.const.js'
import { sendBotMessage } from '../barber.js'
import { getUserById } from '../utils/helpers.js'
import { ADMIN_ARRAY } from './admin.composer.js'

const composer = new Composer()
const { ADMIN_CHAT_ID } = process.env

export const sendReviewRateMessage = async (user_id) => {
    await sendBotMessage(user_id, getRateMessage(), getRateKeyboard())
}

const sendBonusForBadReview = async (ctx) => {
    const BONUS_COUNT = 300
    const { userRef, userData } = await getUserById(ctx.from.id)
    if (!userData.isSendBadReviewBonus) {
        await userRef.update({ balance: userData.balance + BONUS_COUNT, isSendBadReviewBonus: true })
        return true
    }
    return false
}

const reviewWizardScene = new Scenes.WizardScene(
    REVIEW_WIZARD_SCENE,
    // Отправляем сообщение в зависимости от оценки
    async (ctx) => {
        const rate = ctx.session.last_rate
        ctx.wizard.state.review = { rate }
        const rate_text = `<u><b>Вы поставили ${ctx.session.last_rate}</b></u>`
        switch (ctx.session.last_rate) {
            // 4-5 баллов
            case REVIEW_SCORE.RATE_5:
            case REVIEW_SCORE.RATE_4:
                await ctx.replyWithHTML(getHighRateMessage(rate_text), {
                    parse_mode: 'HTML',
                    link_preview_options: {
                        is_disabled: true,
                    },
                    ...getReviewLinksKeyboard(),
                })
                // Отправляем отзыв в админский чат
                await sendBotMessage(ADMIN_CHAT_ID, getAdminReviewMessage(ctx.from, ctx.session, rate))
                return ctx.scene.leave()
            // 3 балла
            case REVIEW_SCORE.RATE_3:
                await ctx.replyWithHTML(getMiddleRateMessage(rate_text))
                ctx.wizard.state.review.message = getMiddleRateMessageNextStep()
                break
            // 1-2 балла
            case REVIEW_SCORE.RATE_2:
            case REVIEW_SCORE.RATE_1:
                await ctx.replyWithHTML(getLowRateMessage(rate_text))
                // Начисляем бонусы за плохое впечатление, если раньше не оценивал также
                const isBonusSend = await sendBonusForBadReview(ctx)
                ctx.wizard.state.review.message = getLowRateMessageNextStep(isBonusSend)
                break
            default:
                await ctx.replyWithHTML('Извините, произошла непредвиденная ошибка :(')
                return
        }
        return ctx.wizard.next()
    },
    async (ctx) => {
        if (!ctx.message?.text) {
            await ctx.replyWithHTML('Пожалуйста, напишите отзыв')
            return
        }
        const reason = ctx.message.text
        // Отправляем отзыв в админский чат
        await sendBotMessage(
            ADMIN_CHAT_ID,
            getAdminReviewMessage(ctx.from, ctx.session, ctx.wizard.state.review.rate, reason)
        )
        // Сообщение клиенту
        await ctx.replyWithHTML(ctx.wizard.state.review.message)
        ctx.wizard.state.review = {}
        return ctx.scene.leave()
    }
)
const stage = new Scenes.Stage([reviewWizardScene])
composer.use(stage.middleware())

composer.action(
    [REVIEW_SCORE.RATE_1, REVIEW_SCORE.RATE_2, REVIEW_SCORE.RATE_3, REVIEW_SCORE.RATE_4, REVIEW_SCORE.RATE_5],
    async (ctx) => {
        ctx.session.last_rate = ctx.update.callback_query.data
        await ctx.deleteMessage()
        await ctx.scene.enter(REVIEW_WIZARD_SCENE)
    }
)

composer.command('review', async (ctx) => {
    // Проверяем на админа
    if (!ADMIN_ARRAY.includes(ctx.from.username)) {
        return
    }
    await sendReviewRateMessage(ctx.from.id)
})
export default composer
