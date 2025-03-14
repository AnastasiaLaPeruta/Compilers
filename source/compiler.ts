// ChatGPT gave initial suggestion for tracking the line and position number of the input this way, also utilized for getting started on parser

interface Token {
    type: string;
    lexeme: string;
    line: number;
    column: number;
}

let tokens: Token[] = [];

function lexer() {
    const inputElement = document.getElementById("userInput") as HTMLTextAreaElement;
    const text = inputElement.value; // Get text from textarea

    const lines = text.split("\n"); // Split into lines based on line breaks
    let position = 0; // Tracks the character position

    let charList: string[] = [];    // Creates array
    let compileOutput = "";
    let errors = 0;
    compileOutput += 'DEBUG: Running in verbose mode \n\n';
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
                tokens.push({ type: "EOP", lexeme: "$", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer -  EOP [ $ ] found on line ${lineNumber + 1}\n`;
                if (errors == 0){ // if no errors
                    compileOutput += `INFO Lexer - Lex completed with  ${errors} errors\n\n`;
                    const parser = new Parser(tokens);
                    const result = parser.parse();
                    compileOutput += result.output;
                    // display the CST if no errors occurred
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
                tokens.push({ type: "LBRACE", lexeme: "{", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - OPEN_BLOCK [ { ] found on line ${lineNumber + 1}\n`;
            } 
            else if (line[charIndex] === "}") {
                tokens.push({ type: "RBRACE", lexeme: "}", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - CLOSE_BLOCK [ } ] found on line ${lineNumber + 1}\n`; 
            }
            //ChatGPT provided this method rather than the indefinite loop I realized I had that did not report unterminated comment error
            else if (line[charIndex] == "/" && line[charIndex + 1] == "*") { 
                let commentClosed = false; // Track if `*/` is found
                charIndex += 2; // Move past `/*`
            
                while (lineNumber < lines.length) { // Loop through lines
                    while (charIndex < lines[lineNumber].length - 1) { // Loop through characters
                        if (lines[lineNumber][charIndex] === "*" && lines[lineNumber][charIndex + 1] === "/") {
                            commentClosed = true; // Found closing `*/`
                            charIndex++; // Move past `*/`
                            break;
                        }
                        charIndex++; // Continue scanning inside the comment
                    }
            
                    if (commentClosed) break; // Exit loop if `*/` was found
                    
                    lineNumber++; // Move to the next line
                    charIndex = 0; // Reset char position for new line
                }
            
                // If the comment was never closed, add an error and **STOP LEXING**
                if (!commentClosed) {
                    errors+=1;
                    compileOutput += `ERROR Lexer - Error: Unterminated comment starting on line ${lineNumber + 1}. Lexing terminated due to fatal error. Please add '*/' to end your comment.\n`;
                    compileOutput += `Error Lexer - Lex failed with  ${errors} error(s)\n\n`;
                    compileCode(compileOutput); // Output immediately
                    return; // **STOP all further processing**
                }
            }
            
            // checks for every other valid token now

            // print check
            else if (line.substring(charIndex, charIndex + 5) === "print") {

                charIndex += 4; // Move past `print`
                tokens.push({ type: "PRINT", lexeme: "print", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - PRINT [ print ] found on line ${lineNumber + 1}\n`;
            
            }
            
            else if(line[charIndex] == "=" && line[charIndex+1] == "="){
                tokens.push({ type: "BOOL_EQUAL", lexeme: "==", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - BOOL_EQUAL [ == ] found on line ${lineNumber + 1}\n`;
                charIndex ++;
            }

            else if(line[charIndex] == "="){ // don't have to worry about == because it checks for that before this case
                tokens.push({ type: "ASSIGN_OP", lexeme: "=", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - ASSIGN_OP [ = ] found on line ${lineNumber + 1}\n`;
            }

            else if(line[charIndex] == "!" && line[charIndex+1] == "="){
                tokens.push({ type: "BOOL_INEQUAL", lexeme: "!=", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - BOOL_INEQUAL [ != ] found on line ${lineNumber + 1}\n`;
                charIndex ++;
            }

           
            // makes sure quotes get closed
             else if (line[charIndex] === '"') { 
                 let quoteClosed = false; // Track if `"` is found
                 let quoteStartLine = lineNumber + 1; // Store where `"` starts
                 charIndex ++; // Move past `"`
                 tokens.push({ type: "LQUOTE", lexeme: '"', line: lineNumber + 1, column: charIndex + 1 });
                 compileOutput += `DEBUG Lexer - StringExpr [ start " ] found on line ${lineNumber + 1}\n`;
                 while (lineNumber < lines.length) { // Loop through lines
                     while (charIndex < lines[lineNumber].length) { // Loop through characters
                         if (lines[lineNumber][charIndex] === '"') {
                             quoteClosed = true; // Found closing `"`
                             tokens.push({ type: "RQUOTE", lexeme: '"', line: lineNumber + 1, column: charIndex + 1 });
                             compileOutput += `DEBUG Lexer - StringExpr [ end " ] found on line ${lineNumber + 1}\n`;
                             break;
                         }
                         // prints out each character within the quotes only if it is a space or lowercase a-z
                         if (line[charIndex] >= "a" && line[charIndex] <= "z" || line[charIndex] == " "){
                            tokens.push({ type: "CHAR", lexeme: "${lines[lineNumber][charIndex]}", line: lineNumber + 1, column: charIndex + 1 });
                            compileOutput += `DEBUG Lexer - Char [ ${lines[lineNumber][charIndex]} ] found on line ${lineNumber + 1}\n`;
                         } 
                         else {
                                compileOutput += `ERROR Lexer - Error: line ${lineNumber + 1} Unrecognized Token: ${line[charIndex]} Only lowercase letters a through z and spaces are allowed in strings \n`;
                                compileOutput += `Error Lexer - Lex failed with ${errors + 1} errors\n\n`;
                                compileCode(compileOutput); // Output immediately
                                return; // **STOP all further processing**
                         }
                         charIndex++; // Continue scanning inside ""
                     }
             
                     if (quoteClosed) 
                        // if quote found a different line, must throw an error
                        if (lineNumber > quoteStartLine){
                            compileOutput += `ERROR Lexer - Error: Unterminated StringExpr starting on line ${quoteStartLine}. Lexing terminated due to fatal error. End of " must be on same line as start.\n`;
                            compileOutput += `Error Lexer - Lex failed with ${errors + 1} errors\n\n`;
                            compileCode(compileOutput); // Output immediately
                            return; // **STOP all further processing**
                        }
                        break; // Exit loop if `"` was found
                     
                     lineNumber++; // Move to the next line
                     charIndex = 0; // Reset char position for new line
                 }
             
                 // If `"` was never closed, add an error and STOP LEXING
                 if (!quoteClosed) {
                     compileOutput += `ERROR Lexer - Error: Unterminated StringExpr starting on line ${quoteStartLine}. Lexing terminated due to fatal error.\n`;
                     compileOutput += `Error Lexer - Lex failed with ${errors + 1} errors\n\n`;
                     compileCode(compileOutput); // Output immediately
                     return; // **STOP all further processing**
                 }
             }

            
            else if (line[charIndex] === '(') {   
                tokens.push({ type: "LPAREN", lexeme: "(", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - StartParen [ ( ] found on line ${lineNumber + 1}\n`;
            }

            else if (line[charIndex] === ')') {  
                tokens.push({ type: "RPAREN", lexeme: ")", line: lineNumber + 1, column: charIndex + 1 }); 
                compileOutput += `DEBUG Lexer - CloseParen [ ) ] found on line ${lineNumber + 1}\n`;
            }

            else if(line[charIndex] == "+"){
                tokens.push({ type: "INTOP", lexeme: "+", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - intop [ + ] found on line ${lineNumber + 1}\n`;
            }

            else if(line[charIndex] == "w" && line[charIndex+1] == "h" && line[charIndex+2] == "i" && line[charIndex+3] == "l" &&
                line[charIndex+4] == "e")
            {
                tokens.push({ type: "WHILE", lexeme: "while", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - WhileStatement [ while ] found on line ${lineNumber + 1}\n`;
                charIndex+=4;
            }

            else if(line[charIndex] == "s" && line[charIndex+1] == "t" && line[charIndex+2] == "r" && line[charIndex+3] == "i" &&
                line[charIndex+4] == "n" && line[charIndex+5] == "g" )
            {
                compileOutput += `DEBUG Lexer - I_TYPE [ string ] found on line ${lineNumber + 1}\n`;
                charIndex+=5;
            }

            else if(line[charIndex] == "b" && line[charIndex+1] == "o" && line[charIndex+2] == "o" && line[charIndex+3] == "l" &&
                line[charIndex+4] == "e" && line[charIndex+5] == "a" && line[charIndex+6] == "n" )
            {
                tokens.push({ type: "ITYPE", lexeme: "boolean", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - I_TYPE [ boolean ] found on line ${lineNumber + 1}\n`;
                charIndex+=6;
            }

            else if(line[charIndex] == "i" && line[charIndex+1] == "n" && line[charIndex+2] == "t" )
            {
                tokens.push({ type: "ITYPE", lexeme: "int", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - I_TYPE [ int ] found on line ${lineNumber + 1}\n`;
                charIndex+=2;
            }

            else if(line[charIndex] == "i" && line[charIndex+1] == "f")
                {
                    tokens.push({ type: "IFSTATEMENT", lexeme: "if", line: lineNumber + 1, column: charIndex + 1 });
                    compileOutput += `DEBUG Lexer - IfStatement [ if ] found on line ${lineNumber + 1}\n`;
                    charIndex+=1;
                }


            else if(line[charIndex] == "f" && line[charIndex+1] == "a" && line[charIndex+2] == "l" && line[charIndex+3] == "s" &&
                    line[charIndex+4] == "e")
                {
                    tokens.push({ type: "BOOLVALF", lexeme: "false", line: lineNumber + 1, column: charIndex + 1 });
                    compileOutput += `DEBUG Lexer - boolval_F [ false ] found on line ${lineNumber + 1}\n`;
                    charIndex+=4;
                }

            else if(line[charIndex] == "t" && line[charIndex+1] == "r" && line[charIndex+2] == "u" && line[charIndex+3] == "e")
                {
                    tokens.push({ type: "BOOLVALT", lexeme: "true", line: lineNumber + 1, column: charIndex + 1 });
                    compileOutput += `DEBUG Lexer - boolval_T [ true ] found on line ${lineNumber + 1}\n`;
                    charIndex+=3;
                }

            else if (line[charIndex] == " "){
                // ignores spaces
            }

            // any int 0-9
            else if (+line[charIndex] == 0 || +line[charIndex] == 1 || +line[charIndex] == 2 || +line[charIndex] == 3 || +line[charIndex] == 4
                 || +line[charIndex] == 5 || +line[charIndex] == 6 || +line[charIndex] == 7 || +line[charIndex] == 8 || +line[charIndex] == 9
            ){
                tokens.push({ type: "DIGIT", lexeme: "${line[charIndex]}", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - digit [ ${line[charIndex]} ] found on line ${lineNumber + 1}\n`;
            }

            else if (line[charIndex] >= "a" && line[charIndex] <= "z") { // ChatGPT reminded me of how to make sure value was a letter between a and z
                // This character is a lowercase letter
                tokens.push({ type: "ID", lexeme: "${line[charIndex]}", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - ID [ ${line[charIndex]} ] found on line ${lineNumber + 1}\n`;
            }
            

            // else we get increment error for an invalid token
            else {
                errors ++;
                compileOutput += `ERROR Lexer - Error: line ${lineNumber + 1} Unrecognized Token: ${line[charIndex]} Please reference grammar guide for this language. Perhaps you tried to type an invalid character outside of the letters a through z? \n`;
            }

            position++; // Move to the next global character position
        }
        charList.length = 0; // Clears array to start over since tokens can't continue past newline char
        position++; // Account for the newline character
    }


    // ChatGPT helped to implement my idea that there should be an error if input doesnt end with $
    let trimmedText = text.replace(/\s+$/, ""); // Remove trailing spaces
    if (!(trimmedText.endsWith("$"))) {
        compileOutput += `ERROR Lexer - Error: last line of program - Please complete program with "$" as your last character.\n`;
        errors++;
        compileOutput += `Error Lexer - Lex failed with  ${errors} error(s)\n\n`;
        compileCode(compileOutput); // Output immediately
        return; // **STOP all further processing**
    }


    compileCode(compileOutput); // Pass final output as parameter


}

class Parser {
    private tokens: Token[];
    private current: number = 0;
    public output: string = "";
    public cst: CST; 

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.cst = new CST();
    }

    public parse(): { output: string, tree: CST, error: string | null } {
        this.output += "PARSER --> execute()\n";
        this.parseProgram();
        return { output: this.output, tree: this.cst, error: null /* or error details */ };
    }

    private parseProgram() {
        this.output += "PARSER --> parseProgram()\n";
        // build CST node for Program
        // call parseBlock(), then expect the EOP token
    }

    // Implement parseBlock, parseStatementList, etc.
    private match(expected: string) {
        const token = this.tokens[this.current];
        if (token && token.type === expected) {
            // add node to CST
            this.current++;
        } else {
            // report error with details
            throw new Error(`Expected ${expected} but got ${token?.lexeme} at line ${token?.line}`);
        }
    }
}


// Function to display the output
function compileCode(compileOutput: string) {
    const outputElement = document.getElementById("output") as HTMLTextAreaElement;
    outputElement.value = compileOutput; // Display compiled output
}

// Attach event listener correctly
document.getElementById("compile-btn")?.addEventListener("click", lexer);