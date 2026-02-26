export default function FormatPhoneNumber(phoneNumberString: string): string {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,3})(\d{0,3})$/);
    if (!match) return cleaned;

    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${match[1]}-${match[2]}`;
    return `${match[1]}-${match[2]}-${match[3]}`;
}

export function CleanPhoneNumber(phoneNumberString: string): string {
    return ('' + phoneNumberString).replace(/\D/g, '');
}
