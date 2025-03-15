// ChatGPT gave initial suggestion for tracking the line and position number of the input this way, also utilized for parser

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
                    // Display the CST if no errors occurred:
                    compileOutput += "\nCST for program:\n" + result.tree.print();
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
                lines.slice(lineNumber + 1).some(l => l.trim().length > 0)){ // Any remaining non-empty lines?
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
                            tokens.push({ type: "CHAR", lexeme: line[charIndex], line: lineNumber + 1, column: charIndex + 1 });
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
                tokens.push({ type: "DIGIT", lexeme: line[charIndex], line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - digit [ ${line[charIndex]} ] found on line ${lineNumber + 1}\n`;
            }

            else if (line[charIndex] >= "a" && line[charIndex] <= "z") { // ChatGPT reminded me of how to make sure value was a letter between a and z
                // This character is a lowercase letter
                tokens.push({ type: "ID", lexeme: line[charIndex], line: lineNumber + 1, column: charIndex + 1 });
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

    // Helper to peek at the current token without consuming it
    private peekToken(): Token | null {
        return this.current < this.tokens.length ? this.tokens[this.current] : null;
    }


    // Starts parsing the program
    public parse(): { output: string, tree: CST, error: string | null } {
        this.output += "PARSER --> parseProgram()\n";
        this.parseProgram();
        return { output: this.output, tree: this.cst, error: null };
    }

    private parseProgram() {
        this.cst.addNode("branch", "Program");
        this.parseBlock();
        // Assume matchToken checks that the current token is an EOP marker and advances the token index
        this.match("EOP");
        this.cst.moveUp();
        // build CST node for Program
        // call parseBlock(), then expect the EOP token
    }

    // Implement parseBlock, parseStatementList, etc.
    private match(expected: string) {
        const token = this.tokens[this.current];
        if (token && token.type === expected) {
            // add node to CST
            this.cst.addNode("leaf", token.lexeme);
            // increase the token index
            this.current++;
        } else {
            // report error with details
            throw new Error(`PARSER ERROR: Expected ${expected} but got ${token ? token.lexeme: "EOF"} at line ${token?.line}`);
        }
    }

    // Block ::= { StatementList }
    private parseBlock(): void {
        this.output += "PARSER --> parseBlock()\n";
        this.cst.addNode("branch", "Block");
        this.match("LBRACE");
        this.parseStatementList();
        this.match("RBRACE");
        this.cst.moveUp();
    }

    // StatementList ::= Statement StatementList | ε
    private parseStatementList(): void {
        this.output += "PARSER --> parseStatementList()\n";
        this.cst.addNode("branch", "StatementList");
        const token = this.peekToken();
        if (token && (token.type === "RBRACE" || token.type === "EOP")) {
            // Epsilon production
            this.cst.addNode("leaf", "ε");
        } else {
            this.parseStatement();
            this.parseStatementList();
        }
        this.cst.moveUp();
    }

    // Statement ::= PrintStatement | AssignmentStatement | VarDecl | WhileStatement | IfStatement | Block
    private parseStatement(): void {
        this.output += "PARSER --> parseStatement()\n";
        this.cst.addNode("branch", "Statement");
        const token = this.peekToken();
        if (!token) {
            throw new Error("PARSER ERROR: Unexpected end of input in parseStatement");
        }
        if (token.type === "PRINT") {
            this.parsePrintStatement();
        } else if (token.type === "IFSTATEMENT") {
            this.parseIfStatement();
        } else if (token.type === "WHILE") {
            this.parseWhileStatement();
        } else if (token.type === "ITYPE") {
            this.parseVarDecl();
        } else if (token.type === "ID") {
            this.parseAssignmentStatement();
        } else if (token.type === "LBRACE") {
            this.parseBlock();
        } else {
            throw new Error(`PARSER ERROR: Unexpected token ${token.lexeme} at line ${token.line} in parseStatement`);
        }
        this.cst.moveUp();
    }

    // PrintStatement ::= print ( Expr )
    private parsePrintStatement(): void {
        this.output += "PARSER --> parsePrintStatement()\n";
        this.cst.addNode("branch", "PrintStatement");
        this.match("PRINT");
        this.match("LPAREN");
        this.parseExpr();
        this.match("RPAREN");
        this.cst.moveUp();
    }

    // AssignmentStatement ::= ID = Expr
    private parseAssignmentStatement(): void {
        this.output += "PARSER --> parseAssignmentStatement()\n";
        this.cst.addNode("branch", "AssignmentStatement");
        this.match("ID");
        this.match("ASSIGN_OP");
        this.parseExpr();
        this.cst.moveUp();
    }

    // VarDecl ::= ITYPE ID
    private parseVarDecl(): void {
        this.output += "PARSER --> parseVarDecl()\n";
        this.cst.addNode("branch", "VarDecl");
        this.match("ITYPE");
        this.match("ID");
        this.cst.moveUp();
    }

    // WhileStatement ::= while BooleanExpr Block
    private parseWhileStatement(): void {
        this.output += "PARSER --> parseWhileStatement()\n";
        this.cst.addNode("branch", "WhileStatement");
        this.match("WHILE");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.moveUp();
    }

    // IfStatement ::= if BooleanExpr Block
    private parseIfStatement(): void {
        this.output += "PARSER --> parseIfStatement()\n";
        this.cst.addNode("branch", "IfStatement");
        this.match("IFSTATEMENT");
        this.parseBooleanExpr();
        this.parseBlock();
        this.cst.moveUp();
    }

    // Expr ::= IntExpr | StringExpr | BooleanExpr | ID
    private parseExpr(): void {
        this.output += "PARSER --> parseExpr()\n";
        this.cst.addNode("branch", "Expr");
        const token = this.peekToken();
        if (!token) {
            throw new Error("PARSER ERROR: Unexpected end of input in parseExpr");
        }
        if (token.type === "DIGIT") {
            this.parseIntExpr();
        } else if (token.type === "LQUOTE") {
            this.parseStringExpr();
        } else if (token.type === "LPAREN") {
            this.parseBooleanExpr();
        } else if (token.type === "ID") {
            this.match("ID");
        } else {
            throw new Error(`PARSER ERROR: Unexpected token ${token.lexeme} at line ${token.line} in parseExpr`);
        }
        this.cst.moveUp();
    }

    // IntExpr ::= DIGIT [INTOP Expr]?
    private parseIntExpr(): void {
        this.output += "PARSER --> parseIntExpr()\n";
        this.cst.addNode("branch", "IntExpr");
        this.match("DIGIT");
        const token = this.peekToken();
        if (token && token.type === "INTOP") {
            this.match("INTOP");
            this.parseExpr();
        }
        this.cst.moveUp();
    }

    // StringExpr ::= " CharList "
    private parseStringExpr(): void {
        this.output += "PARSER --> parseStringExpr()\n";
        this.cst.addNode("branch", "StringExpr");
        this.match("LQUOTE");
        this.parseCharList();
        this.match("RQUOTE");
        this.cst.moveUp();
    }

    // BooleanExpr ::= ( Expr BoolOp Expr ) | BOOLVALT | BOOLVALF
    private parseBooleanExpr(): void {
        this.output += "PARSER --> parseBooleanExpr()\n";
        this.cst.addNode("branch", "BooleanExpr");
        const token = this.peekToken();
        if (token && token.type === "LPAREN") {
            this.match("LPAREN");
            this.parseExpr();
            this.parseBoolOp();
            this.parseExpr();
            this.match("RPAREN");
        } else if (token && (token.type === "BOOLVALT" || token.type === "BOOLVALF")) {
            this.match(token.type);
        } else {
            throw new Error(`PARSER ERROR: Expected BooleanExpr but got ${token ? token.lexeme : "EOF"} at line ${token?.line}`);
        }
        this.cst.moveUp();
    }

    // BoolOp ::= BOOL_EQUAL | BOOL_INEQUAL
    private parseBoolOp(): void {
        this.output += "PARSER --> parseBoolOp()\n";
        this.cst.addNode("branch", "BoolOp");
        const token = this.peekToken();
        if (token && (token.type === "BOOL_EQUAL" || token.type === "BOOL_INEQUAL")) {
            this.match(token.type);
        } else {
            throw new Error(`PARSER ERROR: Expected boolean operator but got ${token ? token.lexeme : "EOF"} at line ${token?.line}`);
        }
        this.cst.moveUp();
    }

    // CharList ::= CHAR CharList | ε
    private parseCharList(): void {
        this.output += "PARSER --> parseCharList()\n";
        this.cst.addNode("branch", "CharList");
        const token = this.peekToken();
        if (token && token.type === "CHAR") {
            this.match("CHAR");
            this.parseCharList();
        } else {
            // epsilon production
            this.cst.addNode("leaf", "ε");
        }
        this.cst.moveUp();
    }

}

// Represents a node in the CST
class CSTNode {
    label: string;
    children: CSTNode[];
    parent: CSTNode | null;

    constructor(label: string) {
        this.label = label;
        this.children = [];
        this.parent = null;
    }
}

// Represents the entire CST
class CST {
    root: CSTNode | null;
    current: CSTNode | null;

    constructor() {
        this.root = null;
        this.current = null;
    }

    // Add a node to the CST, kind indicates whether it is a branch (non-terminal) or a leaf (terminal). For branches, we update the current node.
    addNode(kind: "branch" | "leaf", label: string): void {
        const newNode = new CSTNode(label);

        if (this.root === null) {
            // This is the root of the tree
            this.root = newNode;
            this.current = newNode;
        } else {
            if (this.current) {
                newNode.parent = this.current;
                this.current.children.push(newNode);
            }
            // Only change the current node if it is a branch
            if (kind === "branch") {
                this.current = newNode;
            }
        }
    }

    // After finishing a non-terminal rule, move up to the parent node
    moveUp(): void {
        if (this.current && this.current.parent) {
            this.current = this.current.parent;
        }
    }

    // A helper function to print the tree as a formatted string (for display)
    print(node: CSTNode | null = this.root, indent: string = ""): string {
        if (!node) return "";
        let result = indent + `<${node.label}>\n`;
        for (const child of node.children) {
            result += this.print(child, indent + "  ");
        }
        return result;
    }
}


// Function to display the output
function compileCode(compileOutput: string) {
    const outputElement = document.getElementById("output") as HTMLTextAreaElement;
    outputElement.value = compileOutput; // Display compiled output
}

// This function encapsulates your lexing loop for a single program (the text before the '$' marker).
function lexProgram(progText: string): { tokens: Token[], output: string, errors: number } {
    tokens = [];
    let compileOutput = "DEBUG: Running in verbose mode \n\n";
    let errors = 0;
    const lines = progText.split("\n");
    let position = 0;
    let charList: string[] = [];
    // Use your existing lexing loop here.
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        const line = lines[lineNumber];
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
            console.log(`  Character ${charIndex + 1} (global position ${position}): '${line[charIndex]}'`);
            charList.push(line[charIndex]);
            if (line[charIndex] === "{") {
                tokens.push({ type: "LBRACE", lexeme: "{", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - OPEN_BLOCK [ { ] found on line ${lineNumber + 1}\n`;
            } else if (line[charIndex] === "}") {
                tokens.push({ type: "RBRACE", lexeme: "}", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - CLOSE_BLOCK [ } ] found on line ${lineNumber + 1}\n`;
            } else if (line.substring(charIndex, charIndex + 5) === "print") {
                charIndex += 4;
                tokens.push({ type: "PRINT", lexeme: "print", line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - PRINT [ print ] found on line ${lineNumber + 1}\n`;
            } else if (line[charIndex] >= "a" && line[charIndex] <= "z") {
                tokens.push({ type: "ID", lexeme: line[charIndex], line: lineNumber + 1, column: charIndex + 1 });
                compileOutput += `DEBUG Lexer - ID [ ${line[charIndex]} ] found on line ${lineNumber + 1}\n`;
            } else {
                errors++;
                compileOutput += `ERROR Lexer - Error: line ${lineNumber + 1} Unrecognized Token: ${line[charIndex]}\n`;
            }
            position++;
        }
        charList.length = 0;
        position++;
    }
    return { tokens: tokens, output: compileOutput, errors: errors };
}


