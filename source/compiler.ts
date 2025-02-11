// ChatGPT helped to generate initial example of grabbing input and spitting that directly out into output with no changes
function compileCode() {
    const inputElement = document.getElementById("userInput") as HTMLTextAreaElement;
    const outputElement = document.getElementById("output") as HTMLTextAreaElement;

    const userCode = inputElement.value;
    const result = userCode;
    outputElement.value = String(result);

}

document.getElementById("compile-btn")?.addEventListener("click", compileCode);
