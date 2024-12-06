import cron from 'node-cron'
import { db } from '../config/firebase.js'
import { sendBotMessage } from '../barber.js'
import { getEntryBeforeDayNotice, getEntryBeforeHourNotice } from './messages.js'
import { getUserById, getUserLink } from './helpers.js'
import dayjs from '../config/dayjs.js'

const { ADMIN_CHAT_ID } = process.env
const CRON_INTERVAL = 15 // Интервал в минутах
console.log(`🔔 Cron running (every ${CRON_INTERVAL} minutes)`)

const launchNoticeCron = async () => {
    // Получаем записи из БД
    const noticesCollection = db.collection('barber-notices')
    const snapshot = await noticesCollection.get()
    if (snapshot.empty) {
        console.log('Уведомлений для крона нет...')
        return
    }

    // Отбираем уведомления на Завтра
    const tomorrowNotices = snapshot.docs
        .map((doc) => {
            return {
                id: doc.id,
                ...doc.data(),
            }
        })
        .filter((notice) => dayjs(notice.date).isTomorrow())
    console.log(`Завтра ${tomorrowNotices.length} уведомл.`)

    // Проходимся по уведомлениям на завтра
    const currentDatetime = dayjs()
    tomorrowNotices.forEach((notice) => {
        const { user_id, user_name, staff_name, date } = notice

        // Вычисляем разницу в часах
        const noticeDatetime = dayjs(date)
        const hoursDiff = noticeDatetime.diff(currentDatetime, 'hour', true).toFixed(2)
        console.log(`${hoursDiff} часа до записи.`)

        // Если не отправляли уведомление за сутки и N часов до записи, отправялем уведомление
        if (!notice.isNoticeBeforeDaySend && hoursDiff > 23 && hoursDiff < 24) {
            getUserById(user_id).then((user) => {
                const { userData } = user
                const timeString = noticeDatetime.format('HH:mm')
                const noticeLog = `Отправил напоминание о записи за 24ч для <b>${getUserLink(userData)}</b> на <b>${timeString}</b>`
                console.log(noticeLog)
                sendBotMessage(user_id, getEntryBeforeDayNotice(user_name, staff_name, timeString))
                sendBotMessage(ADMIN_CHAT_ID, noticeLog)
                // Отмечаем, что уведомление за сутки отправлено
                noticesCollection.doc(notice.id).update({ isNoticeBeforeDaySend: true })
            })
        } else {
            if (hoursDiff > 24) {
                console.log(`Поздно для отправки ${user_name}, время записи ${noticeDatetime.format('HH:mm')}`)
            } else {
                console.log(`Рано для отправки ${user_name}, время записи ${noticeDatetime.format('HH:mm')}`)
            }
        }
    })

    // Отбираем уведомления на Сегодня (10:00 - 21:00)
    const todayNotices = snapshot.docs
        .map((doc) => {
            return {
                id: doc.id,
                ...doc.data(),
            }
        })
        .filter((notice) => dayjs(notice.date).isToday())
    console.log(`Сегодня ${todayNotices.length} уведомл.`)

    // TODO: Удалять пропущенные уведомления (которые меньше текущей даты)

    // Проходимся по уведомлениям
    todayNotices.forEach((notice) => {
        const { user_id, user_name, staff_name, date } = notice

        // Вычисляем разницу в часах
        const noticeDatetime = dayjs(date)
        const hoursDiff = noticeDatetime.diff(currentDatetime, 'hour', true).toFixed(2)
        console.log(`${hoursDiff} часа до записи.`)

        // Если меньше N часов до записи, отправялем уведомление
        if (hoursDiff < 1.6) {
            getUserById(user_id).then((user) => {
                const { userData } = user
                const timeString = noticeDatetime.format('HH:mm')
                const noticeLog = `Отправил напоминание о записи для <b>${getUserLink(userData)}</b> на <b>${timeString}</b>`
                console.log(noticeLog)
                sendBotMessage(user_id, getEntryBeforeHourNotice(user_name, staff_name, timeString))
                sendBotMessage(ADMIN_CHAT_ID, noticeLog)
                // Удаляем отправленное уведомление из бд
                noticesCollection.doc(notice.id).delete()
            })
        } else {
            console.log(`Рано для отправки ${user_name}, время записи ${noticeDatetime.format('HH:mm')}`)
        }
    })
}

cron.schedule(`*/${CRON_INTERVAL} * * * *`, async () => {
    console.log('Крон событие уведомления', dayjs().format('DD MMMM YYYY, HH:mm'))
    await launchNoticeCron()
})
