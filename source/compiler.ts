// ChatGPT gave initial suggestion for tracking the line and position number of the input this way
function processInput() {
    const inputElement = document.getElementById("input-code") as HTMLTextAreaElement;
    const text = inputElement.value; // Get text from textarea

    const lines = text.split("\n"); // Split into lines based on line breaks
    let position = 0; // Tracks the character position

    let charList: string[] = [];    //creates array
    let compileOutput = "";
    let program = 1; // this will increment with each $ and print ending and then new program block
    compileOutput += "INFO Lexer - Lexing program 1...";
    // loops through all lines
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];

        console.log(`Line ${lineNumber + 1}, starts at position ${position}: "${line}"`);

        // Traverses the line character by character
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            console.log(`  Character ${charIndex + 1} (global position ${position}): '${line[charIndex]}'`);
            charList.push(line[charIndex]);    // adds current char to array

            // this is how we are at beginning of a token
            if (line[charIndex] == "$"){ //check to see if fits token options
                // increment program number, print end and begin of program block and break out of loop
            }
            else if (charList[0] == "{"){
                compileOutput += "{"
            }
            // else we get an error for invalid token
            else{

            }

            position++; // Move to the next global character position
        }
        charList.length = 0;   // clears array to start over since token can't continue past newline char
        position++; // Account for the newline character
    }
    compileCode(compileOutput); // pass final output as parameter
}

// ChatGPT helped to generate initial example of grabbing input and spitting that directly out into output with no changes
function compileCode(compileOutput) {
    const outputElement = document.getElementById("output") as HTMLTextAreaElement;
    const result = compileOutput; // This outputs results of compiler
    outputElement.value = String(result);
}

// Attach event listeners correctly
document.getElementById("compile-btn")?.addEventListener("click", processInput);
document.getElementById("compile-btn")?.addEventListener("click", compileCode);
