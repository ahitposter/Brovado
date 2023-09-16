export const TrimQuotes = (str) => {
    return str?.replace(/^"|"$/g, "")?.replace(/\\n/g, "\n");
};

export const TimeSince = (time) => {
    const diff = Date.now() - time;
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return `${diffMinutes}m`;
};

export const TimeUntil = (time) => {
    const diff = time - Date.now();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return `${diffMinutes}m`;
};

export const EscapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

export const ConvertUrlsToLinks = (text, isMyMessage) => {
    const sanitizedText = EscapeHtml(text);
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const linkColor = isMyMessage ? "color: #ffffff;" : "color: #007aff;"; // Set the color based on the sender

    return sanitizedText.replace(urlRegex, (url) => {
        const escapedUrl = EscapeHtml(url);
        return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline; ${linkColor}">${escapedUrl}</a>`;
    });
};

export const FormatToETH = (value) => {
    return (value / 1e18).toFixed(5);
};
