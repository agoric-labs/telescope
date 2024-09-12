"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinia = void 0;
exports.pinia = `
import { defineStore } from "pinia";
import type { LCDClient } from '@cosmology/lcd';

export const useEndpoint = defineStore('pinia.endpoint', {
    state: () => {
        return {
            restClient: {} as LCDClient,
        }
    },
    actions: {
        setRestClient(client: LCDClient) {
            this.restClient = client
        }
    }
})
`;
