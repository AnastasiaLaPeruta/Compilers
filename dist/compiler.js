var _a;
// ChatGPT helped to generate initial example of grabbing input and spitting that directly out into output with no changes
function compileCode() {
    const inputElement = document.getElementById("userInput");
    const outputElement = document.getElementById("output");
    const userCode = inputElement.value;
    const result = userCode;
    outputElement.value = String(result);
}
(_a = document.getElementById("compile-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", compileCode);
//# sourceMappingURL=compiler.js.map