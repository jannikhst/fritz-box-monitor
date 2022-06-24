import puppeteer, { Browser } from 'puppeteer';
import fetch from 'node-fetch';

const fritzUrl: string = process.env.FRITZ_URL!;
const user: string = process.env.FRITZ_USER!;
const password: string = process.env.FRITZ_PWD!;
const endpoint: string = process.env.SERVER_ENDPOINT!;

function timeout(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class Device {
    mac: string;
    ip: string;
    constructor(mac: string, ip: string) {
        this.ip = ip;
        this.mac = mac;
    }

    equals(other: Device): boolean {
        return (other.ip + other.mac) === (this.ip + this.mac);
    }
}

let activeDevices: Device[] = [];

async function main(): Promise<void> {
    let browser: Browser | undefined = undefined;

    browser = await puppeteer.launch({
        headless: true,
        defaultViewport: { width: 1500, height: 1000 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser!.newPage();
    await page.goto(fritzUrl, { waitUntil: 'networkidle2' });
    page.select('select#uiViewUser', user);
    await page.type('input[type="password"]', password, { delay: 5 });
    await page.click('button[type="submit"]');
    await page.waitForNetworkIdle();
    await timeout(2000);
    page.on('response', async event => {
        try {
            if (event.url().includes('data.lua')) {
                if (event.headers()['content-type'].includes('application/json')) {
                    const json = await event.json();
                    if (json.pid === 'netDev') {
                        const active = json.data.active as any[];
                        activeDevices = [];
                        for (const element of active) {
                            activeDevices.push(new Device(element.mac, element.ipv4.ip));
                        }
                        checkChanges();
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    });
    await page.click('a[id="lan"]', { delay: 1000 });
    while (true) {
        await timeout(2000);
        await page.click('a[id="net"]', { delay: 1000 });
        await timeout(40000);
        await page.click('a[id="meshNet"]', { delay: 1000 });
    }
}

let lastDeviceSnapshot: Device[] = [];

function checkChanges(): void {
    lastDeviceSnapshot.sort((a, b) => a.mac.localeCompare(b.mac));
    activeDevices.sort((a, b) => a.mac.localeCompare(b.mac));
    for (const device of activeDevices) {
        const result = lastDeviceSnapshot.find(lDevice => device.equals(lDevice));
        if (!result) {
            deviceAppeared(device);
        }
    }
    for (const lDevice of lastDeviceSnapshot) {
        const result = activeDevices.find(device => device.equals(lDevice));
        if (!result) {
            deviceDisappeared(lDevice);
        }
    }
    if (JSON.stringify(lastDeviceSnapshot) !== JSON.stringify(activeDevices)) {
        postChanges();
    }
    lastDeviceSnapshot = [...activeDevices];
}

function deviceAppeared(device: Device): void {
    console.log('Appeared', device);
}

function deviceDisappeared(device: Device): void {
    console.log('Disappeared', device);
}

async function postChanges(): Promise<void> {
    try {
        const response = await fetch(endpoint, {
            method: 'post',
            body: JSON.stringify(activeDevices),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(await response.text());
    } catch (error) {
        console.log(error);
    }
}

main();
