// ChatGPT helped to generate 
function compileCode() {
    const inputElement = document.getElementById("userInput") as HTMLTextAreaElement;
    const outputElement = document.getElementById("output") as HTMLTextAreaElement;

    try {
        const userCode = inputElement.value;
        const result = eval(userCode); // ⚠️ This is just for testing; avoid using eval in production.
        outputElement.value = String(result);
    } catch (error) {
        outputElement.value = "Error: " + error.message;
    }
}

document.getElementById("compile-btn")?.addEventListener("click", compileCode);
