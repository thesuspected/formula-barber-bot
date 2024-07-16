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

export const getUserByUsername = async (username) => {
    try {
        // Ищем пользователя по username (полученное из invited_from)
        const findUserRes = await db.collection('barber-users').where(Filter.where('username', '==', username))
        const snapshot = await findUserRes.get()

        if (snapshot.empty) {
            // Оповещаем, что пользователь не найден
            const err = `Пользователь с никнеймом ${username} не найден в боте`
            console.log(err)
            return
        }
        if (snapshot.size > 1) {
            const err = `Найдено несколько пользователей с одинаковым никнеймом: ${username}`
            console.log(err)
            await sendBotMessage(ADMIN_CHAT_ID, err)
            return
        }

        // Получаем данные пользователя
        const user = snapshot.docs[0].data()
        console.log('Найден пользователь', user)
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
        return false
    }
    await noticeRef.delete()
    console.log(`Уведомление о записи №${record_id} удалено`)
    return true
}

export const setUserUsedServices = async (user_id) => {
    return await db.collection('barber-users').doc(String(user_id)).update({ used_services: true })
}

export const bonusRewardForReferral = async (username, referral) => {
    const userData = await getUserByUsername(username)
    const userRef = db.collection('barber-users').doc(String(userData.id))

    // Считаем номер успешного реферала
    const invite_number = userData.invited.reduce((count, invited_user) => {
        return count + Number(invited_user.used_services)
    }, 1)
    let bonus_reward = 0

    // Считаем вознаграждение за этого реферала
    switch (invite_number) {
        // 1-2 друга
        case 1:
        case 2:
            bonus_reward = 200
            break
        // 3-5 друзей
        case 3:
        case 4:
        case 5:
            bonus_reward = 300
            break
        // от 6 друзей
        default:
            bonus_reward = 500
            break
    }

    // Обновляем инфу о реферале в массиве invited юзера
    const invited = userData.invited.map((invited_user) => {
        console.log(invited_user.user_id, referral.id)
        if (invited_user.user_id === referral.id) {
            return {
                ...invited_user,
                used_services: true,
                bonus_reward: bonus_reward,
            }
        }
        return invited_user
    })
    console.log('invited =', invited)
    await userRef.update({ invited })

    // Начисляем вознаграждение
    await userRef.update({ balance: userData.balance + bonus_reward })

    return {
        user: userData,
        bonus_reward,
        invite_number,
    }
}

export const getRewardUserMessage = (invited_user, bonus_reward) => {
    return `💸 Тебе начислено ${bonus_reward} бонусов на счет за приглашенного друга @${invited_user.username}!`
}

export const getRewardAdminMessage = (user, invited_user, invite_number, bonus_reward) => {
    return `<b>💸 Начисление бонусов!</b>

<b>Аккаунт:</b> <a href="https://t.me/${user.username}">${user.username}</a>
<b>Номер:</b> ${user.phone.prefix}${user.phone.number}
<b>Имя:</b> ${user.first_name ?? ''} ${user.last_name ?? ''}
<b>Причина:</b> ${invite_number}-ый реферал <a href="https://t.me/${invited_user.username}">${invited_user.username}</a>
<b>Начислено:</b> ${bonus_reward} ₽`
}

export const noticeAboutRewardForReferral = async (rewardInfo, invited_user) => {
    const { user, bonus_reward, invite_number } = rewardInfo
    await sendBotMessage(user.id, getRewardUserMessage(invited_user, bonus_reward))
    await sendBotMessage(ADMIN_CHAT_ID, getRewardAdminMessage(user, invited_user, invite_number, bonus_reward))
}
