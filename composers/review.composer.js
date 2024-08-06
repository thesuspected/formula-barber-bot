import { Composer, Markup, Scenes } from 'telegraf'

const REVIEW_WIZARD_SCENE = 'REVIEW_WIZARD_SCENE'
const composer = new Composer()
const REVIEW_SCENE = {
    BALL_1: 1,
    BALL_2: 2,
    BALL_3: 3,
    BALL_4: 4,
    BALL_5: 5,
}
const getReviewWizard = () => {
    return Markup.inlineKeyboard([
        Markup.button.callback(REVIEW_SCENE.BALL_1, REVIEW_SCENE.BALL_1),
        Markup.button.callback(REVIEW_SCENE.BALL_2, REVIEW_SCENE.BALL_2),
        Markup.button.callback(REVIEW_SCENE.BALL_3, REVIEW_SCENE.BALL_3),
        Markup.button.callback(REVIEW_SCENE.BALL_4, REVIEW_SCENE.BALL_4),
        Markup.button.callback(REVIEW_SCENE.BALL_5, REVIEW_SCENE.BALL_5),
    ]).resize()
}
const revieWizardScene = new Scenes.WizardScene(REVIEW_WIZARD_SCENE, async (ctx) => {
    ctx.wizard.state.review = {}
    await ctx.replyWithHTML(
        `Спасибо, что воспользовались услугами Формулы! Пожалуйста оцените визит в барбершоп от 1 до 5`,
        getReviewWizard()
    )
})
const stage = new Scenes.Stage([revieWizardScene])
composer.use(stage.middleware())

composer.command('review', (ctx) => {
    ctx.scene.enter(REVIEW_WIZARD_SCENE)
})
export default composer
