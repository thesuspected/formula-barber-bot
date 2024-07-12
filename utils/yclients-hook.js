import app from '../config/express.js'
import dayjs from 'dayjs'
import {
    addNewEntryToNoticesCron,
    deleteNoticeByRecordId,
    getUserByClientPhone,
    noticeAboutDeleteEntry,
    noticeAboutNewEntry,
    noticeAboutUpdateEntry,
    sendDebugMessage,
    updateNoticeByRecordId,
} from './helpers.js'

app.post('/hook', async (req, res) => {
    const bodyLog = `----- Вебхук ${dayjs().format('DD MMMM YYYY, HH:mm')} -----\n`
    console.log(bodyLog, req.body)
    await sendDebugMessage(bodyLog, req.body)

    const { status, resource, data } = req.body
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
    if (user && resource === 'record') {
        switch (status) {
            // Новая запись к мастеру
            case 'create':
                await noticeAboutNewEntry(user, staff, date)
                await addNewEntryToNoticesCron(id, user, staff, date)
                break
            // Изменение записи
            case 'update':
                // TODO: Учесть изменение имени сотрудника staff
                const updatedNotice = await updateNoticeByRecordId(id, date)
                if (updatedNotice) {
                    await noticeAboutUpdateEntry(user, staff, date, updatedNotice.date)
                }
                break
            // Удаление записи
            case 'delete':
                const isDeleted = await deleteNoticeByRecordId(id)
                if (isDeleted) {
                    await noticeAboutDeleteEntry(user, staff, date)
                }
                break
            default:
                const log = `Необрабатываемый статус вебхука: ${status}`
                console.log(log)
                break
        }
    }

    res.status(200).end()
})
