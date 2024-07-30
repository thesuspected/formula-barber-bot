import { getUserLink } from './utils/helpers.js'

export const getStartMessage = (name) => {
    return `Привет, ${name}! 👋

На связи <b>Барбершоп "Формула"</b>💈 — Формула твоего успеха и индивидуального образа 💇🏼
Здесь ты можешь записаться к любимому мастеру, копить бонусы, получать напоминания и многое другое.

Приглашай друзей и получай бонусные рубли 🎁`
}

export const getPhoneMessage = (name, invited_from) => {
    let invited_text = ''
    console.log(invited_from)
    if (invited_from) {
        invited_text = `<blockquote>Ты был приглашен ${getUserLink(invited_from)} 🤝</blockquote>`
    }
    return `${name}, приветствуем тебя в Формуле! 👋
Для корректной работы бота поделись с нами контактом ⬇️ ${invited_text}`
}

export const getPhonePleasureMessage = (ctx) => {
    const { invite_rewarded, invited_from } = ctx.session
    let reward_text = ''
    if (invite_rewarded) {
        reward_text = `
<blockquote>Ты был приглашен ${getUserLink(invited_from)} 🤝
И получаешь 200 бонусов на счет! 🎁</blockquote>`
    }
    return `Спасибо, что выбрал нас!🔥

Теперь тебе доступны все возможности бота:
• Онлайн-запись к мастеру
• Автоматические напоминания
• Накопительная бонусная система
${reward_text}
`
}

export const getAddressMessage = () => {
    return `<b>Мы располагаемся по адресу:</b>
<a href="https://yandex.ru/maps/org/formula/106787443492">ул. Чернышевского 52Б</a>

<b>🚶 Чтобы попасть во двор пешком:</b>
набери на домофоне <b>2🔔249🔔</b>

<b>🏎 Во дворе есть парковочные места:</b>
позвони администратору 📞 +7(908)554-14-14
и мы откроем тебе ворота 🙌
`
}

export const getSheduleMessage = () => {
    return `Мы открыты гостям ежедневно
<b>с 10:00 до 21:00 🕰️</b>

Записывайтесь на стрижку по кнопке <b>"Запись"</b> 
на удобное для вас время и дату 📅

<blockquote>А если ты любишь стричься с семьей или друзьями, 
для тебя есть специальные предложения 🎁⬇️</blockquote>`
}
