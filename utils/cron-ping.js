import cron from 'node-cron'
import { db } from '../config/firebase.js'
import { sendBotMessage } from '../barber.js'
import { getEntryBeforeHourNotice } from '../helpers.js'
import dayjs from 'dayjs'

console.log(`🔔 Cron running (every 10 minutes)`)

const launchNoticeCron = async () => {
    // Получаем записи из БД
    const noticesCollection = db.collection('barber-notices')
    const snapshot = await noticesCollection.get()
    if (snapshot.empty) {
        console.log('Уведомлений для крона нет...')
        return
    }

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
    const currentDatetime = dayjs().tz()
    todayNotices.forEach((notice) => {
        const { user_id, user_name, staff_name, date } = notice

        // Вычисляем разницу в часах
        const noticeDatetime = dayjs(date)
        const hoursDiff = noticeDatetime.diff(currentDatetime, 'hour', true).toFixed(2)
        console.log(`${hoursDiff} часа до записи.`)

        // Если меньше 1.5 часов до записи, отправялем уведомление
        if (hoursDiff < 1.5) {
            const timeString = noticeDatetime.format('HH:mm')
            console.log(`Отправляем уведомление для ${user_name} на ${timeString}`)
            sendBotMessage(user_id, getEntryBeforeHourNotice(user_name, staff_name, timeString))
            // Удаляем отправленное уведомление из бд
            noticesCollection.doc(notice.id).delete()
        } else {
            console.log(`Рано для отправки ${user_name}, время записи ${noticeDatetime.format('HH:mm')}`)
        }
    })
}

cron.schedule('*/10 * * * *', async () => {
    console.log('Крон событие уведомления', dayjs().tz().format('DD MMMM YYYY, HH:mm'))
    await launchNoticeCron()
})
