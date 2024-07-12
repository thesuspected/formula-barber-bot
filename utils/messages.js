export const getNewEntryUserMessage = (user, staff, date) => {
    return `${user.first_name}, привет!👋
Ты записан к мастеру <b>${staff.name}</b> на ${date}
Ждем тебя в Формуле! 🏎`
}

export const getUpdateEntryUserMessage = (user, staff, date) => {
    return `${user.first_name}, привет!👋
Твоя запись к мастеру <b>${staff.name}</b> была перенесена на ${date}
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
<b>Имя:</b> ${user.first_name ?? ''} ${user.last_name ?? ''}
<b>Запись:</b> ${date}
<b>Мастер:</b> ${staff.name}`
}

export const getUpdateEntryAdminMessage = (user, staff, date, oldDate) => {
    return `<b>↪️📆 Перенесена запись!</b>

<b>Аккаунт:</b> <a href="https://t.me/${user.username}">${user.username}</a>
<b>Номер:</b> ${user.phone.prefix}${user.phone.number}
<b>Имя:</b> ${user.first_name ?? ''} ${user.last_name ?? ''}
<b>Запись До:</b> ${oldDate}
<b>Запись После:</b> ${date}
<b>Мастер:</b> ${staff.name}`
}
