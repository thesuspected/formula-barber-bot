const RETRYABLE_NETWORK_CODES = new Set([
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'EPIPE',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ERR_SOCKET_CONNECTION_TIMEOUT',
])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getErrorChain = (error) => {
    const chain = []
    let current = error
    while (current) {
        chain.push(current)
        current = current.cause
    }
    return chain
}

export const isRetryableNetworkError = (error) => {
    return getErrorChain(error).some((err) => {
        const code = err?.code ?? err?.errno
        if (code && RETRYABLE_NETWORK_CODES.has(String(code))) {
            return true
        }
        const message = err?.message ?? ''
        return message.includes('ETIMEDOUT') || message.includes('ECONNRESET') || message.includes('FetchError')
    })
}

export const formatTelegramError = (error) => {
    const main = error?.message ?? String(error)
    const details = []
    if (error?.code) {
        details.push(`code: ${error.code}`)
    }
    if (error?.errno) {
        details.push(`errno: ${error.errno}`)
    }
    if (error?.cause) {
        const causeMessage = error.cause?.message ?? String(error.cause)
        const causeCode = error.cause?.code ?? error.cause?.errno
        details.push(`cause: ${causeMessage}${causeCode ? ` (${causeCode})` : ''}`)
    }
    return details.length ? `${main} (${details.join(', ')})` : main
}

export const withTelegramRetry = async (fn, { retries = 4, delayMs = 2000, label = 'telegram' } = {}) => {
    let lastError

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error
            const canRetry = isRetryableNetworkError(error) && attempt < retries

            if (!canRetry) {
                throw error
            }

            const waitMs = delayMs * attempt
            console.warn(
                `[${label}] Сетевая ошибка (попытка ${attempt}/${retries}): ${formatTelegramError(error)}. Повтор через ${waitMs}мс`
            )
            await sleep(waitMs)
        }
    }

    throw lastError
}
