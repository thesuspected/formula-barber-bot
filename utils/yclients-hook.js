import app from '../config/express.js'
import { db, Filter } from '../config/firebase.js'
import dayjs from 'dayjs'
import { dateLocales } from '../const.js'
import { getNewEntryAdminMessage, getNewEntryUserMessage } from '../helpers.js'
import { sendBotMessage } from '../barber.js'

const { ADMIN_CHAT_ID, DEBUG_CHAT_ID } = process.env
app.post('/hook', async (req, res) => {
    const bodyLog = `----- Вебхук ${dayjs().format('DD MMMM YYYY, HH:mm')} -----
<pre><code class="language-javascript">${JSON.parse(req.body)}</code></pre>`
    console.log(bodyLog)
    await sendBotMessage(DEBUG_CHAT_ID, bodyLog)

    const { status, data } = req.body
    const { staff, client, date, id } = data

    // TODO: Добавить проверку на существование record_id в barber-notices и обновление данных о записи (редактирование, удаление)
    // resource: 'record',
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
                await addNewEntryToNoticesCron(id, user, staff, date)
                break
            // TODO: Добавить обработку update, delete
            default:
                const log = `Необрабатываемый статус вебхука: ${status}`
                console.log(log)
                break
        }
    }

    res.status(200).end()
})

const addNewEntryToNoticesCron = async (record_id, user, staff, date) => {
    await db.collection('barber-notices').add({
        date,
        record_id,
        user_id: user.id,
        user_name: user.first_name,
        staff_name: staff.name,
    })
}
const noticeUserAndAdminAboutNewEntry = async (user, staff, date) => {
    const dayjsDate = dayjs(date)
    const dateString = `на ${dayjsDate.date()} ${dateLocales[dayjsDate.month()]} ${dayjsDate.year()}, в ${dayjsDate.format('HH:mm')}`

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
            console.log(err)
            return
        }
        if (snapshot.size > 1) {
            const err = `Найдено несколько пользователей с одинаковым номером: ${phoneNumber}`
            console.log(err)
            await sendBotMessage(ADMIN_CHAT_ID, err)
            return
        }

        // Получаем данные пользователя
        const user = snapshot.docs[0].data()
        console.log('Найден пользователь', user)

        // Обновляем информацию о клиенте из барбершопа
        await db.collection('barber-users').doc(String(user.id)).set({ client }, { merge: true })

        return user
    } catch (e) {
        console.error(e)
        await sendBotMessage(ADMIN_CHAT_ID, e)
        return false
    }
}
