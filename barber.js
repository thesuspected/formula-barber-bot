import 'dotenv/config'
import './config/dayjs.js'
import app from './config/express.js'
import { Telegraf } from 'telegraf'
import { getAddressKeyboard, getSheduleKeyboard } from './keyboards.js'
import { CMD, dateLocales } from './const.js'
import { getAddressMessage, getNewEntryAdminMessage, getNewEntryUserMessage, getSheduleMessage } from './helpers.js'
import StartComposer from './composers/start.composer.js'
import BonusComposer from './composers/bonus.composer.js'
import ContactComposer from './composers/contact.composer.js'
import { db, Filter } from './config/firebase.js'

const { BOT_TOKEN, ADMIN_CHAT_ID } = process.env
const bot = new Telegraf(BOT_TOKEN)

// Авторизация, Получение контакта, Старт бота
bot.use(StartComposer)
// 🎁 Предложения и бонусы
bot.use(BonusComposer)
// 👥 Контакты
bot.use(ContactComposer)
// 📍 Наш адрес
bot.hears(CMD.ADDRESS, (ctx) => {
    ctx.replyWithPhoto(
        { source: 'images/map.png' },
        {
            caption: getAddressMessage(),
            reply_markup: getAddressKeyboard().reply_markup,
            parse_mode: 'HTML',
        }
    )
})
// 📅 График работы
bot.hears(CMD.SCHEDULE, (ctx) => {
    ctx.replyWithPhoto(
        { source: 'images/friend.png' },
        {
            caption: getSheduleMessage(),
            reply_markup: getSheduleKeyboard().reply_markup,
            parse_mode: 'HTML',
        }
    )
})

export async function sendBotMessage(chatId, text) {
    console.log(text)
    await bot.telegram.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        link_preview_options: {
            is_disabled: true,
        },
    })
}

bot.launch()
console.log('🤖 bot start')

app.post('/hook', async (req, res) => {
    console.log('new webhook =', req.body)
    const { status, data } = req.body
    const { staff, client, date } = data

    if (!client || !client.phone) {
        return
    }

    // Берем номер телефона пользователя (без +7)
    const phoneNumber = client.phone.slice(client.phone.length - 10)
    console.log('client phone =', phoneNumber)

    // Ищем его в базе данных
    const user = await getUserByClientPhone(phoneNumber, client)
    if (user) {
        switch (status) {
            // Новая запись к мастеру
            case 'create':
                await noticeUserAndAdminAboutNewEntry(user, staff, date)
                break
            default:
                const log = `Необрабатываемый статус вебхука: ${status}`
                await sendBotMessage(ADMIN_CHAT_ID, log)
                break
        }
    }

    res.status(200).end()
})

const noticeUserAndAdminAboutNewEntry = async (user, staff, date) => {
    const dayjsDate = dayjs(date)
    const dateString = `на ${dayjsDate.date()} ${dateLocales[dayjsDate.month()]} ${dayjsDate.year()}, в ${dayjsDate.format('hh:mm')}`

    await sendBotMessage(user.id, getNewEntryUserMessage(user, staff, dateString))
    await sendBotMessage(ADMIN_CHAT_ID, getNewEntryAdminMessage(user, staff, dateString))
}

const getUserByClientPhone = async (phoneNumber, client) => {
    console.log('getUserByClientPhone client =', client)
    try {
        // Ищем пользователя по номеру телефона без префикса +7
        const findUserRes = await db.collection('barber-users').where(Filter.where('phone.number', '==', phoneNumber))
        const snapshot = await findUserRes.get()

        if (snapshot.empty) {
            // Оповещаем, что пользователь не пользуется ботом
            const err = `Пользователь ${client.name} с номером ${client.phone} не найден в боте`
            await sendBotMessage(ADMIN_CHAT_ID, err)
        }
        if (snapshot.size > 1) {
            const err = `Найдено несколько пользователей с одинаковым номером: ${phoneNumber}`
            await sendBotMessage(ADMIN_CHAT_ID, err)
            return
        }

        // Получаем данные пользователя
        const user = snapshot.docs[0].data()
        console.log('Найден пользователь', user)

        const client = {
            id: 227469234,
            name: 'Артём',
            surname: '',
            patronymic: '',
            display_name: 'Артём',
            comment: '',
            phone: '+79991800857',
            card: '',
            email: 'artemmishenko@mail.ru',
            success_visits_count: 3,
            fail_visits_count: 0,
            discount: 0,
            custom_fields: [],
        }

        // Обновляем информацию о клиенте из барбершопа
        await db.collection('barber-users').doc(String(user.id)).set({ client }, { merge: true })

        return user
    } catch (e) {
        await sendBotMessage(ADMIN_CHAT_ID, e)
        return false
    }
}

// Остановка бота
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
