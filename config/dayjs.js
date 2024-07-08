import 'dayjs/locale/ru.js'
import dayjs from 'dayjs'

dayjs.locale('ru')

console.log('🕗', dayjs().format('DD MMMM YYYY, HH:mm'))

export default dayjs
