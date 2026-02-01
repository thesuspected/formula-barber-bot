import cron from 'node-cron'
import axios from 'axios'
import { db } from '../config/firebase.js'
import { sendBotMessage } from '../barber.js'
import { getEntryBeforeDayNotice, getEntryBeforeHourNotice } from './messages.js'
import { getUserByClientPhone, getUserById, getUserLink } from './helpers.js'
import dayjs from '../config/dayjs.js'

const { ADMIN_CHAT_ID, YCLIENTS_AUTH } = process.env
const COMPANY_ID = 1057728
const REMIND_CRON_SCHEDULE = '0 12 * * 6' // Суббота 12:00
const REMIND_MESSAGE_TEXT =
    'Гонщик, ты выбыл из трассы на 90 дней. Команда «Формулы» уже ждёт тебя — пора вернуться и навести порядок под твоим гоночным шлемом🏎️🔥'
const REMIND_MONTH_THRESHOLD = 1
const LAST_VISIT_MONTH_THRESHOLD = 3

const yclientsHeaders = {
    Accept: 'application/vnd.api.v2+json',
    Authorization: YCLIENTS_AUTH,
}

const getNormalizedPhone = (phone) => {
    if (!phone) {
        return null
    }
    return phone.slice(phone.length - 10)
}

const getRemindDayjs = (value) => {
    if (!value) {
        return null
    }
    if (typeof value === 'object') {
        if (typeof value.toDate === 'function') {
            return dayjs(value.toDate())
        }
        if (value.seconds) {
            return dayjs(value.seconds * 1000)
        }
    }
    return dayjs(value)
}

const fetchClientsBatch = async (page = 1, count = 200) => {
    try {
        const { data } = await axios.post(
            `https://api.yclients.com/api/v1/company/${COMPANY_ID}/clients/search`,
            {
                page,
                count,
                fields: ['id', 'name', 'phone', 'last_visit_date', 'last_record_date'],
            },
            {
                headers: yclientsHeaders,
            }
        )
        const clients = data?.data ?? data?.clients ?? []
        const totalPages = data?.meta?.total_pages ?? data?.total_pages ?? page
        return { clients, totalPages }
    } catch (error) {
        console.error('Не удалось получить клиентов YClients', error?.response?.data ?? error.message)
        return { clients: [], totalPages: 0 }
    }
}

const fetchLastVisitFromRecords = async (clientId) => {
    try {
        const { data } = await axios.post(
            'https://api.yclients.com/api/v1/records/search',
            {
                company_id: COMPANY_ID,
                page: 1,
                count: 1,
                filters: [
                    {
                        field: 'client_id',
                        operator: '=',
                        value: clientId,
                    },
                    {
                        field: 'attendance',
                        operator: '=',
                        value: 1,
                    },
                ],
                order: [
                    {
                        field: 'datetime',
                        direction: 'desc',
                    },
                ],
            },
            {
                headers: yclientsHeaders,
            }
        )
        const records = data?.data?.records ?? data?.data ?? []
        const lastVisitRecord = records[0]
        if (lastVisitRecord?.datetime) {
            return lastVisitRecord.datetime
        }
    } catch (error) {
        console.error(`Не удалось получить визиты клиента ${clientId}`, error?.response?.data ?? error.message)
    }
    return null
}

const getLastVisitDate = async (client) => {
    if (client.last_visit_date) {
        return client.last_visit_date
    }
    if (client.last_record_date) {
        return client.last_record_date
    }
    return await fetchLastVisitFromRecords(client.id)
}

const getInactiveClients = async () => {
    if (!YCLIENTS_AUTH) {
        console.log('Не задан YCLIENTS_AUTH, пропускаем поиск неактивных клиентов')
        return []
    }
    const inactiveClients = []
    const thresholdDate = dayjs().subtract(LAST_VISIT_MONTH_THRESHOLD, 'month')
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
        const { clients, totalPages: total } = await fetchClientsBatch(page)
        if (!clients.length) {
            break
        }
        totalPages = total ?? totalPages
        for (const client of clients) {
            if (!client?.phone) {
                continue
            }
            const lastVisitDate = await getLastVisitDate(client)
            if (!lastVisitDate) {
                continue
            }
            const visitDayjs = dayjs(lastVisitDate)
            if (visitDayjs.isBefore(thresholdDate)) {
                inactiveClients.push({
                    client,
                    lastVisitDate: visitDayjs,
                })
            }
        }
        page += 1
    }

    console.log(`Найдено ${inactiveClients.length} клиентов без визита более ${LAST_VISIT_MONTH_THRESHOLD} мес`)
    return inactiveClients
}

