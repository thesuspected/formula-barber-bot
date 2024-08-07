import { Composer, Markup, Scenes } from 'telegraf'
import { getReviewsKeyboard } from './bonus.const.js'

const REVIEW_WIZARD_SCENE = 'REVIEW_WIZARD_SCENE'
const composer = new Composer()
const REVIEW_SCENE = {
    RATE_1: '1 😡',
    RATE_2: '2 🤨',
    RATE_3: '3 😕',
    RATE_4: '4 😄',
    RATE_5: '5 😁',
}
const getReviewKeyboard = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback(REVIEW_SCENE.RATE_1, REVIEW_SCENE.RATE_1),
        Markup.button.callback(REVIEW_SCENE.RATE_2, REVIEW_SCENE.RATE_2),
        Markup.button.callback(REVIEW_SCENE.RATE_3, REVIEW_SCENE.RATE_3),
        Markup.button.callback(REVIEW_SCENE.RATE_4, REVIEW_SCENE.RATE_4),
        Markup.button.callback(REVIEW_SCENE.RATE_5, REVIEW_SCENE.RATE_5),
    ]).resize()
}
const revieWizardScene = new Scenes.WizardScene(
    REVIEW_WIZARD_SCENE,
    // Начало сцены
    async (ctx) => {
        ctx.wizard.state.review = {}
        const message = await ctx.replyWithHTML(
            `Спасибо, что воспользовались услугами Формулы! Пожалуйста оцените визит в барбершоп от 1 до 5`,
            getReviewKeyboard()
        )
        ctx.wizard.state.review.message_id = message.message_id
        return ctx.wizard.next()
    },
    // Получаем оценку
    async (ctx) => {
        if (ctx.update?.callback_query) {
            await ctx.answerCbQuery()
            const rate = ctx.update.callback_query.data
            ctx.wizard.state.review.rate = rate
            console.log(rate)
            switch (rate) {
                // 5 балов
                case REVIEW_SCENE.RATE_5:
                    await ctx.replyWithHTML(
                        'Благодарим вас за высокую оценку! Будем рады если вы оставите отзыв о нас на картах. При следующей стрижке покажите его администратору и получите 100 бонусных рублей за каждый отзыв',
                        getReviewsKeyboard()
                    )
                    return ctx.scene.leave()
                // 4-3 балла
                case REVIEW_SCENE.RATE_4:
                case REVIEW_SCENE.RATE_3:
                    await ctx.replyWithHTML('Подскажите как мы можем улучшить наш сервис?')
                    break
                // 1-2 балла
                case REVIEW_SCENE.RATE_2:
                case REVIEW_SCENE.RATE_1:
                    await ctx.replyWithHTML(
                        'Что испортило ваше впечатление? Мы хотим быть лучше, оставьте ваш отзыв, он будет анонимным, мы учтем ваши пожелания'
                    )
                    break
                default:
                    ctx.replyWithHTML('Нажмите одну из кнопок от 1 до 5!')
                    return
            }
        } else {
            ctx.replyWithHTML('Нажмите одну из кнопок от 1 до 5!')
            return
        }
        ctx.deleteMessage(ctx.wizard.state.review.message_id)
        return ctx.wizard.next()
    },
    async (ctx) => {
        if (ctx.message.text) {
            console.log(ctx)
            const reason = ctx.message.text
            ctx.wizard.state.reason = reason
            switch (ctx.wizard.state.review.rate) {
                case REVIEW_SCENE.RATE_4:
                case REVIEW_SCENE.RATE_3:
                    await ctx.replyWithHTML(
                        'Спасибо за ваш отзыв! Мы обязательно учтем ваши пожелания, чтобы стать лучше!'
                    )
                    break
                case REVIEW_SCENE.RATE_2:
                case REVIEW_SCENE.RATE_1:
                    await ctx.replyWithHTML(
                        'Нам очень жаль, что мы испортили вам впечатление, вся информация будет передана анонимно нашему руководству. Мы начислили на ваш счет 300 бонусных рублей в качестве извинений за предоставленные неудобства'
                    )
                    break
                default:
                    ctx.replyWithHTML('Оставьте отзыв')
                    break
            }
        } else {
            ctx.replyWithHTML('Оставьте отзыв')
        }
        return ctx.scene.leave()
    }
)
const stage = new Scenes.Stage([revieWizardScene])
composer.use(stage.middleware())

composer.command('review', (ctx) => {
    ctx.scene.enter(REVIEW_WIZARD_SCENE)
})
export default composer
