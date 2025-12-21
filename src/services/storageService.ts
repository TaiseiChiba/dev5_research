/**
 * ストレージサービス
 *
 * LocalStorageを使用したデータ永続化を提供します。
 */

/**
 * データをLocalStorageから取得
 */
export function getStorageData<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading from localStorage for key ${key}:`, error);
    return [];
  }
}

/**
 * データをLocalStorageに保存
 */
export function setStorageData<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage for key ${key}:`, error);
    throw new Error(`Failed to save data to storage: ${error}`);
  }
}

/**
 * 単一のオブジェクトをLocalStorageから取得
 */
export function getStorageObject<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(
      `Error reading object from localStorage for key ${key}:`,
      error
    );
    return null;
  }
}

/**
 * 単一のオブジェクトをLocalStorageに保存
 */
export function setStorageObject<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(
      `Error writing object to localStorage for key ${key}:`,
      error
    );
    throw new Error(`Failed to save object to storage: ${error}`);
  }
}

/**
 * LocalStorageからデータを削除
 */
export function removeStorageData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage for key ${key}:`, error);
  }
}

/**
 * 一意IDを生成
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random.toString().padStart(3, '0')}`;
}

/**
 * 日付文字列をDateオブジェクトに変換（LocalStorageから取得したデータ用）
 */
export function reviveDates<T>(obj: T): T {
  const dateFields = [
    'createdAt',
    'updatedAt',
    'verifiedAt',
    'confirmedAt',
    'expiresAt',
    'performedAt',
    'lastUpdated',
  ];

  const result = { ...obj } as any;

  for (const field of dateFields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field] as string);
    }
  }

  return result as T;
}

/**
 * 配列内の全オブジェクトの日付を復元
 */
export function reviveDatesInArray<T>(array: T[]): T[] {
  return array.map(item => reviveDates(item));
}
