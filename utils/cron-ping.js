import cron from 'node-cron'
import dayjs from '../config/dayjs.js'
import { db } from '../config/firebase.js'

cron.schedule('* * * * *', () => {
    console.log('Крон событие уведомления', dayjs().format('DD MMMM YYYY, HH:mm'))

    db.collection('barber-notices')
})
