import jwt_decode from "jwt-decode";

export const GetToken = () => {
    const token = sessionStorage.getItem("selectedToken");
    return token;
};

export const GetUserAddress = () => {
    const token = GetToken();
    const decoded = jwt_decode(token);
    const address = decoded.address;
    return address;
};

export const TrimQuotes = (str) => {
    return str?.replace(/^"|"$/g, "")?.replace(/\\n/g, "\n");
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
