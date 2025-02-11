// ChatGPT gave initial suggestion for tracking the line and position number of the input this way
function processInput() {
    const inputElement = document.getElementById("userInput") as HTMLTextAreaElement;
    const text = inputElement.value; // Get text from textarea

    const lines = text.split("\n"); // Split into lines based on line breaks
    let position = 0; // Tracks the character position

    let charList: string[] = [];    // Creates array
    let compileOutput = "";
    let errors = 0;
    let program = 1; // This will increment with each $ and print ending and then new program block
    compileOutput += `INFO Lexer - Lexing program ${program}...\n`;

    // Loops through all lines
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];

        // Traverses the line character by character
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            console.log(`  Character ${charIndex + 1} (global position ${position}): '${line[charIndex]}'`);
            charList.push(line[charIndex]); // Adds current char to array

            // Detect start of a token
            if (line[charIndex] === "$") {
                // Increment program number, print end and begin of program block and break out of loop
                compileOutput += `DEBUG Lexer -  EOP [ $ ] found on line ${lineNumber + 1}\n`;
                if (errors == 0){ // if no errors
                    compileOutput += `INFO Lexer - Lex completed with  ${errors} errors\n\n`;
                }
                else{ // if any errors present
                    compileOutput += `Error Lexer - Lex failed with  ${errors} error(s)\n\n`;
                }
                errors = 0; // reset errors
                program += 1;
                if (line[charIndex+1] == "$"){ // if two program endings in a row we have a warning
                    compileOutput += `WARNING Lexer - Warning: line ${lineNumber + 1} - Extra "$". Program will continue to execute assuming you meant to do this...\n\n`;
                }
                charList.length = 0; // end of program means end of token
                // executes only if there is more in program (either more lines or more characters on that final line)
                if (line.substring(charIndex + 1).trim().length > 0 ||  // Non-space chars after `$`
                lines.slice(lineNumber + 1).some(l => l.trim().length > 0)){ // Any remaining non-empty lines? ChatGPT helped turn this idea into code that accurately checks these conditions
                    compileOutput += `INFO Lexer - Lexing program ${program}...\n`;
                }
            } 
            else if (line[charIndex] === "{") {
                compileOutput += `DEBUG Lexer - OPEN_BLOCK [ { ] found on line ${lineNumber + 1}\n`;
            } 
            else if (line[charIndex] === "}") {
                compileOutput += `DEBUG Lexer - CLOSE_BLOCK [ } ] found on line ${lineNumber + 1}\n`; 
            }
            else if(line[charIndex] == "/" && line[charIndex+1] == "*"){ // if find start of comment, increment index until end is found
                while (line[charIndex+2] != "*" && line[charIndex+3] != "/"){
                    charIndex+=1;
                }

            }
            // else we get increment error for an invalid token (not implemented yet)

            position++; // Move to the next global character position
        }
        charList.length = 0; // Clears array to start over since tokens can't continue past newline char
        position++; // Account for the newline character
    }


    // ChatGPT helped to implement my idea that there should be an error if input doesnt end with $ or end of comment
    let trimmedText = text.replace(/\s+$/, ""); // Remove trailing spaces
    if (!(trimmedText.endsWith("$") || trimmedText.endsWith("*/"))) {
        compileOutput += `ERROR Lexer - Error: last line of program - Last character must be "$" or "*/".\n`;
        errors++;
        compileOutput += `Error Lexer - Lex failed with  ${errors} error(s)\n\n`;
    }

    compileCode(compileOutput); // Pass final output as parameter
}

// Function to display the output
function compileCode(compileOutput: string) {
    const outputElement = document.getElementById("output") as HTMLTextAreaElement;
    outputElement.value = compileOutput; // Display compiled output
}

// Attach event listener correctly
document.getElementById("compile-btn")?.addEventListener("click", processInput);
