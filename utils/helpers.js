import dayjs from 'dayjs'
import { dateLocales } from '../const.js'
import { sendBotMessage } from '../barber.js'
import {
    getDeleteEntryAdminMessage,
    getDeleteEntryUserMessage,
    getNewEntryAdminMessage,
    getNewEntryUserMessage,
    getUpdateEntryAdminMessage,
    getUpdateEntryUserMessage,
} from './messages.js'
import { db, Filter } from '../config/firebase.js'

const { ADMIN_CHAT_ID, DEBUG_CHAT_ID } = process.env

export const sendDebugMessage = async (log, body) => {
    await sendBotMessage(
        DEBUG_CHAT_ID,
        log + `<pre><code class="language-javascript">${JSON.stringify(body, null, 2)}</code></pre>`
    )
}

export const getDateString = (date) => {
    const dayjsDate = dayjs(date)
    return `${dayjsDate.date()} ${dateLocales[dayjsDate.month()]} ${dayjsDate.year()}, в ${dayjsDate.format('HH:mm')}`
}

export const noticeAboutNewEntry = async (user, staff, date) => {
    const dateString = getDateString(date)
    await sendBotMessage(user.id, getNewEntryUserMessage(user, staff, dateString))
    await sendBotMessage(ADMIN_CHAT_ID, getNewEntryAdminMessage(user, staff, dateString))
}

export const noticeAboutUpdateEntry = async (user, staff, date, oldDate) => {
    const dateString = getDateString(date)
    const oldDateString = getDateString(oldDate)
    await sendBotMessage(user.id, getUpdateEntryUserMessage(user, staff, dateString))
    await sendBotMessage(ADMIN_CHAT_ID, getUpdateEntryAdminMessage(user, staff, dateString, oldDateString))
}

export const noticeAboutDeleteEntry = async (user, staff, date) => {
    const dateString = getDateString(date)
    await sendBotMessage(user.id, getDeleteEntryUserMessage(user, staff, dateString))
    await sendBotMessage(ADMIN_CHAT_ID, getDeleteEntryAdminMessage(user, staff, dateString))
}

export const addNewEntryToNoticesCron = async (record_id, user, staff, date) => {
    await db.collection('barber-notices').doc(String(record_id)).set({
        date,
        record_id,
        user_id: user.id,
        user_name: user.first_name,
        staff_name: staff.name,
    })
}

export const getUserByClientPhone = async (phoneNumber, client) => {
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

export const updateNoticeByRecordId = async (record_id, date) => {
    const noticeRef = db.collection('barber-notices').doc(String(record_id))
    const doc = await noticeRef.get()
    if (!doc.exists) {
        console.log(`Записи №${record_id} для изменения не найдено`)
        return false
    }
    const notice = doc.data()
    // Если дата поменялась, обновляем информацию
    if (notice.date !== date) {
        await noticeRef.update({ date })
        console.log(`Дата записи №${record_id} изменена с ${getDateString(notice.date)} на ${getDateString(date)}`)
        return notice
    }
    console.log(`Дата записи №${record_id} совпадает с текущей`)
    return false
}

export const deleteNoticeByRecordId = async (record_id) => {
    const noticeRef = db.collection('barber-notices').doc(String(record_id))
    const doc = await noticeRef.get()
    if (!doc.exists) {
        console.log(`Записи №${record_id} для удаления не найдено`)
        return
    }
    await noticeRef.delete()
    console.log(`Уведомление о записи №${record_id} удалено`)
}
