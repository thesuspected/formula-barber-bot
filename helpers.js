export const getStartMessage = (name) => {
    return `Привет, ${name}! 👋

На связи <b>Барбершоп "Формула"</b>💈 — Формула твоего успеха и индивидуального образа 💇🏼
Здесь ты можешь записаться к любимому мастеру, копить бонусы, получать напоминания и многое другое.

Приглашай друзей и получай бонусные рубли 🎁`
}

export const getPhoneMessage = (name) => {
    return `${name}, приветствуем тебя в Формуле! 👋
Для корректной работы бота поделись с нами контактом ⬇️`
}

export const getPhonePleasureMessage = () => {
    return `Спасибо, что выбрал нас!🔥

Теперь тебе доступны все возможности бота:
• Онлайн-запись к мастеру
• Автоматические напоминания
• Накопительная бонусная система

<blockquote>Узнать баланс бонусов можно по соответствующей кнопке внизу</blockquote>
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

export const getNewEntryUserMessage = (user, staff, date) => {
    return `${user.first_name}, привет!👋
Ты записан к мастеру <b>${staff.name}</b> ${date}
Ждем тебя в Формуле! 🏎`
}

export const getEntryBeforeHourNotice = (user_name, staff_name, time) => {
    return `${user_name}, спешим напомнить! 🏁
Мастер <b>${staff_name}</b> ждет тебя сегодня к ${time} в Формуле! 🏎`
}
export const getNewEntryAdminMessage = (user, staff, date) => {
    return `<b>📆 Новая запись!</b>

<b>Аккаунт:</b> <a href="https://t.me/${user.username}">${user.username}</a>
<b>Номер:</b> ${user.phone.prefix}${user.phone.number}
<b>Имя Фамилия:</b> ${user.first_name ?? ''} ${user.last_name ?? ''}
<b>Запись:</b> ${date}
<b>Мастер:</b> ${staff.name}`
}
