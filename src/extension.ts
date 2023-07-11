// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as net from 'net';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
	StreamInfo,
	Position as LSPosition,
	 Location as LSLocation 
} from 'vscode-languageclient/node';
import {Trace} from 'vscode-jsonrpc';
let client: LanguageClient;


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // The server is a started as a separate app and listens on port 5007
    let connectionInfo = {
        port: 3000
    };
    let serverOptions = () => {
        // Connect to language server via socket
        let socket = net.connect(connectionInfo);
        let result: StreamInfo = {
            writer: socket,
            reader: socket
        };
        return Promise.resolve(result);
    };
    
    let clientOptions: LanguageClientOptions = {
        documentSelector: ['gcl'],
        synchronize: {
            fileEvents: vscode.workspace.createFileSystemWatcher('**/*.gcl')
        }
    };
    
    // Create the language client and start the client.
    client = new LanguageClient('GCL Simplified Server', serverOptions, clientOptions);

    //client.setTrace(Trace.Verbose);
    client.start();

	//TODO try some simple ping pong with the localhost LSP server!
	//client.sendNotification();
	vscode.window.showInformationMessage(client.state.toString());

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "gb-mode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('gb-mode.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('gb-mode for guarded command language GuaBao ;)');
	});

	let disposable2 = vscode.commands.registerCommand('gb-mode.showFileName', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const suffixIsValid = vscode.workspace.textDocuments[0].fileName.endsWith('.gcl');
		if (suffixIsValid) {
			vscode.window.showInformationMessage(vscode.workspace.textDocuments[0].fileName);
		}
		else {
			vscode.window.showInformationMessage("Not a GCL filename (.gcl)");
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// TODO handle !client
	return client.stop();
}
