import { Composer, Scenes } from 'telegraf'
import { getReviewsKeyboard } from './bonus.const.js'
import { getRateKeyboard, REVIEW_SCORE, REVIEW_WIZARD_SCENE } from './review.const.js'

const composer = new Composer()

const reviewWizardScene = new Scenes.WizardScene(
    REVIEW_WIZARD_SCENE,
    // Начало сцены
    async (ctx) => {
        ctx.wizard.state.review = {}
        const message = await ctx.replyWithHTML(
            `Спасибо, что воспользовались услугами Формулы! Пожалуйста оцените визит в барбершоп от 1 до 5`,
            getRateKeyboard()
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
            switch (rate) {
                // 5 балов
                case REVIEW_SCORE.RATE_5:
                    await ctx.replyWithHTML(
                        'Благодарим вас за высокую оценку! Будем рады если вы оставите отзыв о нас на картах. При следующей стрижке покажите его администратору и получите 100 бонусных рублей за каждый отзыв',
                        getReviewsKeyboard()
                    )
                    ctx.wizard.state.review = {}
                    return ctx.scene.leave()
                // 4-3 балла
                case REVIEW_SCORE.RATE_4:
                case REVIEW_SCORE.RATE_3:
                    await ctx.replyWithHTML('Подскажите как мы можем улучшить наш сервис?')
                    ctx.wizard.state.review.message = `Спасибо за ваш отзыв! Мы обязательно учтем ваши пожелания, чтобы стать лучше!`
                    break
                // 1-2 балла
                case REVIEW_SCORE.RATE_2:
                case REVIEW_SCORE.RATE_1:
                    await ctx.replyWithHTML(
                        'Что испортило ваше впечатление? Мы хотим быть лучше, оставьте ваш отзыв, он будет анонимным, мы учтем ваши пожелания'
                    )
                    ctx.wizard.state.review.message = `Нам очень жаль, что мы испортили вам впечатление, вся информация будет передана анонимно нашему руководству. Мы начислили на ваш счет 300 бонусных рублей в качестве извинений за предоставленные неудобства`
                    break
                default:
                    await ctx.replyWithHTML('Нажмите одну из кнопок от 1 до 5!')
                    return
            }
        } else {
            await ctx.replyWithHTML('Нажмите одну из кнопок от 1 до 5!')
            return
        }
        await ctx.deleteMessage(ctx.wizard.state.review.message_id)
        return ctx.wizard.next()
    },
    async (ctx) => {
        if (ctx.message?.text) {
            const reason = ctx.message.text
            // TODO: Отправить отзыв о посещении в чат
            await ctx.replyWithHTML(ctx.wizard.state.review.message)
        } else {
            await ctx.replyWithHTML('Оставьте отзыв')
        }
        ctx.wizard.state.review = {}
        return ctx.scene.leave()
    }
)
const stage = new Scenes.Stage([reviewWizardScene])
composer.use(stage.middleware())

composer.command('review', async (ctx) => {
    await ctx.scene.enter(REVIEW_WIZARD_SCENE)
})
export default composer
