import Dexie, { Table } from 'dexie';
import { UserProfile } from '../types';

export interface Settings {
    id?: number;
    apiKey?: string;
    themePreference?: 'light' | 'dark' | 'system';
}

export class RetireSmartDB extends Dexie {
    profiles!: Table<UserProfile & { id?: number }, number>;
    settings!: Table<Settings, number>;

    constructor() {
        super('RetireSmartDB');
        this.version(1).stores({
            profiles: '++id',
            settings: '++id'
        });
    }
}

export const db = new RetireSmartDB();
