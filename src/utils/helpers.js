import jwt_decode from "jwt-decode";

export const GetToken = () => {
    const token = localStorage.getItem("token");
    return token;
};

export const GetUserAddress = () => {
    const token = GetToken();
    const decoded = jwt_decode(token);
    const address = decoded.address;
    return address;
};

export const TrimQuotes = (str) => {
    return str.replace(/^"|"$/g, "").replace(/\\n/g, '\n');
};
