var _a;
// ChatGPT helped to generate 
function compileCode() {
    const inputElement = document.getElementById("userInput");
    const outputElement = document.getElementById("output");
    try {
        const userCode = inputElement.value;
        const result = eval(userCode); // ⚠️ This is just for testing; avoid using eval in production.
        outputElement.value = String(result);
    }
    catch (error) {
        outputElement.value = "Error: " + error.message;
    }
}
(_a = document.getElementById("compile-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", compileCode);
//# sourceMappingURL=compiler.js.map