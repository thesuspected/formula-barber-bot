import 'dayjs/locale/ru.js'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday.js'

dayjs.locale('ru')
dayjs.extend(isToday)

console.log('🕗', dayjs().format('DD MMMM YYYY, HH:mm'))

export default dayjs
