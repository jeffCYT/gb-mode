import * as LC from 'vscode-languageclient/node';
import * as vscode from 'vscode';

let PATH_EXISTS = true;
let GCLPATH = "/Users/geoffrsu/Library/Application Support/Code/User/globalStorage/scmlab.guabao/v0.3.11-macos/gcl";

export const startConnection = ()=>{
    if(PATH_EXISTS){
        let id:string = "guabao";
        let name: string = "Guabao Language Server";
        let serverOptions: LC.Executable = {
            command:GCLPATH,
            args: []
        };
        let clientOption: LC.LanguageClientOptions = {
            documentSelector: [{ scheme: 'file', language: id }],
            synchronize: {
                // Notify the server about file changes to '.clientrc files contained in the workspace
                fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
            }
            //errorHandler:,
            //initializationOptions:null
        };
        let languageClient = new LC.LanguageClient(id, name, serverOptions, clientOption)
    }else{
    }
}