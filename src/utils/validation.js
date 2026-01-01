/**
 * Утилиты для валидации данных
 * @module utils/validation
 */

/**
 * Правила валидации полей
 * @type {Object}
 */
export const ValidationRules = {
    serial: {
        required: true,
        minLength: 3,
        maxLength: 50,
        pattern: /^[A-Z0-9\/\.У]+$/i,
        message: 'Серийный номер должен содержать только буквы, цифры, /, . и У'
    },
    globalSeq: {
        required: true,
        min: 1,
        max: 999999,
        message: 'Сквозной номер должен быть от 1 до 999999'
    },
    prefix: {
        required: true,
        minLength: 1,
        maxLength: 20,
        pattern: /^[A-Z0-9\/\.]+$/i
    },
    year: {
        required: true,
        min: 2020,
        max: 2100,
        message: 'Год должен быть от 2020 до 2100'
    },
    month: {
        required: true,
        min: 1,
        max: 12,
        message: 'Месяц должен быть от 1 до 12'
    }
};

/**
 * Валидирует значение поля по правилам
 * @param {*} value - Значение для валидации
 * @param {Object} rule - Правила валидации
 * @returns {string[]} Массив ошибок (пустой, если валидация прошла)
 */
export function validateField(value, rule) {
    const errors = [];
    
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        errors.push('Поле обязательно для заполнения');
        return errors; // Если обязательное поле пустое, остальные проверки не нужны
    }
    
    if (!value && !rule.required) {
        return errors; // Необязательное пустое поле - OK
    }
    
    if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
            errors.push(`Минимальная длина: ${rule.minLength}`);
        }
        
        if (rule.maxLength && value.length > rule.maxLength) {
            errors.push(`Максимальная длина: ${rule.maxLength}`);
        }
        
        if (rule.pattern && !rule.pattern.test(value)) {
            errors.push(rule.message || 'Неверный формат');
        }
    }
    
    if (typeof value === 'number' || !isNaN(Number(value))) {
        const numValue = Number(value);
        
        if (rule.min !== undefined && numValue < rule.min) {
            errors.push(`Минимальное значение: ${rule.min}`);
        }
        
        if (rule.max !== undefined && numValue > rule.max) {
            errors.push(`Максимальное значение: ${rule.max}`);
        }
    }
    
    return errors;
}

/**
 * Валидирует запись катушки
 * @param {Object} record - Объект записи для валидации
 * @returns {{isValid: boolean, errors: Object}} Результат валидации
 */
export function validateRecord(record) {
    const errors = {};
    
    errors.serial = validateField(record.serial, ValidationRules.serial);
    errors.globalSeq = validateField(record.globalSeq, ValidationRules.globalSeq);
    errors.prefix = validateField(record.prefix, ValidationRules.prefix);
    
    if (record.year !== undefined) {
        errors.year = validateField(record.year, ValidationRules.year);
    }
    
    if (record.month !== undefined) {
        errors.month = validateField(record.month, ValidationRules.month);
    }
    
    return {
        isValid: Object.values(errors).every(err => err.length === 0),
        errors
    };
}

/**
 * Получает первую ошибку валидации
 * @param {Object} validationResult - Результат валидации
 * @returns {string|null} Первая ошибка или null
 */
export function getFirstError(validationResult) {
    for (const fieldErrors of Object.values(validationResult.errors)) {
        if (fieldErrors.length > 0) {
            return fieldErrors[0];
        }
    }
    return null;
}

