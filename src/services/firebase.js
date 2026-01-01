/**
 * Сервис для работы с Firebase Firestore
 * @module services/firebase
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp, 
    enableIndexedDbPersistence, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { FIREBASE_CONFIG } from '../config/constants.js';
import { retryOperation } from '../utils/retry.js';
import { handleFirestoreError } from './errorHandler.js';

let app = null;
let dbRef = null;
let auth = null;

/**
 * Инициализирует Firebase приложение
 * @returns {Promise<{app: *, db: *, auth: *}>} Объект с инициализированными сервисами
 */
export async function initFirebase() {
    if (app) {
        return { app, db: dbRef, auth };
    }
    
    try {
        app = initializeApp(FIREBASE_CONFIG);
        dbRef = getFirestore(app);
        auth = getAuth(app);
        
        // Включаем offline persistence
        try {
            await enableIndexedDbPersistence(dbRef);
            console.log('Firestore persistence enabled');
        } catch (persistenceError) {
            console.warn('Persistence disabled:', persistenceError);
        }
        
        // Анонимная аутентификация
        try {
            await signInAnonymously(auth);
        } catch (authError) {
            console.warn("Auth failed:", authError);
            throw authError;
        }
        
        return { app, db: dbRef, auth };
    } catch (error) {
        console.error('Firebase initialization error:', error);
        throw error;
    }
}

/**
 * Получает ссылку на Firestore
 * @returns {*} Ссылка на Firestore
 */
export function getDb() {
    if (!dbRef) {
        throw new Error('Firebase not initialized. Call initFirebase() first.');
    }
    return dbRef;
}

/**
 * Сохраняет запись катушки (создание или обновление)
 * @param {Object} record - Данные записи
 * @param {string} [editId] - ID для обновления (если не указан - создание)
 * @param {Function} [showToast] - Функция для показа уведомлений
 * @returns {Promise<{success: boolean, id?: string, error?: Error}>}
 */
export async function saveSpoolRecord(record, editId = null, showToast = null) {
    const db = getDb();
    
    const operation = async () => {
        if (editId) {
            await updateDoc(doc(db, "spools", editId), {
                ...record,
                updatedAt: serverTimestamp()
            });
            return { id: editId, isNew: false };
        } else {
            const docRef = await addDoc(collection(db, "spools"), {
                ...record,
                createdAt: serverTimestamp()
            });
            return { id: docRef.id, isNew: true };
        }
    };
    
    try {
        const result = await retryOperation(operation);
        if (showToast) {
            showToast(editId ? 'Обновлено' : 'Создано');
        }
        return { success: true, ...result };
    } catch (error) {
        const context = editId ? 'При обновлении' : 'При создании';
        handleFirestoreError(error, context, showToast);
        return { success: false, error };
    }
}

/**
 * Удаляет запись катушки
 * @param {string} id - ID записи для удаления
 * @param {Function} [showToast] - Функция для показа уведомлений
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
export async function deleteSpoolRecord(id, showToast = null) {
    const db = getDb();
    
    const operation = async () => {
        await deleteDoc(doc(db, "spools", id));
    };
    
    try {
        await retryOperation(operation);
        if (showToast) {
            showToast('Удалено');
        }
        return { success: true };
    } catch (error) {
        handleFirestoreError(error, 'При удалении', showToast);
        return { success: false, error };
    }
}

/**
 * Массовое удаление записей
 * @param {Array<string>} ids - Массив ID для удаления
 * @param {Function} [showToast] - Функция для показа уведомлений
 * @returns {Promise<{success: boolean, deleted: number, errors: Array}>}
 */
export async function bulkDeleteSpoolRecords(ids, showToast = null) {
    const db = getDb();
    const results = await Promise.allSettled(
        ids.map(id => deleteDoc(doc(db, "spools", id)))
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected');
    
    if (failed.length > 0) {
        console.error('Some deletions failed:', failed);
    }
    
    if (showToast) {
        showToast(`Удалено: ${successful} из ${ids.length}`);
    }
    
    return {
        success: failed.length === 0,
        deleted: successful,
        errors: failed.map(r => r.reason)
    };
}

/**
 * Массовое обновление записей
 * @param {Array<string>} ids - Массив ID для обновления
 * @param {Object} updates - Объект с обновлениями
 * @param {Function} [showToast] - Функция для показа уведомлений
 * @returns {Promise<{success: boolean, updated: number, errors: Array}>}
 */
export async function bulkUpdateSpoolRecords(ids, updates, showToast = null) {
    const db = getDb();
    
    const operation = async () => {
        const batchPromises = ids.map(id => 
            updateDoc(doc(db, "spools", id), {
                ...updates,
                updatedAt: serverTimestamp()
            })
        );
        await Promise.all(batchPromises);
    };
    
    try {
        await retryOperation(operation);
        if (showToast) {
            showToast(`Обновлено записей: ${ids.length}`);
        }
        return { success: true, updated: ids.length };
    } catch (error) {
        handleFirestoreError(error, 'При массовом обновлении', showToast);
        return { success: false, updated: 0, errors: [error] };
    }
}

/**
 * Подписывается на изменения в коллекции катушек
 * @param {Function} callback - Функция обратного вызова при изменении данных
 * @param {Function} [errorCallback] - Функция обратного вызова при ошибке
 * @returns {Function} Функция для отписки
 */
export function subscribeToSpools(callback, errorCallback = null) {
    const db = getDb();
    const q = query(collection(db, "spools"));
    
    return onSnapshot(q, 
        (snapshot) => {
            const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
            callback(data);
        },
        (error) => {
            console.error("Firestore Listener Error:", error);
            if (errorCallback) {
                errorCallback(error);
            }
        }
    );
}

/**
 * Подписывается на настройки приложения
 * @param {Function} callback - Функция обратного вызова
 * @returns {Function} Функция для отписки
 */
export function subscribeToSettings(callback) {
    const db = getDb();
    
    return onSnapshot(doc(db, "metadata", "config"), (docSnapshot) => {
        if (docSnapshot.exists()) {
            callback(docSnapshot.data());
        } else {
            // Создаем настройки по умолчанию
            const defaultSettings = {
                models: [
                    { year: "2024", ean: "2000000010632" },
                    { year: "2025", ean: "2000000040783" }
                ]
            };
            setDoc(doc(db, "metadata", "config"), defaultSettings);
            callback(defaultSettings);
        }
    });
}

/**
 * Сохраняет настройки приложения
 * @param {Object} settings - Объект настроек
 * @param {Function} [showToast] - Функция для показа уведомлений
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
export async function saveSettings(settings, showToast = null) {
    const db = getDb();
    
    const operation = async () => {
        await setDoc(doc(db, "metadata", "config"), settings);
    };
    
    try {
        await retryOperation(operation);
        if (showToast) {
            showToast('Настройки сохранены');
        }
        return { success: true };
    } catch (error) {
        handleFirestoreError(error, 'При сохранении настроек', showToast);
        return { success: false, error };
    }
}

/**
 * Проверяет статус подключения
 * @returns {boolean} true, если Firebase инициализирован
 */
export function isFirebaseReady() {
    return app !== null && dbRef !== null;
}