// Splits the input into programs (delimited by '$'), lexes each, and if valid, parses it and builds a CST.
function processPrograms() {
    const inputElement = document.getElementById("userInput") as HTMLTextAreaElement;
    const text = inputElement.value.trim();
    if (!text.endsWith("$")) {
        compileCode(`ERROR: Last character of input must be "$".\n`);
        return;
    }
    // Split the input into separate programs.
    const programs = text.split("$").map(p => p.trim()).filter(p => p.length > 0);
    let finalOutput = "DEBUG: Running in verbose mode \n\n";
    let programNumber = 1;
    for (const progText of programs) {
        // Lex this program.
        const lexResult = lexProgram(progText);
        let compileOutput = `INFO Lexer - Lexing program ${programNumber}...\n` + lexResult.output;
        if (lexResult.errors > 0) {
            compileOutput += `Error Lexer - Lex failed with ${lexResult.errors} error(s)\n\n`;
        } else {
            compileOutput += `INFO Lexer - Lex completed with ${lexResult.errors} errors\n\n`;
            try {
                const parser = new Parser(lexResult.tokens);
                const result = parser.parse();
                compileOutput += result.output;
                compileOutput += "\nCST for program " + programNumber + ":\n" + result.tree.print();
            } catch (parseError) {
                compileOutput += "\nPARSER ERROR: " + parseError;
                console.error(parseError);
            }
        }
        finalOutput += compileOutput + "\n";
        programNumber++;
    }
    compileCode(finalOutput);
}


// Ensure the DOM is fully loaded before attaching the event listener, suggested by ChatGPT
document.addEventListener("DOMContentLoaded", () => {
    const compileBtn = document.getElementById("compile-btn");
    if (!compileBtn) {
      console.error("Compile button not found! Check that the id is 'compile-btn' in your HTML.");
      return;
    }
    
    compileBtn.addEventListener("click", () => {
      try {
        // Instead of calling lexer(), now call processPrograms()
        processPrograms();
      } catch (err) {
        console.error("Compilation error:", err);
        compileCode("Compilation error: " + err);
      }
    });
});
