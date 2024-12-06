import 'dayjs/locale/ru.js'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday.js'
import isTomorrow from 'dayjs/plugin/isTomorrow.js'

dayjs.locale('ru')
dayjs.extend(isToday)
dayjs.extend(isTomorrow)

console.log('🕗', dayjs().format('DD MMMM YYYY, HH:mm'))

export default dayjs
