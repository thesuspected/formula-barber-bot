import app from '../config/express.js'
import dayjs from 'dayjs'
import {
    addNewEntryToNoticesCron,
    bonusRewardForReferral,
    deleteNoticeByRecordId,
    getUserByClientPhone,
    noticeAboutDeleteEntry,
    noticeAboutNewEntry,
    noticeAboutRewardForReferral,
    noticeAboutUpdateEntry,
    sendDebugMessage,
    setUserUsedServices,
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

    // Обработка записей
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
                const log = `Необрабатываемый вебхук, ресурс: ${resource}, статус : ${status}`
                console.log(log)
                break
        }
    }

    // Обработка финансовых операций
    if (user && resource === 'finances_operation') {
        switch (status) {
            // Фин. операция для первого посещения
            case 'create':
                // Если кем-то приглашен и еще не посещал барбершоп
                if (user.invited_from && !user.used_services) {
                    // Помечаем рефералу, что он пользовался услугами (used_services = true)
                    await setUserUsedServices(user.id)
                    // Начисляем бонусы юзеру за реферала и помечаем (used_services = true)
                    const rewardInfo = await bonusRewardForReferral(user.invited_from, user)
                    // Оповещаем юзера и админов о награждении за реферала
                    await noticeAboutRewardForReferral(rewardInfo, user)
                }
                // TODO: Добавить здесь логику опроса после посещения барбершопа
                break
            default:
                const log = `Необрабатываемый вебхук, ресурс: ${resource}, статус : ${status}`
                console.log(log)
                break
        }
    }

    res.status(200).end()
})
