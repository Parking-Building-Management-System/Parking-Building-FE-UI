const DEVICE_FINGERPRINT_STORAGE_KEY = 'smartpark_device_fingerprint';
const DEVICE_LABEL_STORAGE_KEY = 'smartpark_device_label';

const DEMO_DEVICES = [
    {
        username: 'system.admin@smartpark.local',
        fingerprint: 'seed-system-admin-device',
        label: 'Seed System Admin Device',
    },
    {
        username: 'manager@demo-parking.local',
        fingerprint: 'seed-manager-device',
        label: 'Seed Parking Manager Device',
    },
    {
        username: 'staff@demo-parking.local',
        fingerprint: 'seed-staff-device',
        label: 'Seed Staff Device',
    },
    {
        username: 'driver@demo-parking.local',
        fingerprint: 'seed-driver-device',
        label: 'Seed Parking User Device',
    },
] as const;

const isBrowser = () => typeof window !== 'undefined';

const normalizeUsername = (username?: string | null) => {
    return username?.trim().toLowerCase() ?? '';
};

const getDemoDeviceByUsername = (username?: string | null) => {
    const normalizedUsername = normalizeUsername(username);

    if (!normalizedUsername) {
        return null;
    }

    return (
        DEMO_DEVICES.find(
            (device) => device.username.toLowerCase() === normalizedUsername,
        ) ?? null
    );
};

const createDeviceFingerprint = () => {
    if (crypto?.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createDeviceLabel = () => {
    if (!isBrowser()) {
        return 'Unknown Device';
    }

    const platform = navigator.platform || 'Unknown Platform';
    const userAgent = navigator.userAgent;

    const browser = (() => {
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Edg')) return 'Edge';
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Safari')) return 'Safari';

        return 'Browser';
    })();

    return `${platform} - ${browser}`;
};

export const getDeviceFingerprint = (username?: string | null) => {
    if (!isBrowser()) {
        return '';
    }

    const demoDevice = getDemoDeviceByUsername(username);

    if (demoDevice) {
        return demoDevice.fingerprint;
    }

    const storedFingerprint = localStorage.getItem(
        DEVICE_FINGERPRINT_STORAGE_KEY,
    );

    if (storedFingerprint) {
        return storedFingerprint;
    }

    const fingerprint = createDeviceFingerprint();

    localStorage.setItem(DEVICE_FINGERPRINT_STORAGE_KEY, fingerprint);

    return fingerprint;
};

export const getDeviceLabel = (username?: string | null) => {
    if (!isBrowser()) {
        return 'Unknown Device';
    }

    const demoDevice = getDemoDeviceByUsername(username);

    if (demoDevice) {
        return demoDevice.label;
    }

    const storedLabel = localStorage.getItem(DEVICE_LABEL_STORAGE_KEY);

    if (storedLabel) {
        return storedLabel;
    }

    const label = createDeviceLabel();

    localStorage.setItem(DEVICE_LABEL_STORAGE_KEY, label);

    return label;
};

export const resetDeviceFingerprint = () => {
    if (!isBrowser()) {
        return;
    }

    localStorage.removeItem(DEVICE_FINGERPRINT_STORAGE_KEY);
    localStorage.removeItem(DEVICE_LABEL_STORAGE_KEY);
};
