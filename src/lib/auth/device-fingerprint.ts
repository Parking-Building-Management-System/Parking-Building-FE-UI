const DEVICE_FINGERPRINT_STORAGE_KEY = 'smartpark_device_fingerprint';
const DEVICE_LABEL_STORAGE_KEY = 'smartpark_device_label';

const DEV_DEVICE_FINGERPRINT = process.env.NEXT_PUBLIC_DEV_DEVICE_FINGERPRINT;

const DEV_DEVICE_LABEL = process.env.NEXT_PUBLIC_DEV_DEVICE_LABEL;

const isBrowser = () => typeof window !== 'undefined';

const isDevelopment = () => process.env.NODE_ENV === 'development';

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

    const browser = (() => {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Edg')) return 'Edge';
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Safari')) return 'Safari';

        return 'Browser';
    })();

    return `${platform} - ${browser}`;
};

export const getDeviceFingerprint = () => {
    if (!isBrowser()) {
        return '';
    }

    if (isDevelopment() && DEV_DEVICE_FINGERPRINT) {
        return DEV_DEVICE_FINGERPRINT;
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

export const getDeviceLabel = () => {
    if (!isBrowser()) {
        return 'Unknown Device';
    }

    if (isDevelopment() && DEV_DEVICE_LABEL) {
        return DEV_DEVICE_LABEL;
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
