import Dexie, { Table } from 'dexie';
import { UserProfile } from '../types';

export interface Settings {
    id?: number;
    apiKey?: string;
    themePreference?: 'light' | 'dark' | 'system';
}

export class FiscalSunsetDB extends Dexie {
    profiles!: Table<UserProfile & { id?: number }, number>;
    settings!: Table<Settings, number>;

    constructor() {
        super('FiscalSunsetDB');
        this.version(1).stores({
            profiles: '++id',
            settings: '++id'
        });
    }
}

export const db = new FiscalSunsetDB();
