const woof = `..._=,_
o_/6 /#\\
.\\__ |##/
..='|--\\
..../   #'-.
....\\#|_   _'-. /
.....|/ \\_( # |" 
....C/ ,--___/
`;

const fuck = `(•_•)
∫\\ \\___( •_•)
_∫∫ _∫∫ \\ \\`;

const meow = `. ╱|、
(˚ˎ 。7
.|、˜〵
じしˍ,)ノ`;

const lovemeow = `.∧,,,∧
( • · • )
/ づ♡`;

const commands = {
    "!woof": woof,
    "!fuck": fuck,
    "!meow": meow,
    "!lovemeow": lovemeow,
};

export const handleChatCommand = (msg) => {
    return commands[msg];
};
