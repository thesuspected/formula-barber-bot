import { Composer, Scenes } from 'telegraf'
import {
    getAdminReviewMessage,
    getRateKeyboard,
    getReviewLinksKeyboard,
    REVIEW_SCORE,
    REVIEW_WIZARD_SCENE,
} from './review.const.js'
import { sendBotMessage } from '../barber.js'

const composer = new Composer()
const { ADMIN_CHAT_ID } = process.env

const reviewWizardScene = new Scenes.WizardScene(
    REVIEW_WIZARD_SCENE,
    // Начало сцены
    async (ctx) => {
        ctx.wizard.state.review = {}
        const message = await ctx.replyWithHTML(
            `Спасибо, что доверяете нам свой образ! 💇 \nМы хотели бы узнать ваше мнение о нашем сервисе! 🧐 \n<blockquote>Пожалуйста, оцените последний визит в барбершоп от 1 до 5 🖐</blockquote>`,
            getRateKeyboard()
        )
        ctx.wizard.state.review.message_id = message.message_id
        return ctx.wizard.next()
    },
    // Получаем оценку
    async (ctx) => {
        if (!ctx.update?.callback_query) {
            await ctx.replyWithHTML('Пожалуйста, нажмите одну из кнопок от 1 до 5 🖐')
            return
        }
        await ctx.answerCbQuery()
        const rate = ctx.update.callback_query.data
        ctx.wizard.state.review.rate = rate
        const rate_text = `<u><b>Вы поставили ${rate}</b></u>`
        switch (rate) {
            // 4-5 баллов
            case REVIEW_SCORE.RATE_5:
            case REVIEW_SCORE.RATE_4:
                await ctx.replyWithHTML(
                    `${rate_text} \n\nБлагодарим вас за высокую оценку! 😊 \nМы будем признательны, если вы оставите отзыв о нас на одном из сервисов ниже 🙏 <blockquote>При следующем посещении покажите его администратору и получите 100 бонусных рублей за каждый отзыв 💸</blockquote>`,
                    getReviewLinksKeyboard()
                )
                ctx.wizard.state.review = {}
                await ctx.deleteMessage(ctx.wizard.state.review.message_id)
                // Отправляем отзыв в админский чат
                const admin_message = getAdminReviewMessage(ctx.from, ctx.session, rate)
                await sendBotMessage(ADMIN_CHAT_ID, admin_message)
                return ctx.scene.leave()
            // 3 балла
            case REVIEW_SCORE.RATE_3:
                await ctx.replyWithHTML(
                    `${rate_text} \n\nСпасибо за честную оценку! 🍀 \nПодскажите, как мы можем улучшить наш сервис? 🧐 \nЧто испортило вам впечатление? 😔`
                )
                ctx.wizard.state.review.message = `Благодарим за отзыв! 💬 \nМы обязательно учтем ваши пожелания, чтобы стать лучше! ⭐️`
                break
            // 1-2 балла
            case REVIEW_SCORE.RATE_2:
            case REVIEW_SCORE.RATE_1:
                await ctx.replyWithHTML(
                    `${rate_text} \n\nСожалеем, что у вас возникли проблемы во время посещения барбершопа 😔 \nМы бы хотели разобраться в ситуации 🙏 <blockquote>Пожалуйста, напишите более подробную информацию о произошедшем:</blockquote>`
                )
                ctx.wizard.state.review.message = `Благодарим Вас за сообщение о возникшей проблеме 🙌 \nМы очень ценим ваше мнение, вся информация будет передана руководству. \n<blockquote>Мы начислили на ваш счет 300 бонусных рублей в качестве извинений за предоставленные неудобства 🥺</blockquote>`
                break
            default:
                await ctx.replyWithHTML('Пожалуйста, нажмите одну из кнопок от 1 до 5 🖐')
                return
        }
        await ctx.deleteMessage(ctx.wizard.state.review.message_id)
        return ctx.wizard.next()
    },
    async (ctx) => {
        if (!ctx.message?.text) {
            await ctx.replyWithHTML('Пожалуйста, напишите отзыв')
            return
        }
        const reason = ctx.message.text
        // Отправляем отзыв в админский чат
        const admin_message = getAdminReviewMessage(ctx.from, ctx.session, ctx.wizard.state.review.rate, reason)
        await sendBotMessage(ADMIN_CHAT_ID, admin_message)
        // Сообщение клиенту
        await ctx.replyWithHTML(ctx.wizard.state.review.message)
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
