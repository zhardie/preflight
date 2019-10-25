import { writable, readable } from 'svelte/store';

// Config
export const apiHost = readable('https://preflight-zhardie.appspot.com');
export const apiHeaders = readable({
    'Content-Type': 'application/json'
});
// End Config

export const credentials = writable(false);
export const username = writable('');