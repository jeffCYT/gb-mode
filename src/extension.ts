// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as net from 'net';
import * as connection$guabao from './connection';

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


function isGCL$1(editor : vscode.TextEditor) {
	return /\.gcl$/i.test(editor.document.fileName);
  }
   
export function activate(context: vscode.ExtensionContext) {
	// TODO [MISC] Helper functions within activate()
	var subsribe = function (x : any) { context.subscriptions.push(x); };
	var regCommand = function ( title : string, func : any ) {
		subsribe( vscode.commands.registerCommand(title, func) );
	};

	// TODO [STAGE] GlobalStorage
	// [JEF] not sure how much global stroage is being used
	// But the previouslyActivatedState feels like something should belong to globalStorage

	// TODO [STAGE] subscriptions [onNotification / onError / onOpenEditor / onCloseEditor]
	// vscode.window.onDidChangeActiveTextEditor;


	// TODO [STAGE] Connect
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

	// TOOD [JEFF][DEBUG] find out .ts linkage
	var res = connection$guabao.start();
	console.log(res);

	// TODO [STAGE] subscriptions [onActivateExtension (VIEW) / onDeactivateExtension]
	var visibleCount = vscode.window.visibleTextEditors.filter(isGCL$1).length; // This statement is merely transcribed for fun
	const panel = vscode.window.createWebviewPanel("RHS", "GauBao RHS Panel", vscode.ViewColumn.Two);

	// TODO [STAGE] subscriptions [onChangeCursorPosition]
	// TODO [STAGE] subscriptions [onChangeTextDocument]

	// TODO [STAGE] registerCommand [refine / restart / stop / start / debug ]

	// REMOVE_BEFORE_DEPLOY Sandbox
	regCommand('gb-mode.helloWorld', () => {
		vscode.window.showInformationMessage('gb-mode for guarded command language GuaBao ;)');
	});
	regCommand('gb-mode.showFileName', () => {
		const suffixIsValid = vscode.workspace.textDocuments[0].fileName.endsWith('.gcl');
		if (suffixIsValid) {
			vscode.window.showInformationMessage(vscode.workspace.textDocuments[0].fileName);
		}
		else {
			vscode.window.showInformationMessage("Not a GCL filename (.gcl)");
		}
	});



	// [JEFF] Testing if the extension configuration can be retreived correctly
	let config = vscode.workspace.getConfiguration();
	console.log(config.get('guabao.solver'));
}

export function deactivate() {
	// TODO handle !client
	return client.stop();
	// TODO list of clean ups before exiting
	// e.g. clean up called Solvers in case of in progress solving
}
