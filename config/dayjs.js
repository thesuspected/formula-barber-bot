import 'dayjs/locale/ru.js'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday.js'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.locale('ru')
dayjs.extend(isToday)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault('Europe/Saratov')

console.log('🕗', dayjs().tz().format('DD MMMM YYYY, HH:mm'))

export default dayjs