const canSendRemindMessage = (user) => {
    const remindDate = getRemindDayjs(user.remind_message_date)
    if (!remindDate) {
        return true
    }
    return remindDate.isBefore(dayjs().subtract(REMIND_MONTH_THRESHOLD, 'month'))
}

const formatClientLine = (clientData) => {
    const { client, lastVisitDate } = clientData
    const phone = client.phone ?? 'Не указан'
    const lastVisitText = lastVisitDate ? lastVisitDate.format('DD.MM.YYYY') : '—'
    return `• ${client.name ?? 'Без имени'} (${phone}) — визит ${lastVisitText}`
}

const launchRemindCron = async () => {
    console.log('Старт еженедельного крона напоминаний')
    try {
        const candidates = await getInactiveClients()
        if (!candidates.length) {
            console.log('Нет клиентов для напоминаний')
            return
        }

        const usersWithoutBot = []
        const remindedUsers = []

        for (const candidate of candidates) {
            const phoneNumber = getNormalizedPhone(candidate.client.phone)
            if (!phoneNumber) {
                continue
            }
            const user = await getUserByClientPhone(phoneNumber, candidate.client)
            if (!user) {
                usersWithoutBot.push(candidate)
                continue
            }
            if (!canSendRemindMessage(user)) {
                continue
            }
            await sendBotMessage(user.id, REMIND_MESSAGE_TEXT)
            await db.collection('barber-users').doc(String(user.id)).set(
                {
                    remind_message_date: dayjs().toISOString(),
                },
                { merge: true }
            )
            remindedUsers.push({
                user,
                client: candidate.client,
                lastVisitDate: candidate.lastVisitDate,
            })
        }

        if (remindedUsers.length) {
            const remindLines = remindedUsers
                .map(({ user, client, lastVisitDate }) => {
                    const visitDate = lastVisitDate ? lastVisitDate.format('DD.MM.YYYY') : '—'
                    return `• ${getUserLink(user)} (${client.phone}) — визит ${visitDate}`
                })
                .join('\n')
            await sendBotMessage(
                ADMIN_CHAT_ID,
                `<b>🏎️ Отправлены напоминания (${remindedUsers.length})</b>\n${remindLines}`
            )
        } else {
            console.log('Не найдено пользователей бота для напоминаний')
        }

        if (usersWithoutBot.length) {
            const noBotLines = usersWithoutBot.map((clientData) => formatClientLine(clientData)).join('\n')
            await sendBotMessage(ADMIN_CHAT_ID, `<b>👀 Клиенты без бота (${usersWithoutBot.length})</b>\n${noBotLines}`)
        }
    } catch (error) {
        console.error('Ошибка крона напоминаний', error)
        await sendBotMessage(ADMIN_CHAT_ID, `⚠️ Ошибка крона напоминаний: ${error?.response?.data ?? error.message}`)
    }
}

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
        if (!notice.isNoticeBeforeDaySend && hoursDiff >= 23 && hoursDiff <= 24) {
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
        if (hoursDiff < 1.1) {
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

const NOTICE_CRON_INTERVAL = 15 // Интервал в минутах
console.log(`🔔 Крон напоминаний (каждые ${NOTICE_CRON_INTERVAL} минут)`)
console.log(`⏰ Крон забытых клиентов (каждую субботу 12:00)`)

cron.schedule(`*/${NOTICE_CRON_INTERVAL} * * * *`, async () => {
    console.log('Крон событие уведомления', dayjs().format('DD MMMM YYYY, HH:mm'))
    await launchNoticeCron()
})

cron.schedule(REMIND_CRON_SCHEDULE, async () => {
    console.log('Крон напоминаний', dayjs().format('DD MMMM YYYY, HH:mm'))
    await launchRemindCron()
})
