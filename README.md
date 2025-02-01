# Compilers


This repository holds a compiler written in TypeScript and executed in Node.js. It allows users to enter code into a text area (inside `index.html`), processes it using the compiled JavaScript held in the dist folder, and displays the result in an output area. This README will explain how to build and deploy this code in detail.



Files are organized as such:
Compilers/ 
    source/ # Contains TypeScript files (source code of the compiler) 
    dist/ # Compiled JavaScript files will be placed here 
    index.html # provides a graphical user interface (GUI) for interacting with the compiler through input & output 
    tsconfig.json # TypeScript configuration 
    README.md # This document



Before running the project:

1. Node must be installed (https://nodejs.org/en/download). 

2. TypeScript must be installed.

3. In the terminal run "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass" and then "tsc" (tsc will compile the TypeScript files into JavaScript and place them into the "dist" folder according to the tsconfig.json file) Note: If "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass" is not run or running that and typing "tsc" isn't working try "tsc.cmd" instead.

4. If you want to run individual files, type "cd dist" and then "node .\filename.js" (where filename is the file you would like to execute).


This project can be viewed in its entirety when viewed locally since there is currently no server deployed.
How to use the compiler browser-based app:

1. Open index.html in your browser. To do this you must locate the index.html in your file explorer.
Double-click it and it will open the page in the browser of your choosing. You may also copy and paste the local path into your browser by finding it in your file explorer, right clicking on it and copying the path to then paste into your browser.

2. Enter code in the input box.

3. Click the "Compile" button to see the compiled code populate the ouput text area.


