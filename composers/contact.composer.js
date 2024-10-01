import { Composer } from 'telegraf'
import { CMD } from '../const.js'
import { getContactKeyboard, getContactMessage } from './contact.const.js'
import { tryCatchWrapper } from '../barber.js'

const composer = new Composer()

composer.hears(CMD.CONTACT, (ctx) =>
    tryCatchWrapper(
        ctx.replyWithHTML(getContactMessage(), {
            link_preview_options: {
                is_disabled: true,
            },
            ...getContactKeyboard(),
        })
    )
)

export default composer
