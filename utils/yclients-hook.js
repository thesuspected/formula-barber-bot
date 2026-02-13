import app from '../config/express.js'
import dayjs from 'dayjs'
import {
    addBonusesToUserBalance,
    addNewEntryToNoticesCron,
    bonusRewardForReferral,
    deleteNoticeByRecordId,
    getUserByClientPhone,
    noticeAboutDeleteEntry,
    noticeAboutNewEntry,
    noticeAboutPayServicesByUser,
    noticeAboutRewardForReferral,
    noticeAboutUpdateEntry,
    noticeAdminsAboutBonusAccrual,
    noticeUserAboutBonusAccrual,
    sendDebugMessage,
    setUserSendReview,
    setUserUsedServices,
    updateNoticeByRecordId,
} from './helpers.js'
import { sendReviewRateMessage } from '../composers/review.composer.js'
import { exec } from 'child_process'

const handleReferralReward = async (user) => {
    // Если кем-то приглашен и еще не посещал барбершоп
    if (user.invited_from && !user.used_services) {
        // Помечаем рефералу, что он пользовался услугами (used_services = true)
        await setUserUsedServices(user.id)
        // Начисляем бонусы юзеру за реферала и помечаем (used_services = true)
        const rewardInfo = await bonusRewardForReferral(user.invited_from, user)
        // Оповещаем юзера и админов о награждении за реферала
        await noticeAboutRewardForReferral(rewardInfo, user)
    }
}

const haircutId = 15803024
const consultationId = 26523359
const waitingMs = 600000
const waitingMin = waitingMs / 60000

const handleReviewMessage = async (user, sold_item_id) => {
    // Отправка просьбы об отзыве если операция соответствует отслеживаемой (id)
    if (!user.send_review && sold_item_id === haircutId) {
        await setUserSendReview(user.id)
        await noticeAboutPayServicesByUser(user, waitingMin)
        // Отправляем просьбу об отзыве через заданное время
        setTimeout(() => {
            sendReviewRateMessage(user)
        }, waitingMs)
    }
}

const bonusMultiplier = 0.05

const handleSendBonuses = async (user, amount, sold_item_id, paid_full) => {
    // Проверяем, что услуга не является товаром
    if (sold_item_id === consultationId) {
        return
    }

    if (paid_full && paid_full !== 1) {
        // Проверяем, что оплата прошла полностью
        return
    }

    const paidAmount = Number(amount)
    // Проверяем валидность суммы оплаты
    if (!paidAmount || paidAmount <= 0) {
        return
    }

    // Считаем сумму бонусов к начислению
    const bonusAmount = Number((paidAmount * bonusMultiplier).toFixed(2))
    if (!bonusAmount) {
        return
    }

    await addBonusesToUserBalance(user, bonusAmount)
    await noticeUserAboutBonusAccrual(user, bonusAmount)
    await noticeAdminsAboutBonusAccrual(user, paidAmount, bonusAmount)
}

app.get('/reload-formula', async (req, res) => {
    console.log('Вебхук перезапуска')
    try {
        exec(`pm2 reload formula-barber`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`)
                return
            }
            console.log(`stdout = ${stdout}`)
            console.log(`stderr = ${stderr}`)
        })
    } catch (error) {
        console.log(error)
    }
    console.log('Бот перезапущен')
    res.send('Бот перезапущен').status(200).end()
})

app.post('/hook', async (req, res) => {
    const bodyLog = `----- Вебхук ${dayjs().format('DD MMMM YYYY, HH:mm')} -----\n`
    console.log(bodyLog, req.body)
    await sendDebugMessage(bodyLog, req.body)

    const { status, resource, data } = req.body
    const { staff, client, date, id, sold_item_id, amount, record } = data

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
            case 'create':
                // Проверяем на реферала
                await handleReferralReward(user)
                // Проверям на отзыв
                await handleReviewMessage(user, sold_item_id)
                // Начисляем бонусы
                await handleSendBonuses(user, amount, sold_item_id, record?.paid_full)
                break
            default:
                const log = `Необрабатываемый вебхук, ресурс: ${resource}, статус : ${status}`
                console.log(log)
                break
        }
    }

    res.status(200).end()
})
