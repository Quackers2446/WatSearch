/**
 * IndexedDB utilities for storing course files locally.
 * Files are stored with their metadata for easy retrieval.
 */

const DB_NAME = "WatSearchFiles";
const DB_VERSION = 1;
const STORE_NAME = "courseFiles";

interface StoredFile {
    id: string; // courseId_fileId
    courseId: string;
    fileId: string;
    relativePath: string;
    filename: string;
    category: string;
    data: ArrayBuffer;
    contentType: string;
    uploadedAt: number;
}

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
    if (db) {
        return db;
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error("Failed to open IndexedDB"));
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // Create object store if it doesn't exist
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = database.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                });

                // Create indexes for efficient queries
                objectStore.createIndex("courseId", "courseId", { unique: false });
                objectStore.createIndex("fileId", "fileId", { unique: false });
                objectStore.createIndex("category", "category", { unique: false });
                objectStore.createIndex("relativePath", "relativePath", {
                    unique: false,
                });
            }
        };
    });
}

/**
 * Store a file in IndexedDB
 */
export async function storeFile(
    courseId: string,
    fileId: string,
    relativePath: string,
    filename: string,
    category: string,
    data: ArrayBuffer,
    contentType: string,
): Promise<void> {
    const database = await initDB();
    const id = `${courseId}_${fileId}`;

    const file: StoredFile = {
        id,
        courseId,
        fileId,
        relativePath,
        filename,
        category,
        data,
        contentType,
        uploadedAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(file);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Failed to store file"));
    });
}

/**
 * Retrieve a file from IndexedDB
 */
export async function getFile(
    courseId: string,
    fileId: string,
): Promise<StoredFile | null> {
    const database = await initDB();
    const id = `${courseId}_${fileId}`;

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result || null);
        };
        request.onerror = () => reject(new Error("Failed to retrieve file"));
    });
}

/**
 * Get all files for a course
 */
export async function getCourseFiles(
    courseId: string,
): Promise<StoredFile[]> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("courseId");
        const request = index.getAll(courseId);

        request.onsuccess = () => {
            resolve(request.result || []);
        };
        request.onerror = () => reject(new Error("Failed to retrieve course files"));
    });
}

/**
 * Get files by category for a course
 */
export async function getFilesByCategory(
    courseId: string,
    category: string,
): Promise<StoredFile[]> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("courseId");
        const request = index.getAll(courseId);

        request.onsuccess = () => {
            const files = request.result || [];
            const filtered = files.filter((file) => file.category === category);
            resolve(filtered);
        };
        request.onerror = () =>
            reject(new Error("Failed to retrieve files by category"));
    });
}

/**
 * Delete a file from IndexedDB
 */
export async function deleteFile(
    courseId: string,
    fileId: string,
): Promise<void> {
    const database = await initDB();
    const id = `${courseId}_${fileId}`;

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error("Failed to delete file"));
    });
}

/**
 * Delete all files for a course
 */
export async function deleteCourseFiles(courseId: string): Promise<void> {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index("courseId");
        const request = index.openCursor(courseId);

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                cursor.delete();
                cursor.continue();
            } else {
                resolve();
            }
        };
        request.onerror = () => reject(new Error("Failed to delete course files"));
    });
}

/**
 * Get file as Blob URL for display/download
 */
export async function getFileBlobUrl(
    courseId: string,
    fileId: string,
): Promise<string | null> {
    const file = await getFile(courseId, fileId);
    if (!file) {
        return null;
    }

    const blob = new Blob([file.data], { type: file.contentType });
    return URL.createObjectURL(blob);
}

/**
 * Get storage size estimate
 */
export async function getStorageSize(): Promise<number> {
    if (!navigator.storage || !navigator.storage.estimate) {
        return 0;
    }

    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
}

