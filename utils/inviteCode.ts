/**
 * Generates a cryptographically secure invite code for private matches
 * @returns A 12-character alphanumeric invite code
 */
export function generateInviteCode(): string {
    // Use characters that are unambiguous (exclude 0, O, I, 1, etc.)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const array = new Uint8Array(12);

    // Use crypto.getRandomValues for cryptographically secure randomness
    crypto.getRandomValues(array);

    for (let i = 0; i < 12; i++) {
        code += chars[array[i] % chars.length];
    }

    return code;
}

/**
 * Formats an invite link for a private match
 * @param inviteCode The unique invite code for the match
 * @returns Full invite URL
 */
export function formatInviteLink(inviteCode: string): string {
    return `${window.location.origin}?invite=${inviteCode}`;
}
